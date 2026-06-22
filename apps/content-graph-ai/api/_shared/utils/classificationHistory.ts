/**
 * classificationHistory.ts
 *
 * Layer: Short-term learning — per-entry classification history.
 *
 * Tracks every successful classification output so subsequent runs can:
 *   1. Detect drift — fields that changed or confidence that dropped
 *   2. Skip re-classifying pages whose content hasn't changed (future)
 *   3. Feed historical outputs to the few-shot prompt builder
 *
 * Cache file: .cache/classification-history.json (gitignored)
 * Configure path: HISTORY_CACHE_PATH env var
 */

import * as fs from "fs";
import * as path from "path";
import { CLASSIFIER_PROMPT_VERSION } from "../config/classifierPipeline.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CACHE_FILE =
  process.env.HISTORY_CACHE_PATH ||
  path.resolve(".cache/classification-history.json");

// Fields treated as semantically significant for drift alerts
const SEMANTIC_FIELDS = [
  "assetType",
  "assetSubType",
  "schemaType",
  "product",
  "topic",
  "funnelStage",
  "industry",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface HistoryFieldSnapshot {
  value: unknown;
  confidence: number;
}

export interface HistoryEntry {
  entryId: string;
  title: string;
  url: string;
  classifiedAt: string; // ISO 8601
  overallConfidence: number;
  needsReview: boolean;
  fields: Record<string, HistoryFieldSnapshot>;
  contentHash?: string; // SHA-256 of (slug + title + bodySummary) — used to skip re-classification
  /** Prompt version used for this classification — enables filtering few-shot examples by prompt era. */
  promptVersion?: string;
  /** Raw reasoning string from the classifier — persisted so cache hits can reconstruct fieldProvenance. */
  reasoning?: string;
  /** Competitive positioning result — persisted so cache hits return accurate competitor data. */
  competitivePositioning?: {
    mentionsCompetitors: boolean;
    competitorNames?: string[];
    competitorCategories?: string[];
    positioningType?: string;
  };
}

export interface DriftReport {
  entryId: string;
  title: string;
  changedFields: Array<{
    field: string;
    before: unknown;
    after: unknown;
    confidenceDelta: number; // positive = improved, negative = degraded
  }>;
  confidenceDelta: number; // overall confidence change
  hasRegressions: boolean; // any semantic field changed or confidence dropped >0.10
}

type HistoryStore = Record<string, HistoryEntry>;

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

// Module-level cache to avoid re-reading the history JSON on every call.
// Invalidated on any write (recordClassification).
let _historyCache: { data: HistoryStore; ts: number } | null = null;
const HISTORY_CACHE_TTL = 60_000;

function loadHistoryCached(): HistoryStore {
  if (_historyCache && Date.now() - _historyCache.ts < HISTORY_CACHE_TTL)
    return _historyCache.data;
  const data = loadHistory();
  _historyCache = { data, ts: Date.now() };
  return data;
}

function loadHistory(): HistoryStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as HistoryStore;
    }
  } catch {
    /* corrupt or missing — start fresh */
  }
  return {};
}

function saveHistory(store: HistoryStore): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    /* non-fatal */
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Persist a classification result to history.
 * Returns a drift report if a previous entry exists, otherwise null.
 */
export function recordClassification(entry: HistoryEntry): DriftReport | null {
  const store = loadHistoryCached();
  const previous = store[entry.entryId] ?? null;

  store[entry.entryId] = entry;
  _historyCache = null; // invalidate cache on write
  saveHistory(store);

  if (!previous) return null;
  return computeDrift(previous, entry);
}

/**
 * Look up the last saved classification for an entry.
 */
export function getLastClassification(entryId: string): HistoryEntry | null {
  const store = loadHistoryCached();
  return store[entryId] ?? null;
}

/**
 * Return the full in-memory history map for callers that need to scan many
 * entries in one pass without rereading the cache file per lookup.
 */
export function getClassificationHistory(): Record<string, HistoryEntry> {
  return loadHistoryCached();
}

/**
 * Returns the last classification for an entry IF its contentHash matches.
 * When the hash matches, content hasn't changed and we can return the cached result.
 * Returns null if no history, no hash stored, or content has changed.
 */
export function getCachedClassification(
  entryId: string,
  contentHash: string,
): HistoryEntry | null {
  const entry = getLastClassification(entryId);
  if (!entry?.contentHash) return null;
  if (entry.contentHash !== contentHash) return null;
  // Invalidate cache if prompt version has changed — prevents stale hallucinated
  // values from persisting across prompt upgrades. Entries saved before promptVersion
  // was added will have promptVersion: undefined — those are not invalidated.
  if (entry.promptVersion && entry.promptVersion !== CLASSIFIER_PROMPT_VERSION) return null;
  return entry;
}

/**
 * Return the N most recent history entries, sorted newest first.
 * Used by feedbackStore to seed few-shot examples when no human corrections exist.
 */
export function getRecentClassifications(limit = 10): HistoryEntry[] {
  const store = loadHistoryCached();
  return Object.values(store)
    .sort(
      (a, b) =>
        new Date(b.classifiedAt).getTime() - new Date(a.classifiedAt).getTime(),
    )
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Drift detection
// ---------------------------------------------------------------------------
function stringify(val: unknown): string {
  if (Array.isArray(val)) return val.join(", ");
  if (val === null || val === undefined) return "";
  return String(val);
}

function computeDrift(prev: HistoryEntry, next: HistoryEntry): DriftReport {
  const changedFields: DriftReport["changedFields"] = [];

  const allFields = new Set([
    ...Object.keys(prev.fields),
    ...Object.keys(next.fields),
  ]);

  for (const field of allFields) {
    const p = prev.fields[field];
    const n = next.fields[field];
    const prevVal = stringify(p?.value);
    const nextVal = stringify(n?.value);

    if (prevVal !== nextVal) {
      changedFields.push({
        field,
        before: p?.value ?? null,
        after: n?.value ?? null,
        confidenceDelta: (n?.confidence ?? 0) - (p?.confidence ?? 0),
      });
    }
  }

  const confidenceDelta = next.overallConfidence - prev.overallConfidence;
  const hasRegressions =
    confidenceDelta < -0.1 ||
    changedFields.some((f) => SEMANTIC_FIELDS.includes(f.field));

  return {
    entryId: next.entryId,
    title: next.title,
    changedFields,
    confidenceDelta,
    hasRegressions,
  };
}
