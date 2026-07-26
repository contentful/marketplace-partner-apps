/**
 * feedbackStore.ts
 *
 * Layer: Medium-term + long-term learning — human corrections as ground truth.
 *
 * Workflow:
 *   1. Content team reviews a CSV export and writes corrections here (or via
 *      the Contentful sidebar app in a future integration).
 *   2. On the next classifier run, corrections are applied as hard overrides
 *      AFTER AI output — same as deterministic signal overrides.
 *   3. Corrections are also formatted as few-shot examples and injected into
 *      the AI prompt, teaching the model what a correct classification looks
 *      like for this content type.
 *
 * Two-layer store:
 *   seeds/feedback-corrections.json  — committed to git; the verified "plan"
 *   .cache/feedback-corrections.json — runtime overlay; gitignored (local overrides)
 *
 * Load priority: runtime cache wins over seed (per-entry merge, not whole-file replace).
 * Save path: always writes to .cache/ so seeds stay clean.
 * Configure runtime path: FEEDBACK_STORE_PATH env var
 *
 * To promote a runtime correction to the seed (so all environments get it):
 *   1. Copy the entry from .cache/feedback-corrections.json into seeds/feedback-corrections.json
 *   2. Commit seeds/feedback-corrections.json
 *
 * Semantic Few-Shot Selection (2026-03-05):
 *   When a queryEmbedding is provided to buildFewShotBlock(), corrections are
 *   ranked by embedding cosine similarity instead of recency. This ensures the
 *   most *relevant* corrections are injected into the prompt, not just the
 *   most *recent* ones. Embeddings are computed lazily and cached in the
 *   correction store alongside the correction data.
 *
 *   Fallback: if < MIN_EMBED_FOR_SEMANTIC corrections have embeddings, or if
 *   the embedding API is unavailable, the function falls back to recency sort.
 */

import * as fs from "fs";
import * as path from "path";
import type { VendorTraceCollector } from "./vendorTrace.js";
import { CLASSIFIER_REQUIRE_CHROMA } from "../config/classifierPipeline.js";
import { VendorDependencyError } from "./classifierErrors.js";
import { getStaticAllowedTaxonomyLabels } from "../config/taxonomyDefinition.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CACHE_FILE =
  process.env.FEEDBACK_STORE_PATH ||
  path.resolve(".cache/feedback-corrections.json");

// Committed seed file — version-controlled baseline corrections
const SEED_FILE = path.resolve("seeds/feedback-corrections.json");

// Max few-shot examples to inject per prompt (keeps token count manageable)
const MAX_FEW_SHOT = 5;

// Minimum number of embedded corrections before we switch from recency to semantic ranking.
// Below this threshold, recency sort is equally good and we avoid the overhead.
const MIN_EMBED_FOR_SEMANTIC = 3;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Correction {
  entryId: string;
  title: string;
  url: string;
  correctedAt: string; // ISO 8601
  correctedBy?: string; // e.g. "content-team", "alice@company.com"
  notes?: string; // optional context for why the correction was made
  contentType?: string; // Contentful content type ID for this entry
  embedding?: number[]; // cached embedding vector for semantic selection
  embedText?: string; // the text that was embedded (for cache validation)
  /** ISO 8601 timestamp of when this correction was human-confirmed. Only confirmed corrections enter Chroma/vector retrieval. */
  confirmedAt?: string;
  /** Number of independent confirmations. Corrections with confirmationCount >= 2 are eligible for few-shot retrieval. Unconfirmed corrections are still applied as overrides but not used as few-shot examples. */
  confirmationCount?: number;
  fields: Partial<{
    assetType: string;
    assetSubType: string;
    schemaType: string;
    product: string[];
    jobLevel: string[];
    jobFunction: string[];
    audience: string[];
    topic: string[];
    useCases: string[];
    funnelStage: string;
    industry: string[];
    companySize: string;
    region: string;
    language: string;
    usageRights: string;
    season: string;
    yearPublished: string;
  }>;
}

type FeedbackStore = Record<string, Correction>; // keyed by entryId

export interface FewShotExample {
  entryId: string;
  title: string;
  url: string;
  contentType?: string;
  notes?: string;
  fields: Correction["fields"];
  similarity?: number;
  selectionStrategy: "recency" | "semantic-cache" | "vector-store";
}

// ---------------------------------------------------------------------------
// Taxonomy validation helper
// ---------------------------------------------------------------------------

/**
 * Returns true if all field values in the example are still present in the
 * current static taxonomy. Examples with stale/removed labels are filtered
 * out before prompt injection to prevent hallucination of invalid values.
 */
