// src/core/sitemapData.ts
import type {
  SdkWithCma,
  TreeItem,
  TreeSourceConfig,
  CMAEntryLike,
  MissingPathEntry,
} from "./types";

import { buildPath, normalizePath } from "./path";
import { computeStateFromSys } from "./state";

// ---------------------------------------------------------------------------
// In-memory cache (keyed by space/env/sources/locale, 60s TTL)
// Cache is only populated when spaceId is provided so unit tests without IDs
// are never affected by stale cache entries from other tests.
// ---------------------------------------------------------------------------

type SitemapResult = {
  items: TreeItem[];
  duplicates: DuplicatePath[];
  missingPaths: MissingPathEntry[];
};

type CacheEntry = { value: SitemapResult; expiry: number };

const sitemapCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000;

export function clearSitemapCache(): void {
  sitemapCache.clear();
}

function makeCacheKey(args: {
  spaceId: string;
  environmentId: string;
  sources: TreeSourceConfig[];
  locale: string;
}): string {
  return JSON.stringify({
    spaceId: args.spaceId,
    environmentId: args.environmentId,
    sources: args.sources,
    locale: args.locale,
  });
}

// ---------------------------------------------------------------------------
// 429 retry helpers (2 retries, 500ms / 1500ms back-off)
// ---------------------------------------------------------------------------

const RETRY_DELAYS_MS = [500, 1500];

function is429(err: unknown): boolean {
  const status =
    (err as { status?: number })?.status ??
    (err as { response?: { status?: number } })?.response?.status;
  if (typeof status === "number") return status === 429;
  // No structured status: fall back to a conservative message check. Use a
  // word-boundary match so unrelated numbers that merely contain "429" don't
  // trigger needless retries.
  const msg = err instanceof Error ? err.message : String(err);
  return /\b429\b/.test(msg) || /rate.?limit/i.test(msg);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (is429(err) && attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt]);
        continue;
      }
      throw err;
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocalizedString(
  fieldValue: unknown,
  locale: string,
): string | null {
  if (typeof fieldValue === "string") return fieldValue;

  if (fieldValue && typeof fieldValue === "object") {
    const obj = fieldValue as Record<string, unknown>;
    const localized = obj?.[locale];
    if (typeof localized === "string") return localized;

    const first = Object.values(obj).find((v) => typeof v === "string");
    return typeof first === "string" ? first : null;
  }

  return null;
}

async function fetchAllEntriesForContentType(
  sdk: SdkWithCma,
  contentTypeId: string,
): Promise<CMAEntryLike[]> {
  const items: CMAEntryLike[] = [];
  let skip = 0;
  const limit = 1000;

  while (true) {
    const res = await fetchWithRetry(() =>
      sdk.cma.entry.getMany({
        query: {
          content_type: contentTypeId,
          limit,
          skip,
          order: "sys.createdAt",
        },
      }),
    );

    const batch = res.items ?? [];
    items.push(...batch);

    if (batch.length < limit) break;
    skip += limit;
  }

  return items;
}

export type DuplicatePath = { path: string; entries: TreeItem[] };

function pickWinnerByCreatedAt(entries: TreeItem[]): TreeItem {
  // TreeItem doesn't carry createdAt; "winner" is currently based on fetch order.
  // If you later choose to include createdAt in TreeItem, update here to compare it.
  return entries[0];
}

function dedupeByPath(items: TreeItem[]): {
  items: TreeItem[];
  duplicates: DuplicatePath[];
} {
  const normalized = items
    .map((i) => ({ ...i, path: normalizePath(i.path) }))
    .filter((i) => Boolean(i.path));

  const grouped = new Map<string, TreeItem[]>();
  for (const item of normalized) {
    const arr = grouped.get(item.path) ?? [];
    arr.push(item);
    grouped.set(item.path, arr);
  }

  const deduped: TreeItem[] = [];
  const duplicates: DuplicatePath[] = [];

  for (const [path, entries] of grouped.entries()) {
    if (entries.length === 1) {
      deduped.push(entries[0]);
      continue;
    }

    // Stable, explicit "winner"
    const winner = pickWinnerByCreatedAt(entries);
    deduped.push(winner);

    // Stable ordering for UI
    const sortedEntries = [...entries].sort((a, b) => {
      const byCt = a.contentTypeId.localeCompare(b.contentTypeId);
      if (byCt !== 0) return byCt;
      return a.entryId.localeCompare(b.entryId);
    });

    duplicates.push({ path, entries: sortedEntries });
  }

  duplicates.sort((a, b) => a.path.localeCompare(b.path));

  return { items: deduped, duplicates };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function loadSitemapItems(args: {
  sdk: SdkWithCma;
  sources: TreeSourceConfig[];
  locale: string;
  /** Pass sdk.ids.space to enable the in-memory cache. */
  spaceId?: string;
  /** Pass sdk.ids.environmentAlias ?? sdk.ids.environment to enable the cache. */
  environmentId?: string;
}): Promise<SitemapResult> {
  const { sdk, sources, locale, spaceId, environmentId } = args;

  if (!sources?.length) return { items: [], duplicates: [], missingPaths: [] };

  // Cache look-up (only when caller supplies BOTH space and env ids).
  // Requiring environmentId prevents two different environments in the same
  // space from colliding on an empty-string env key and serving each other's data.
  const useCache = Boolean(spaceId && environmentId);
  const cacheKey = useCache
    ? makeCacheKey({ spaceId: spaceId!, environmentId: environmentId!, sources, locale })
    : "";

  if (useCache) {
    const cached = sitemapCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) return cached.value;
  }

  // Fetch sources sequentially to cap concurrency and avoid thundering-herd
  const results: Array<{ mapped: TreeItem[]; missing: MissingPathEntry[] }> =
    [];

  for (const source of sources) {
    const entries = await fetchAllEntriesForContentType(sdk, source.contentTypeId);

    const mapped: TreeItem[] = [];
    const missing: MissingPathEntry[] = [];

    for (const e of entries) {
      // TITLE (optional)
      let title: string | undefined;
      if (source.titleFieldId) {
        const titleFieldVal = e.fields[source.titleFieldId];
        const rawTitle = getLocalizedString(titleFieldVal, locale);
        if (rawTitle?.trim()) title = rawTitle.trim();
      }

      // PATH
      const pathFieldVal = e.fields[source.pathFieldId];
      const rawPath = getLocalizedString(pathFieldVal, locale);
      const path = rawPath
        ? buildPath(source.routePrefix ?? "", rawPath)
        : "";

      if (!path) {
        // Entry cannot be placed in the tree — surface it instead of dropping it.
        missing.push({
          entryId: e.sys.id,
          contentTypeId: source.contentTypeId,
          title,
          state: computeStateFromSys(e.sys),
        });
        continue;
      }

      mapped.push({
        entryId: e.sys.id,
        contentTypeId: source.contentTypeId,
        path,
        title,
        state: computeStateFromSys(e.sys),
      });
    }

    results.push({ mapped, missing });
  }

  const { items, duplicates } = dedupeByPath(
    results.flatMap((r) => r.mapped),
  );

  const missingPaths = results
    .flatMap((r) => r.missing)
    .sort((a, b) => {
      const byCt = a.contentTypeId.localeCompare(b.contentTypeId);
      if (byCt !== 0) return byCt;
      return (a.title ?? a.entryId).localeCompare(b.title ?? b.entryId);
    });

  const value: SitemapResult = { items, duplicates, missingPaths };

  if (useCache) {
    sitemapCache.set(cacheKey, { value, expiry: Date.now() + CACHE_TTL_MS });
  }

  return value;
}
