import type { Environment } from "contentful-management";

/** Minimal shape of a Contentful entry as returned by both CDA and CMA */
type EntryLike = {
  sys?: { id?: string; type?: string; contentType?: { sys?: { id?: string } } };
  fields?: Record<string, unknown>;
  nodeType?: string;
  value?: string;
  content?: EntryLike[];
  data?: { target?: EntryLike };
};

/** A field value as returned by the CMA (locale-wrapped or raw) */
type CmaFieldValue = Record<string, unknown> | string | string[] | EntryLike | EntryLike[] | null | undefined;

// Skip known noise content types that dilute classification signal
export const NOISE_CONTENT_TYPES = new Set([
  "navigationMenu",
  "navigation",
  "navMenu",
  "footer",
  "footerMenu",
  "headerMenu",
  "megaMenu",
  "siteNav",
  "globalNav",
  "cookieBanner",
  "legalPage",
  "relatedContent",
  "relatedArticles",
  "cardGrid",
]);

// ---------------------------------------------------------------------------
// Zone types — structural content regions for field-specific evidence routing
// ---------------------------------------------------------------------------

export type ZoneType =
  | "hero" // Page hero / headline section
  | "summary" // SEO meta, subtitle, page summary
  | "subtitle" // Secondary headline or deck copy
  | "section_heading" // Named body section headings
  | "body" // Main body / feature sections
  | "quote" // Customer quote or testimonial
  | "speaker" // Speaker / author / title metadata
  | "cta" // Call-to-action blocks
  | "footer" // Footer / boilerplate
  | "unknown"; // Uncategorized

export interface ContentZone {
  /** Human-readable name of this component (from Contentful name/title field) */
  name: string;
  /** Contentful content type ID of the component, if known */
  contentTypeId: string | null;
  /** Semantic zone category */
  zoneType: ZoneType;
  /** Extracted text content for this zone */
  text: string;
  /**
   * Relative signal weight (0–1).
   * hero/summary=1.0, body=0.7, quote/speaker=0.5, cta=0.6, footer=0.2
   */
  weight: number;
  /** Approximate position in page (0.0=top, 1.0=bottom) */
  position: number;
}

export interface ZonedCrawlResult {
  /** Flat text — backward-compatible with all existing callers */
  text: string;
  /** Structured zones for field-specific evidence routing */
  zones: ContentZone[];
  /**
   * Flat (CDA-resolved, locale-unwrapped) entry fields from the root entry.
   * Available for metadata extraction — no locale wrapper needed.
   */
  entryFields: Record<string, unknown>;
  /** Contentful sys metadata for the root entry */
  entrySys: { id: string; contentType: { sys: { id: string } }; [key: string]: unknown };
}

// Zone classification: name patterns → zone type
const ZONE_NAME_PATTERNS: Array<[RegExp, ZoneType]> = [
  [/\bhero\b|\bheadline\b|\bpage[\s_-]header\b|\bpage[\s_-]intro\b/i, "hero"],
  [/\bseo\b|\bmeta\b|\bpage[\s_-]summary\b|\boverview\b/i, "summary"],
  [/\bsubtitle\b|\bdeck\b|\bsubhead\b|\blede\b|\bbyline\b/i, "subtitle"],
  [
    /\bh[1-6]\b|\bheading\b|\bsection[\s_-]title\b|\bsection[\s_-]heading\b/i,
    "section_heading",
  ],
  [
    /\bquote\b|\btestimonial\b|\bcustomer[\s_-]quote\b|\bpull[\s_-]quote\b/i,
    "quote",
  ],
  [/\bspeaker\b|\bauthor\b|\bpresenter\b|\bbio\b|\bheadshot\b/i, "speaker"],
  [
    /\bcta\b|\bcall[\s_-]to[\s_-]action\b|\bbutton\b|\bcontact[\s_-]sales\b/i,
    "cta",
  ],
  [/\bfooter\b|\bboilerplate\b|\bdisclaimer\b|\bcopyright\b/i, "footer"],
  [/\bsection\b|\bmodule\b|\bblock\b|\brow\b|\btout\b/i, "body"],
];

const ZONE_CT_PATTERNS: Array<[RegExp, ZoneType]> = [
  [/hero/i, "hero"],
  [/quote|testimonial/i, "quote"],
  [/speaker|author|bio/i, "speaker"],
  [/cta|button|callToAction/i, "cta"],
  [/footer/i, "footer"],
  [/seo|meta|summary/i, "summary"],
  [/heading|sectionTitle|sectionHeading|h[1-6]Block/i, "section_heading"],
];

