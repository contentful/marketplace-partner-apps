#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { loadJson } from "./_shared/scriptUtils.js";
import {
  chromaHealthcheck,
  resetChromaCollection,
  upsertCorrectionToChroma,
} from "../api/_shared/utils/chromaStore.js";

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

const SEED_FILE = path.resolve("seeds/feedback-corrections.json");
const CACHE_FILE =
  process.env.FEEDBACK_STORE_PATH ||
  path.resolve(".cache/feedback-corrections.json");

function loadCorrections(): Correction[] {
  const seed = loadJson<Record<string, unknown>>(SEED_FILE) ?? {};
  const cache = loadJson<Record<string, unknown>>(CACHE_FILE) ?? {};
  return Object.values({ ...seed, ...cache }).filter(
    (value): value is Correction =>
      typeof value === "object" &&
      value !== null &&
      "entryId" in value &&
      Array.isArray((value as Correction).embedding) &&
      ((value as Correction).embedding?.length ?? 0) > 0,
  );
}

async function main() {
  const healthy = await chromaHealthcheck();
  if (!healthy) {
    console.error(
      "Chroma is not reachable. Check CHROMA_URL and the local vendor stack.",
    );
    process.exit(1);
  }

  const corrections = loadCorrections();
  if (corrections.length === 0) {
    console.log("No embedded corrections found to sync.");
    return;
  }

  await resetChromaCollection();

  let synced = 0;
  for (const correction of corrections) {
    await upsertCorrectionToChroma({
      entryId: correction.entryId,
      title: correction.title,
      url: correction.url,
      embedding: correction.embedding!,
      fields: correction.fields,
      contentType: correction.contentType,
      notes: correction.notes,
    });
    synced++;
  }

  console.log(`Synced ${synced} embedded corrections to Chroma.`);
}

main().catch((error) => {
  console.error("Fatal:", error);
  process.exit(1);
});