function isExampleValid(example: FewShotExample): boolean {
  const labels = getStaticAllowedTaxonomyLabels();
  for (const [field, val] of Object.entries(example.fields)) {
    if (val === undefined || val === null) continue;
    const allowed = (labels as Record<string, string[] | undefined>)[field];
    if (!allowed) continue;
    const values = Array.isArray(val) ? val : [val];
    if (values.some((v) => !allowed.includes(v as string))) return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------

// Module-level cache to avoid re-reading 2 JSON files on every call.
// Invalidated on any write operation (saveCorrection / saveCorrectionWithEmbedding).
let _storeCache: { data: FeedbackStore; ts: number } | null = null;
const STORE_CACHE_TTL = 60_000;

function loadStoreCached(): FeedbackStore {
  if (_storeCache && Date.now() - _storeCache.ts < STORE_CACHE_TTL)
    return _storeCache.data;
  const data = loadStore();
  _storeCache = { data, ts: Date.now() };
  return data;
}

/**
 * Load the merged store: seed file as baseline, runtime cache entries win on conflict.
 * This means committed seeds apply everywhere; local overrides stay local.
 */
function loadStore(): FeedbackStore {
  // 1. Load committed seed as baseline
  const seed: FeedbackStore = {};
  try {
    if (fs.existsSync(SEED_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));
      // Strip meta-only keys (e.g. "_comment") — valid entries have an entryId
      for (const [k, v] of Object.entries(raw)) {
        if (typeof v === "object" && v !== null && "entryId" in v) {
          seed[k] = v as Correction;
        }
      }
    }
  } catch {
    /* corrupt seed — ignore */
  }

  // 2. Merge runtime cache on top (runtime wins per-entry)
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const runtime = JSON.parse(
        fs.readFileSync(CACHE_FILE, "utf-8"),
      ) as FeedbackStore;
      return { ...seed, ...runtime };
    }
  } catch {
    /* corrupt or missing cache */
  }

  return seed;
}

export function saveCorrection(correction: Correction): void {
  const store = loadStoreCached();
  store[correction.entryId] = correction;
  _storeCache = null; // invalidate cache on write
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    /* non-fatal */
  }
}

/**
 * Save a correction and, if an embedText is provided, compute and store its
 * embedding for future semantic few-shot selection.
 *
 * Embedding is computed asynchronously and stored back into the cache file.
 * If the embedding API fails, the correction is still saved without an embedding
 * and the system falls back to recency-based selection.
 */
export async function saveCorrectionWithEmbedding(
  correction: Correction,
  embedText: string,
): Promise<void> {
  // Save immediately without embedding so we don't block
  correction.embedText = embedText;
  saveCorrection(correction);

  // Then compute embedding in background and update
  try {
    const { getEmbedding } = await import("./embeddingCache.js");
    const vector = await getEmbedding(embedText, {
      operation: "embed-correction",
      purpose: `store correction embedding for ${correction.entryId}`,
    });
    if (vector) {
      correction.embedding = vector;
      saveCorrection(correction);

      const syncTasks: Promise<unknown>[] = [];
      syncTasks.push(
        import("./vectorStore.js").then(({ upsertCorrectionVector }) =>
          upsertCorrectionVector(
            correction.entryId,
            correction.title,
            correction.url,
            embedText,
            vector,
            correction.fields,
          ),
        ),
      );
      syncTasks.push(
        import("./chromaStore.js").then(({ upsertCorrectionToChroma }) =>
          upsertCorrectionToChroma({
            entryId: correction.entryId,
            title: correction.title,
            url: correction.url,
            embedding: vector,
            fields: correction.fields,
            contentType: correction.contentType,
            notes: correction.notes,
          }),
        ),
      );
      const syncResults = await Promise.allSettled(syncTasks);
      if (CLASSIFIER_REQUIRE_CHROMA) {
        const chromaFailure = syncResults.find(
          (result, index) => index === 1 && result.status === "rejected",
        );
        if (chromaFailure?.status === "rejected") {
          throw new VendorDependencyError(
            "chroma",
            chromaFailure.reason instanceof Error
              ? chromaFailure.reason.message
              : String(chromaFailure.reason),
          );
        }
      }
    }
  } catch (error) {
    if (CLASSIFIER_REQUIRE_CHROMA && error instanceof VendorDependencyError) {
      throw error;
    }
    /* non-fatal — correction saved without embedding */
  }
}

// ---------------------------------------------------------------------------
// Override application
// ---------------------------------------------------------------------------

/**
 * Apply any stored human corrections to an AI classification output.
 * Corrections are treated as ground truth and override AI values entirely.
 * Returns the fields that were overridden (for logging).
 */