const ZONE_WEIGHTS: Record<ZoneType, number> = {
  hero: 1.0,
  summary: 1.0,
  subtitle: 0.9,
  section_heading: 0.8,
  body: 0.7,
  cta: 0.6,
  quote: 0.5,
  speaker: 0.4,
  footer: 0.2,
  unknown: 0.5,
};

function classifyZoneType(
  name: string,
  contentTypeId: string | null,
): ZoneType {
  for (const [pattern, zoneType] of ZONE_NAME_PATTERNS) {
    if (pattern.test(name)) return zoneType;
  }
  if (contentTypeId) {
    for (const [pattern, zoneType] of ZONE_CT_PATTERNS) {
      if (pattern.test(contentTypeId)) return zoneType;
    }
  }
  return "unknown";
}

/** Extract the human-readable name of a Contentful entry */
function getEntryName(entry: EntryLike): string | null {
  const fields = entry?.fields;
  if (!fields) return null;
  // Prefer name > title (internalName/internalTitle are excluded from text extraction
  // but are still useful for zone classification, so we check them here only)
  for (const key of ["name", "title", "internalName", "internalTitle"]) {
    const val = fields[key];
    if (!val) continue;
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "object" && !Array.isArray(val)) {
      const asRecord = val as Record<string, unknown>;
      const inner = asRecord["en-US"] ?? Object.values(asRecord)[0];
      if (typeof inner === "string" && inner.trim()) return inner.trim();
    }
  }
  return null;
}

const NOISE_FIELD_KEYS = new Set([
  "internalName",
  "internalTitle",
  "slug",
  "path",
  "url",
  "href",
  "anchorId",
  "theme",
  "variant",
  "alignment",
  "layout",
  "buttonStyle",
  "style",
]);

const MAX_CRAWL_CHARS = 250_000;
const MAX_CRAWL_ENTRIES = 250;

type CrawlState = {
  visited: Set<string>;
  remainingChars: number;
  visitedEntries: number;
};

function createCrawlState(maxChars = MAX_CRAWL_CHARS): CrawlState {
  return {
    visited: new Set<string>(),
    remainingChars: maxChars,
    visitedEntries: 0,
  };
}

function normalizeExtractedText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function appendText(parts: string[], value: string, state: CrawlState): void {
  if (!value || state.remainingChars <= 0) return;
  const normalized = normalizeExtractedText(value);
  if (!normalized) return;
  const capped = normalized.slice(0, state.remainingChars);
  if (!capped) return;
  parts.push(capped);
  state.remainingChars -= capped.length;
}

function shouldSkipField(key: string): boolean {
  return (
    key.startsWith("ai") || key.startsWith("sys") || NOISE_FIELD_KEYS.has(key)
  );
}

// ─── CDA-based crawler (preferred — resolves all references in one call) ───

function richTextToPlain(node: EntryLike, state: CrawlState): string {
  if (!node || state.remainingChars <= 0) return "";

  const parts: string[] = [];
  if (node.nodeType === "text") {
    appendText(parts, node.value || "", state);
    return parts.join(" ");
  }

  if (
    node.nodeType === "embedded-entry-block" ||
    node.nodeType === "embedded-entry-inline"
  ) {
    const embedded = node.data?.target;
    if (embedded?.fields) {
      const embeddedText = extractFieldText(embedded, state);
      if (embeddedText) parts.push(embeddedText);
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      const childText = richTextToPlain(child, state);
      if (childText) parts.push(childText);
      if (state.remainingChars <= 0) break;
    }
  }

  return parts.join(" ");
}

