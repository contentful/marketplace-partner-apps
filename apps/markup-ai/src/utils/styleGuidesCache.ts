import type { TargetResponse } from "../api-client/types.gen";

/**
 * Cross-iframe cache for the `/internal/targets` (style guides) response.
 *
 * Each Markup AI-enabled field on the entry editor renders inside its own
 * iframe, so they each run a separate React tree and a separate react-query
 * cache. Without this layer, N enabled fields → N network calls per page
 * load. localStorage is shared across same-origin iframes, so a value
 * written by the first field is read by the rest within the TTL.
 */

const CACHE_KEY = "markupai.styleGuidesCache.v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  /** Hash of the api key that fetched this. Mismatch invalidates the entry. */
  apiKeyFingerprint: string;
  timestamp: number;
  styleGuides: TargetResponse[];
}

/**
 * Stable, non-reversible fingerprint of the api key. Avoids storing the raw
 * token in localStorage while still letting us invalidate when the user
 * switches accounts. Also reused by `useStyleGuides` to scope the
 * react-query cache key per user — without that scoping, the in-memory
 * cache could serve a previous user's style guides after an account switch.
 */
export function fingerprintApiKey(apiKey: string): string {
  // Iterate by code points (`for...of`) rather than UTF-16 code units so a
  // surrogate pair is hashed once as the full code point — an index-based
  // loop with `codePointAt(i)` would count it twice (full code point + low
  // surrogate). Modulo keeps the magnitude bounded so the multiplication
  // stays inside JavaScript's safe-integer precision even for long tokens.
  let hash = 0;
  for (const ch of apiKey) {
    hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) % 0xffffffff;
  }
  return `len${String(apiKey.length)}_${hash.toString(36)}`;
}

export function readStyleGuidesCache(apiKey: string | null | undefined): TargetResponse[] | null {
  if (!apiKey || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isCacheEntry(parsed)) return null;
    if (parsed.apiKeyFingerprint !== fingerprintApiKey(apiKey)) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.styleGuides;
  } catch {
    return null;
  }
}

export function writeStyleGuidesCache(
  apiKey: string | null | undefined,
  styleGuides: TargetResponse[],
): void {
  if (!apiKey || typeof localStorage === "undefined") return;
  try {
    const entry: CacheEntry = {
      apiKeyFingerprint: fingerprintApiKey(apiKey),
      timestamp: Date.now(),
      styleGuides,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore — quota exceeded or storage disabled
  }
}

export function clearStyleGuidesCache(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

function isCacheEntry(value: unknown): value is CacheEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.apiKeyFingerprint === "string" &&
    typeof v.timestamp === "number" &&
    Array.isArray(v.styleGuides)
  );
}
