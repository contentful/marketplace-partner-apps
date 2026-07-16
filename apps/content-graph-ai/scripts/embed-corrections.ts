#!/usr/bin/env tsx
/**
 * embed-corrections.ts
 *
 * Batch-computes embeddings for all corrections in the feedback store and
 * writes them back to .cache/feedback-corrections.json.
 *
 * Once embeddings are stored, buildFewShotBlock() in feedbackStore.ts
 * switches from recency-based to semantic (cosine-similarity) few-shot
 * selection — injecting the most *relevant* examples into each prompt.
 *
 * Safe to run repeatedly: skips corrections that already have a valid
 * embedding, so only computes what's new or missing.
 *
 * Usage:
 *   npx tsx scripts/embed-corrections.ts
 *   npx tsx scripts/embed-corrections.ts --force   # re-embed everything
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { loadJson } from "./_shared/scriptUtils.js";
import {
  getEmbedding,
  buildEmbedText,
} from "../api/_shared/utils/embeddingCache.js";
import {
  upsertCorrectionVector,
  vectorStoreCount,
} from "../api/_shared/utils/vectorStore.js";
import {
  upsertCorrectionToChroma,
  chromaHealthcheck,
} from "../api/_shared/utils/chromaStore.js";

// ---------------------------------------------------------------------------
// Types (duplicated from feedbackStore to avoid circular import)
// ---------------------------------------------------------------------------
interface Correction {
  entryId: string;
  title: string;
  url: string;
  correctedAt: string;
  correctedBy?: string;
  notes?: string;
  contentType?: string;
  embedding?: number[];
  embedText?: string;
  fields: Record<string, string | string[]>;
}

// ---------------------------------------------------------------------------
// Load stores
// ---------------------------------------------------------------------------
const SEED_FILE = path.resolve("seeds/feedback-corrections.json");
const CACHE_FILE =
  process.env.FEEDBACK_STORE_PATH ||
  path.resolve(".cache/feedback-corrections.json");

function loadAllCorrections(): Record<string, Correction> {
  const seed = loadJson<Record<string, unknown>>(SEED_FILE) ?? {};
  const cache = loadJson<Record<string, unknown>>(CACHE_FILE) ?? {};
  const merged: Record<string, Correction> = {};
  for (const [k, v] of Object.entries({ ...seed, ...cache })) {
    if (typeof v === "object" && v !== null && "entryId" in v) {
      merged[k] = v as Correction;
    }
  }
  return merged;
}

function saveCacheStore(store: Record<string, Correction>): void {
  const dir = path.dirname(CACHE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Build embed text for a correction
// ---------------------------------------------------------------------------
function buildCorrectionEmbedText(c: Correction): string {
  const topicHints = [
    ...(Array.isArray(c.fields.topic) ? c.fields.topic : []),
    ...(Array.isArray(c.fields.useCases) ? c.fields.useCases : []),
    Array.isArray(c.fields.funnelStage) ? c.fields.funnelStage[0] ?? "" : c.fields.funnelStage ?? "",
    ...(Array.isArray(c.fields.industry) ? c.fields.industry : []),
  ].filter(Boolean);

  return buildEmbedText({
    title: c.title,
    slug: c.url,
    contentType: c.contentType ?? "unknown",
    topicHints,
    bodySample: c.notes ?? "",
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const forceAll = process.argv.includes("--force");

async function main() {
  const corrections = loadAllCorrections();
  const entries = Object.values(corrections);

  if (entries.length === 0) {
    console.log("No corrections found in seed or cache.");
    return;
  }

  const toEmbed = forceAll
    ? entries
    : entries.filter((e) => !e.embedding || !e.embedText);

  console.log(
    `Feedback corrections: ${entries.length} total, ${toEmbed.length} need embedding${forceAll ? " (--force)" : ""}\n`,
  );

  if (toEmbed.length === 0) {
    console.log(
      "All corrections already embedded. Run with --force to re-embed.",
    );
    console.log(
      `\nSemantic few-shot: ACTIVE (${entries.filter((e) => e.embedding).length} embedded)`,
    );
    return;
  }

  // Load the cache store (not seed) for writing — we only write to .cache/
  const cacheStore = loadJson<Record<string, Correction>>(CACHE_FILE) ?? {};

  let succeeded = 0;
  let failed = 0;

  for (const correction of toEmbed) {
    const embedText = buildCorrectionEmbedText(correction);
    process.stdout.write(`  Embedding "${correction.title}"... `);

    const vector = await getEmbedding(embedText);
    if (vector) {
      // 1. Write to file cache
      const existing = cacheStore[correction.entryId] ?? { ...correction };
      existing.embedding = vector;
      existing.embedText = embedText;
      cacheStore[correction.entryId] = existing;
      saveCacheStore(cacheStore);

      // 2. Also upsert to pgvector table (non-blocking — no-op if no DB)
      await upsertCorrectionVector(
        correction.entryId,
        correction.title,
        correction.url,
        embedText,
        vector,
        correction.fields,
      );
      await upsertCorrectionToChroma({
        entryId: correction.entryId,
        title: correction.title,
        url: correction.url,
        embedding: vector,
        fields: correction.fields,
        contentType: correction.contentType,
        notes: correction.notes,
      });

      console.log(`done (${vector.length}d)`);
      succeeded++;
    } else {
      console.log("FAILED (API unavailable)");
      failed++;
    }
  }

  const totalEmbedded = Object.values(loadAllCorrections()).filter(
    (e) => e.embedding,
  ).length;
  const pgCount = await vectorStoreCount();
  const chromaEnabled = await chromaHealthcheck();
  console.log(`\n${succeeded} embedded, ${failed} failed.`);
  console.log(`File cache: ${totalEmbedded}/${entries.length} embedded`);
  if (pgCount > 0) console.log(`pgvector table: ${pgCount} rows`);
  if (chromaEnabled) console.log("Chroma sync: enabled");

  if (totalEmbedded >= 3) {
    console.log("\nSemantic few-shot: ACTIVE");
    console.log(
      "Next run of classify-pillar-pages.ts will use semantic example selection.",
    );
  } else {
    console.log(
      `\nSemantic few-shot: pending (need >= 3 embedded, have ${totalEmbedded})`,
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