function extractFieldText(
  entry: EntryLike,
  state: CrawlState = createCrawlState(),
): string {
  if (!entry?.fields || state.remainingChars <= 0) return "";

  const id = entry.sys?.id;
  if (id && state.visited.has(id)) return "";
  if (state.visitedEntries >= MAX_CRAWL_ENTRIES) return "";
  if (id) {
    state.visited.add(id);
    state.visitedEntries += 1;
  }

  const ctId = entry.sys?.contentType?.sys?.id;
  if (ctId && NOISE_CONTENT_TYPES.has(ctId)) return "";

  const parts: string[] = [];
  for (const [key, value] of Object.entries(entry.fields)) {
    if (shouldSkipField(key) || !value || state.remainingChars <= 0) continue;

    if (typeof value === "string") {
      appendText(parts, value, state);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string"
    ) {
      appendText(parts, value.join(", "), state);
    } else if ((value as EntryLike)?.nodeType === "document") {
      const richText = richTextToPlain(value as EntryLike, state);
      if (richText) parts.push(richText);
    } else if (
      (value as EntryLike)?.sys?.type === "Entry" &&
      (value as EntryLike)?.fields
    ) {
      const childText = extractFieldText(value as EntryLike, state);
      if (childText) parts.push(childText);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      (value[0] as EntryLike)?.sys?.type === "Entry"
    ) {
      for (const ref of value) {
        if (!(ref as EntryLike)?.fields) continue;
        const childText = extractFieldText(ref as EntryLike, state);
        if (childText) parts.push(childText);
        if (state.remainingChars <= 0) break;
      }
    }
  }

  return parts.filter(Boolean).join("\n");
}

// ---------------------------------------------------------------------------
// Zone-aware extraction (CDA path)
// ---------------------------------------------------------------------------

type ZoneState = CrawlState & {
  zones: ContentZone[];
  totalZones: number;
};

const MAX_ZONES = 80;

function createZoneState(maxChars = MAX_CRAWL_CHARS): ZoneState {
  return {
    visited: new Set<string>(),
    remainingChars: maxChars,
    visitedEntries: 0,
    zones: [],
    totalZones: 0,
  };
}

/**
 * Recursively extract text from an entry, emitting a ContentZone for each
 * top-level child component (depth=1 entries). Depth-0 is the root page entry
 * (not itself a zone). Depth>=2 content is folded into the parent zone's text.
 */
function extractEntryZones(
  entry: EntryLike,
  state: ZoneState,
  depth = 0,
  parentZone: ContentZone | null = null,
): void {
  if (!entry?.fields || state.remainingChars <= 0) return;

  const id = entry.sys?.id;
  if (id && state.visited.has(id)) return;
  if (state.visitedEntries >= MAX_CRAWL_ENTRIES) return;
  if (id) {
    state.visited.add(id);
    state.visitedEntries += 1;
  }

  const ctId = entry.sys?.contentType?.sys?.id ?? null;
  if (ctId && NOISE_CONTENT_TYPES.has(ctId)) return;

  // At depth >= 1, each direct child of the root becomes a zone
  let currentZone: ContentZone | null = parentZone;
  if (depth === 1 && state.totalZones < MAX_ZONES) {
    const name = getEntryName(entry) ?? ctId ?? `zone-${state.totalZones}`;
    const zoneType = classifyZoneType(name, ctId);
    currentZone = {
      name,
      contentTypeId: ctId,
      zoneType,
      text: "",
      weight: ZONE_WEIGHTS[zoneType],
      position: 0, // filled in after all zones are collected
    };
    state.zones.push(currentZone);
    state.totalZones += 1;
  }

  // Collect text for this entry's own string fields
  const localParts: string[] = [];
  for (const [key, value] of Object.entries(entry.fields)) {
    if (shouldSkipField(key) || !value || state.remainingChars <= 0) continue;

    if (typeof value === "string") {
      const normalized = normalizeExtractedText(value);
      if (normalized) {
        localParts.push(normalized.slice(0, state.remainingChars));
        state.remainingChars -= Math.min(
          normalized.length,
          state.remainingChars,
        );
      }
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      typeof value[0] === "string"
    ) {
      const joined = (value as string[]).join(", ");
      const normalized = normalizeExtractedText(joined);
      if (normalized) {
        localParts.push(normalized.slice(0, state.remainingChars));
        state.remainingChars -= Math.min(
          normalized.length,
          state.remainingChars,
        );
      }
    } else if ((value as EntryLike)?.nodeType === "document") {
      const rt = richTextToPlain(value as EntryLike, state);
      if (rt) localParts.push(rt);
    } else if (
      (value as EntryLike)?.sys?.type === "Entry" &&
      (value as EntryLike)?.fields
    ) {
      // Recurse into child entry — fold into current zone at depth >= 1
      extractEntryZones(value as EntryLike, state, depth + 1, currentZone);
    } else if (
      Array.isArray(value) &&
      value.length > 0 &&
      (value[0] as EntryLike)?.sys?.type === "Entry"
    ) {
      for (const ref of value as EntryLike[]) {
        if (!ref?.fields || state.remainingChars <= 0) continue;
        extractEntryZones(ref, state, depth + 1, currentZone);
      }
    }
  }

  const localText = localParts.filter(Boolean).join(" ").trim();
  if (localText) {
    if (currentZone) {
      currentZone.text = currentZone.text
        ? `${currentZone.text} ${localText}`
        : localText;
    }
    // Also maintain the flat text budget (already decremented above)
  }
}