export function applyFeedbackOverrides(
  entryId: string,
  classification: Record<string, { value?: string | string[]; confidence?: number } | null | undefined>,
): string[] {
  const store = loadStoreCached();
  const correction = store[entryId];
  if (!correction) return [];

  const overridden: string[] = [];
  const valuesEqual = (left: unknown, right: unknown): boolean => {
    if (Array.isArray(left) && Array.isArray(right)) {
      return (
        JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
      );
    }
    return JSON.stringify(left) === JSON.stringify(right);
  };
  for (const [field, value] of Object.entries(correction.fields)) {
    if (value !== undefined && value !== null) {
      if (classification[field]) {
        const changed = !valuesEqual(classification[field].value, value);
        classification[field].value = value;
        classification[field].confidence = 0.99; // human-verified
        if (changed) {
          overridden.push(field);
        }
        continue;
      }
      overridden.push(field);
    }
  }
  return overridden;
}

// ---------------------------------------------------------------------------
// Few-shot example builder
// ---------------------------------------------------------------------------

/**
 * Returns a formatted few-shot block for injection into the AI prompt.
 *
 * Selection strategy:
 *   - If queryEmbedding is provided AND >= MIN_EMBED_FOR_SEMANTIC corrections
 *     have embeddings: rank by cosine similarity (most relevant first).
 *   - Otherwise: rank by recency (most recently corrected first).
 *
 * In both cases, results are capped at MAX_FEW_SHOT.
 *
 * Format:
 *   ### Verified example: [title] ([url])
 *   - Asset Type: Blog Post
 *   - Topic: Artificial intelligence (AI)
 *   ...
 */
export function buildFewShotBlock(queryEmbedding?: number[] | null): string {
  const examples = selectFewShotExamples(loadStoreCached(), queryEmbedding);
  return renderFewShotBlock(examples);
}

/** Exported for unit testing only — callers should use buildFewShotBlock or buildFewShotSelection. */
export function selectFewShotExamples(
  store: FeedbackStore,
  queryEmbedding?: number[] | null,
  excludeEntryIds: Set<string> = new Set(),
): FewShotExample[] {
  // Only use confirmed corrections (confirmationCount >= 2) as few-shot examples.
  // Unconfirmed corrections are still applied as hard overrides in applyFeedbackOverrides,
  // but we don't teach the model from potentially wrong human corrections.
  let entries = Object.values(store).filter(
    (e) => (e.confirmationCount ?? 1) >= 2 || e.confirmedAt != null,
  );
  entries = entries.filter((e) => !excludeEntryIds.has(e.entryId));

  // Filter out examples whose field values are no longer in the allowed taxonomy.
  // This prevents stale/removed labels from being injected into the prompt.
  entries = entries.filter((e) =>
    isExampleValid({
      entryId: e.entryId,
      title: e.title,
      url: e.url,
      contentType: e.contentType,
      notes: e.notes,
      fields: e.fields,
      selectionStrategy: "recency",
    }),
  );

  if (entries.length === 0) return [];

  // Count how many corrections have usable embeddings
  const withEmbedding = entries.filter(
    (e) => e.embedding && e.embedding.length > 0,
  );

  if (
    queryEmbedding &&
    queryEmbedding.length > 0 &&
    withEmbedding.length >= MIN_EMBED_FOR_SEMANTIC
  ) {
    // Cosine similarity inlined to avoid circular ESM import with embeddingCache.
    const cosineSimilarity = (a: number[], b: number[]): number => {
      if (!a?.length || !b?.length || a.length !== b.length) return 0;
      let dot = 0,
        na = 0,
        nb = 0;
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        na += a[i] * a[i];
        nb += b[i] * b[i];
      }
      const d = Math.sqrt(na) * Math.sqrt(nb);
      return d === 0 ? 0 : Math.max(-1, Math.min(1, dot / d));
    };

    const ranked = withEmbedding
      .map((e) => ({
        entry: e,
        score: cosineSimilarity(queryEmbedding, e.embedding!),
      }))
      .sort((a, b) => b.score - a.score);

    // Fill remaining slots with recency-sorted non-embedded entries if needed
    const rankedIds = new Set(ranked.map((r) => r.entry.entryId));
    const remaining = entries
      .filter((e) => !rankedIds.has(e.entryId))
      .sort(
        (a, b) =>
          new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime(),
      );

    entries = [...ranked.map((r) => r.entry), ...remaining].slice(
      0,
      MAX_FEW_SHOT,
    );
    return entries.map((entry) => ({
      entryId: entry.entryId,
      title: entry.title,
      url: entry.url,
      contentType: entry.contentType,
      notes: entry.notes,
      fields: entry.fields,
      similarity: ranked.find((r) => r.entry.entryId === entry.entryId)?.score,
      selectionStrategy: "semantic-cache",
    }));
  } else {
    // Recency fallback
    entries = entries
      .sort(
        (a, b) =>
          new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime(),
      )
      .slice(0, MAX_FEW_SHOT);
    return entries.map((entry) => ({
      entryId: entry.entryId,
      title: entry.title,
      url: entry.url,
      contentType: entry.contentType,
      notes: entry.notes,
      fields: entry.fields,
      selectionStrategy: "recency",
    }));
  }
}

