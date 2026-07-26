/**
 * embeddingCache.ts
 *
 * Shared embedding utility with persistent file cache.
 * Uses Google text-embedding-004 (768-dim) via @ai-sdk/google.
 *
 * Architecture:
 *   1. In-memory Map (per-process, fastest)
 *   2. File cache .cache/embedding-cache.json (90-day TTL, gitignored)
 *   3. Gemini text-embedding-004 API (computed once, then cached)
 *
 * Designed to be non-blocking: if the embedding API fails for any reason,
 * callers receive null and fall back gracefully. Classification never stops.
 *
 * Cache path: configure with EMBEDDING_CACHE_PATH env var.
 */

import * as fs from "fs";
import * as path from "path";
import { embed } from "ai";
import {
  getGoogleProviderLabel,
  textEmbeddingModel,
} from "./googleProvider.js";
import type { VendorTraceCollector } from "./vendorTrace.js";
import { truncateTraceText } from "./vendorTrace.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CACHE_FILE =
  process.env.EMBEDDING_CACHE_PATH ||
  path.resolve(".cache/embedding-cache.json");

const CACHE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const ENABLE_EMBEDDING_CACHE =
  process.env.CLASSIFIER_ENABLE_EMBEDDING_CACHE !== "false";

// The embedding model name is stored in the cache key — changing it
// automatically invalidates all old entries (they won't match the new key prefix).
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CachedEmbedding {
  vector: number[];
  model: string;
  cachedAt: string;
}

type EmbeddingStore = Record<string, CachedEmbedding>;

type EmbeddingTraceOptions = {
  vendorTrace?: VendorTraceCollector;
  operation?: string;
  purpose?: string;
  input?: Record<string, unknown>;
};

// ---------------------------------------------------------------------------
// In-memory cache (lives for the duration of the process)
// ---------------------------------------------------------------------------
const memCache = new Map<string, number[]>();

// ---------------------------------------------------------------------------
// Cache key — model version + text fingerprint (FNV-1a 32-bit)
// Includes model so changing EMBED_MODEL auto-invalidates old entries.
// ---------------------------------------------------------------------------
function makeCacheKey(text: string): string {
  let hash = 2166136261; // FNV offset basis
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // FNV prime, uint32
  }
  return `${EMBED_MODEL}:${hash}`;
}

// ---------------------------------------------------------------------------
// File I/O
// ---------------------------------------------------------------------------
function loadStore(): EmbeddingStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as EmbeddingStore;
    }
  } catch {
    /* corrupt or missing — start fresh */
  }
  return {};
}

function saveStore(store: EmbeddingStore): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    /* non-fatal */
  }
}

function isExpired(cachedAt: string): boolean {
  return Date.now() - new Date(cachedAt).getTime() > CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns a 768-dim embedding vector for the given text.
 *
 * Priority: in-memory → file cache → Gemini API.
 * Returns null if the API fails — callers must handle gracefully.
 */
export async function getEmbedding(
  text: string,
  options?: EmbeddingTraceOptions,
): Promise<number[] | null> {
  if (!text?.trim()) return null;

  const key = makeCacheKey(text);
  const traceInput = {
    model: EMBED_MODEL,
    textLength: text.length,
    textPreview: truncateTraceText(text, 160),
    ...(options?.input || {}),
  };

  // 1. In-memory (fastest)
  if (ENABLE_EMBEDDING_CACHE && memCache.has(key)) {
    options?.vendorTrace?.recordCall({
      vendor: "local-cache",
      service: "embedding-memory",
      category: "embedding",
      operation: options?.operation || "get-embedding",
      purpose: options?.purpose,
      status: "ok",
      durationMs: 0,
      input: traceInput,
      output: { source: "memory", dimensions: memCache.get(key)!.length },
    });
    return memCache.get(key)!;
  }

  // 2. File cache
  const store = ENABLE_EMBEDDING_CACHE ? loadStore() : {};
  const cached = store[key];
  if (
    ENABLE_EMBEDDING_CACHE &&
    cached &&
    cached.model === EMBED_MODEL &&
    !isExpired(cached.cachedAt)
  ) {
    memCache.set(key, cached.vector);
    options?.vendorTrace?.recordCall({
      vendor: "local-cache",
      service: "embedding-file",
      category: "embedding",
      operation: options?.operation || "get-embedding",
      purpose: options?.purpose,
      status: "ok",
      durationMs: 0,
      input: traceInput,
      output: {
        source: "file",
        dimensions: cached.vector.length,
        cachedAt: cached.cachedAt,
      },
    });
    return cached.vector;
  }

  // 3. Gemini API — wrapped in try/catch so the caller never crashes
  const startedAt = Date.now();
  try {
    const { embedding } = await embed({
      model: textEmbeddingModel(EMBED_MODEL) as import("ai").EmbeddingModel,
      value: text,
    });

    if (!embedding || embedding.length === 0) {
      options?.vendorTrace?.recordCall({
        vendor: getGoogleProviderLabel(),
        service: EMBED_MODEL,
        category: "embedding",
        operation: options?.operation || "get-embedding",
        purpose: options?.purpose,
        status: "ok",
        durationMs: Date.now() - startedAt,
        input: traceInput,
        output: { source: "api", dimensions: 0, empty: true },
      });
      return null;
    }

    const vector = Array.from(embedding);
    if (ENABLE_EMBEDDING_CACHE) {
      memCache.set(key, vector);
      store[key] = {
        vector,
        model: EMBED_MODEL,
        cachedAt: new Date().toISOString(),
      };
      saveStore(store);
    }
    options?.vendorTrace?.recordCall({
      vendor: getGoogleProviderLabel(),
      service: EMBED_MODEL,
      category: "embedding",
      operation: options?.operation || "get-embedding",
      purpose: options?.purpose,
      status: "ok",
      durationMs: Date.now() - startedAt,
      input: traceInput,
      output: { source: "api", dimensions: vector.length },
    });
    return vector;
  } catch (error) {
    options?.vendorTrace?.recordCall({
      vendor: getGoogleProviderLabel(),
      service: EMBED_MODEL,
      category: "embedding",
      operation: options?.operation || "get-embedding",
      purpose: options?.purpose,
      status: "error",
      durationMs: Date.now() - startedAt,
      input: traceInput,
      error: error instanceof Error ? error.message : String(error),
    });
    // Embedding API unavailable — non-fatal, caller falls back
    return null;
  }
}

/**
 * Cosine similarity between two equal-length vectors.
 * Returns 0 if either vector is null/empty/mismatched.
 */
export function cosineSimilarity(
  a: number[] | null,
  b: number[] | null,
): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;

  let dot = 0,
    normA = 0,
    normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : Math.max(-1, Math.min(1, dot / denom));
}

/**
 * Build a compact text representation of a page suitable for embedding.
 * Deliberately short (title + content type + key tags) — we want to match
 * on classification *character*, not raw content.
 */
export function buildEmbedText(params: {
  title: string;
  slug?: string;
  contentType: string;
  topicHints?: string[];
  bodySample?: string; // first ~300 chars of body
}): string {
  const parts = [
    params.title,
    params.contentType,
    params.slug ?? "",
    (params.topicHints ?? []).join(" "),
    (params.bodySample ?? "").slice(0, 300),
  ].filter(Boolean);
  return parts.join(" | ").slice(0, 1024); // cap at 1024 chars for cost
}