// ---------------------------------------------------------------------------
// CDA client — lazy singleton (created once per process, reused on every call)
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _cdaClient: any | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCdaClient(): Promise<any> {
  if (_cdaClient) return _cdaClient;

  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const cdaToken =
    process.env.CONTENTFUL_CDA_TOKEN || process.env.CONTENTFUL_DELIVERY_TOKEN;

  if (!spaceId || !cdaToken) {
    throw new Error(
      "Missing CONTENTFUL_SPACE_ID or CONTENTFUL_CDA_TOKEN for CDA crawl. Set CONTENTFUL_CDA_TOKEN in env.",
    );
  }

  const { createClient } = await import("contentful");
  _cdaClient = createClient({
    space: spaceId,
    accessToken: cdaToken,
    environment: process.env.CONTENTFUL_ENV_ID || "master",
  });
  return _cdaClient;
}

/**
 * Fetch an entry via CDA with all references resolved (up to 10 levels deep),
 * then extract both flat text and structured zones. One API call.
 *
 * Returns ZonedCrawlResult. The `.text` field is backward-compatible with
 * all existing callers. The `.zones` field is used by zone-aware signal
 * extraction and classifier prompting.
 */
export async function crawlViaCda(
  entryId: string,
  locale = "en-US",
): Promise<ZonedCrawlResult> {
  const client = await getCdaClient();

  const entry = await client.getEntry(entryId, {
    include: 10,
    locale,
  });

  // Flat text (existing behaviour — unchanged)
  const flatState = createCrawlState();
  const text = extractFieldText(entry, flatState);

  // Zone-aware extraction
  const zoneState = createZoneState();
  extractEntryZones(entry, zoneState, 0, null);

  // Assign normalized positions (0.0–1.0) based on zone order
  const zones = zoneState.zones;
  zones.forEach((z, i) => {
    z.position = zones.length > 1 ? i / (zones.length - 1) : 0;
  });

  return {
    text,
    zones,
    entryFields: (entry.fields ?? {}) as Record<string, unknown>,
    entrySys: entry.sys as { id: string; contentType: { sys: { id: string } }; [key: string]: unknown },
  };
}

// ─── Management API fallback crawler (used when CDA token is unavailable) ───

export class RecursiveContentCrawler {
  private environment: Environment;
  private entryCache = new Map<string, EntryLike>();

  constructor(environment: Environment) {
    this.environment = environment;
  }

  private getFieldValue(fieldVal: CmaFieldValue): unknown {
    if (!fieldVal || typeof fieldVal !== "object" || Array.isArray(fieldVal)) {
      return fieldVal;
    }
    const asRecord = fieldVal as Record<string, unknown>;
    if ("en-US" in asRecord) return asRecord["en-US"];
    const [firstValue] = Object.values(asRecord);
    return firstValue;
  }

  private async batchFetchEntries(ids: string[]): Promise<void> {
    const uncached = ids.filter((id) => !this.entryCache.has(id));
    if (uncached.length === 0) return;

    const CHUNK = 100;
    for (let i = 0; i < uncached.length; i += CHUNK) {
      const chunk = uncached.slice(i, i + CHUNK);
      try {
        const result = await this.environment.getEntries({
          "sys.id[in]": chunk.join(","),
          limit: chunk.length,
        });
        for (const entry of result.items) {
          this.entryCache.set(entry.sys.id, entry);
        }
      } catch (err) {
        console.warn(
          `[RecursiveContentCrawler] batch fetch failed for ${chunk.length} entries:`,
          err,
        );
      }
    }
  }

  private collectLinkedIds(entry: EntryLike): string[] {
    if (!entry?.fields) return [];
    const ids: string[] = [];

    for (const fieldVal of Object.values(entry.fields)) {
      const value = this.getFieldValue(fieldVal as CmaFieldValue);
      if (!value) continue;

      const v = value as EntryLike;
      if (this.isLink(v)) {
        if (v.sys?.id) ids.push(v.sys.id);
      } else if (Array.isArray(value)) {
        for (const item of value as EntryLike[]) {
          if (this.isLink(item) && item.sys?.id) ids.push(item.sys.id);
        }
      } else if ((v as EntryLike)?.nodeType === "document") {
        this.collectRichTextIds(v, ids);
      }
    }

    return ids;
  }