function renderFewShotBlock(entries: FewShotExample[]): string {
  if (entries.length === 0) return "";

  const lines: string[] = [
    "## SECTION 5 — VERIFIED EXAMPLES (human-corrected)",
    "Use these as ground-truth reference when classifying similar content.",
    "",
  ];

  for (const entry of entries) {
    lines.push(`### ${entry.title} (${entry.url})`);
    if (entry.contentType) lines.push(`> Content Type: ${entry.contentType}`);
    if (entry.notes) lines.push(`> Note: ${entry.notes}`);
    if (entry.similarity !== undefined) {
      lines.push(`> Similarity: ${Math.round(entry.similarity * 100)}%`);
    }
    for (const [field, value] of Object.entries(entry.fields)) {
      if (value !== undefined && value !== null) {
        const display = Array.isArray(value) ? value.join(", ") : String(value);
        lines.push(`- ${camelToLabel(field)}: ${display}`);
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export async function buildFewShotSelection(
  queryEmbedding?: number[] | null,
  options?: { excludeEntryIds?: string[]; vendorTrace?: VendorTraceCollector },
): Promise<{
  block: string;
  examples: FewShotExample[];
  strategy: "recency" | "semantic-cache" | "vector-store";
}> {
  const store = loadStoreCached();
  const excludeEntryIds = new Set(options?.excludeEntryIds || []);
  if (Object.keys(store).length === 0) {
    return { block: "", examples: [], strategy: "recency" };
  }

  if (queryEmbedding?.length) {
    try {
      if (CLASSIFIER_REQUIRE_CHROMA && !process.env.CHROMA_URL) {
        throw new VendorDependencyError(
          "chroma",
          "CHROMA_URL is required but not configured",
        );
      }

      const { queryCorrectionsFromChroma } = await import("./chromaStore.js");
      const chromaStartedAt = Date.now();
      const similar = (
        await queryCorrectionsFromChroma({
          embedding: queryEmbedding,
          limit: MAX_FEW_SHOT + excludeEntryIds.size,
        })
      ).filter((item) => !excludeEntryIds.has(item.entryId));
      options?.vendorTrace?.recordCall({
        vendor: "chroma",
        service: process.env.CHROMA_COLLECTION || "content-graph-corrections",
        category: "retrieval",
        operation: "query-few-shot-corrections",
        purpose: "retrieve similar human-corrected examples",
        status: "ok",
        durationMs: Date.now() - chromaStartedAt,
        input: {
          limit: MAX_FEW_SHOT + excludeEntryIds.size,
          excludedEntryIds: Array.from(excludeEntryIds),
          embeddingDimensions: queryEmbedding.length,
        },
        output: {
          resultCount: similar.length,
          topMatches: similar.slice(0, 5).map((item) => ({
            entryId: item.entryId,
            similarity: item.similarity,
          })),
        },
      });

      if (similar.length > 0) {
        const examples = similar
          .map((item) => {
            const stored = store[item.entryId];
            const metadataFields =
              typeof item.metadata.fields === "string"
                ? JSON.parse(item.metadata.fields)
                : item.metadata.fields;

            return {
              entryId: item.entryId,
              title:
                stored?.title ?? String(item.metadata.title ?? item.entryId),
              url: stored?.url ?? String(item.metadata.url ?? ""),
              contentType:
                stored?.contentType ??
                (item.metadata.contentType
                  ? String(item.metadata.contentType)
                  : undefined),
              notes:
                stored?.notes ??
                (item.metadata.notes ? String(item.metadata.notes) : undefined),
              fields:
                stored?.fields ??
                (metadataFields as Correction["fields"]) ??
                {},
              similarity: item.similarity,
              selectionStrategy: "vector-store" as const,
            };
          })
          .filter((entry) => Object.keys(entry.fields).length > 0)
          .filter(isExampleValid)
          .slice(0, MAX_FEW_SHOT);

        if (examples.length > 0) {
          return {
            block: renderFewShotBlock(examples),
            examples,
            strategy: "vector-store",
          };
        }
      }
    } catch (error) {
      options?.vendorTrace?.recordCall({
        vendor: "chroma",
        service: process.env.CHROMA_COLLECTION || "content-graph-corrections",
        category: "retrieval",
        operation: "query-few-shot-corrections",
        purpose: "retrieve similar human-corrected examples",
        status: "error",
        input: {
          limit: MAX_FEW_SHOT + excludeEntryIds.size,
          excludedEntryIds: Array.from(excludeEntryIds),
          embeddingDimensions: queryEmbedding.length,
        },
        error: error instanceof Error ? error.message : String(error),
      });
      if (CLASSIFIER_REQUIRE_CHROMA) {
        throw new VendorDependencyError(
          "chroma",
          error instanceof Error ? error.message : String(error),
        );
      }
      // Fall through to pgvector or cache-based selection.
    }

    try {
      const { findSimilarCorrections, vectorStoreCount } = await import(
        "./vectorStore.js"
      );
      const vectorCountStartedAt = Date.now();
      const count = await vectorStoreCount();
      options?.vendorTrace?.recordCall({
        vendor: "postgres",
        service: "pgvector",
        category: "retrieval",
        operation: "count-vector-corrections",
        purpose: "check whether pgvector retrieval is available",
        status: "ok",
        durationMs: Date.now() - vectorCountStartedAt,
        input: {},
        output: { correctionCount: count },
      });
      if (count) {
        const pgVectorStartedAt = Date.now();
        const similar = await findSimilarCorrections(queryEmbedding, {
          limit: MAX_FEW_SHOT + excludeEntryIds.size,
        });
        options?.vendorTrace?.recordCall({
          vendor: "postgres",
          service: "pgvector",
          category: "retrieval",
          operation: "query-few-shot-corrections",
          purpose: "retrieve similar human-corrected examples",
          status: "ok",
          durationMs: Date.now() - pgVectorStartedAt,
          input: {
            limit: MAX_FEW_SHOT + excludeEntryIds.size,
            excludedEntryIds: Array.from(excludeEntryIds),
            embeddingDimensions: queryEmbedding.length,
          },
          output: {
            resultCount: similar.length,
            topMatches: similar.slice(0, 5).map((item) => ({
              entryId: item.entryId,
              similarity: item.similarity,
            })),
          },
        });
        if (similar.length > 0) {
          const examples = similar
            .filter((item) => !excludeEntryIds.has(item.entryId))
            .map((item) => store[item.entryId])
            .filter(Boolean)
            .map((entry) => ({
              entryId: entry.entryId,
              title: entry.title,
              url: entry.url,
              contentType: entry.contentType,
              notes: entry.notes,
              fields: entry.fields,
              similarity: similar.find((item) => item.entryId === entry.entryId)
                ?.similarity,
              selectionStrategy: "vector-store" as const,
            }))
            .filter(isExampleValid)
            .slice(0, MAX_FEW_SHOT);
          return {
            block: renderFewShotBlock(examples),
            examples,
            strategy: "vector-store",
          };
        }
      }
    } catch (error) {
      options?.vendorTrace?.recordCall({
        vendor: "postgres",
        service: "pgvector",
        category: "retrieval",
        operation: "query-few-shot-corrections",
        purpose: "retrieve similar human-corrected examples",
        status: "error",
        input: {
          limit: MAX_FEW_SHOT + excludeEntryIds.size,
          excludedEntryIds: Array.from(excludeEntryIds),
          embeddingDimensions: queryEmbedding.length,
        },
        error: error instanceof Error ? error.message : String(error),
      });
      // Fall through to cache-based selection.
    }
  }

  const examples = selectFewShotExamples(
    store,
    queryEmbedding,
    excludeEntryIds,
  );
  return {
    block: renderFewShotBlock(examples),
    examples,
    strategy: examples[0]?.selectionStrategy || "recency",
  };
}

/**
 * Returns true if any corrections exist for the given entry ID.
 */
export function hasFeedback(entryId: string): boolean {
  return !!loadStoreCached()[entryId];
}

/**
 * Returns the total number of corrections in the store.
 */
export function correctionCount(): number {
  return Object.keys(loadStoreCached()).length;
}

/**
 * Returns how many corrections currently have computed embeddings.
 * Useful for reporting whether semantic few-shot selection is active.
 */
export function embeddedCorrectionCount(): number {
  return Object.values(loadStoreCached()).filter(
    (e) => e.embedding && e.embedding.length > 0,
  ).length;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function camelToLabel(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}