  private collectRichTextIds(node: EntryLike, ids: string[]): void {
    if (!node) return;
    if (
      (node.nodeType === "embedded-entry-block" ||
        node.nodeType === "embedded-entry-inline") &&
      node.data?.target?.sys?.id
    ) {
      ids.push(node.data.target.sys.id);
    }
    if (Array.isArray(node.content)) {
      for (const child of node.content) this.collectRichTextIds(child, ids);
    }
  }

  async extractTextRecursive(
    entry: EntryLike,
    depth = 0,
    maxDepth = 4,
    state: CrawlState = createCrawlState(),
  ): Promise<string> {
    if (
      !entry ||
      !entry.fields ||
      depth > maxDepth ||
      state.remainingChars <= 0
    )
      return "";
    const entryId = entry.sys?.id ?? "";
    if (state.visited.has(entryId)) return "";
    if (state.visitedEntries >= MAX_CRAWL_ENTRIES) return "";

    if (depth > 0) {
      const ctId = entry.sys?.contentType?.sys?.id;
      if (ctId && NOISE_CONTENT_TYPES.has(ctId)) return "";
    }

    state.visited.add(entryId);
    state.visitedEntries += 1;

    if (depth < maxDepth) {
      const linkedIds = this.collectLinkedIds(entry);
      if (linkedIds.length > 0) {
        await this.batchFetchEntries(linkedIds);
      }
    }

    const textParts: string[] = [];

    for (const [key, fieldVal] of Object.entries(entry.fields)) {
      const raw = this.getFieldValue(fieldVal as CmaFieldValue);
      if (!raw || shouldSkipField(key) || state.remainingChars <= 0) continue;

      if (typeof raw === "string") {
        appendText(textParts, raw, state);
      } else if (
        Array.isArray(raw) &&
        raw.length > 0 &&
        typeof raw[0] === "string"
      ) {
        appendText(textParts, (raw as string[]).join(", "), state);
      } else {
        const value = raw as EntryLike;
        if (value.nodeType === "document") {
          const rt = await this.extractRichTextAsync(value, depth, maxDepth, state);
          if (rt) textParts.push(rt);
        } else if (this.isLink(value)) {
          const child = this.entryCache.get(value.sys?.id ?? "");
          if (child) {
            const childText = await this.extractTextRecursive(child, depth + 1, maxDepth, state);
            if (childText) textParts.push(childText);
          }
        } else if (Array.isArray(raw) && raw.length > 0 && this.isLink(raw[0] as EntryLike)) {
          for (const link of raw as EntryLike[]) {
            if (state.remainingChars <= 0) break;
            const child = this.entryCache.get(link.sys?.id ?? "");
            if (!child) continue;
            const childText = await this.extractTextRecursive(child, depth + 1, maxDepth, state);
            if (childText) textParts.push(childText);
          }
        }
      }
    }

    return textParts.join("\n");
  }

  private isLink(obj: EntryLike): boolean {
    return !!(obj && obj.sys && obj.sys.type === "Link");
  }

  private async extractRichTextAsync(
    document: EntryLike,
    depth: number,
    maxDepth: number,
    state: CrawlState,
  ): Promise<string> {
    const textSegments: string[] = [];

    const walkNode = async (node: EntryLike) => {
      if (!node || state.remainingChars <= 0) return;

      if (node.nodeType === "text") {
        appendText(textSegments, node.value || "", state);
      } else if (
        (node.nodeType === "embedded-entry-block" ||
          node.nodeType === "embedded-entry-inline") &&
        node.data?.target?.sys?.id
      ) {
        if (depth < maxDepth) {
          const nestedEntry = this.entryCache.get(node.data.target.sys.id);
          if (nestedEntry) {
            const nestedText = await this.extractTextRecursive(
              nestedEntry,
              depth + 1,
              maxDepth,
              state,
            );
            if (nestedText) textSegments.push(nestedText);
          }
        }
      }

      if (Array.isArray(node.content)) {
        for (const child of node.content) {
          await walkNode(child);
          if (state.remainingChars <= 0) break;
        }
      }
    };

    if (document) await walkNode(document);
    return textSegments.join(" ");
  }
}
