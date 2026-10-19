#!/usr/bin/env tsx
/**
 * ab-test-prompt.ts
 *
 * Systematic prompt A/B testing — runs the same pages through two classifier
 * configurations and compares field-level outputs. Tells you exactly which
 * variant produces more accurate results and by how much.
 *
 * Variants are defined inline below. Edit VARIANT_B to test a new prompt
 * change before committing it to classificationTool.ts.
 *
 * Usage:
 *   npx tsx scripts/ab-test-prompt.ts                    # compare on all history entries
 *   npx tsx scripts/ab-test-prompt.ts --limit 5          # first 5 only (fast)
 *   npx tsx scripts/ab-test-prompt.ts --json             # machine-readable
 *
 * Output:
 *   Per-field diff table showing A vs B on each page
 *   Winner declaration per field (which variant is more consistent with corrections)
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { loadJson } from "./_shared/scriptUtils.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const HISTORY_FILE = path.resolve(".cache/classification-history.json");
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");
const CACHE_FB_FILE = path.resolve(".cache/feedback-corrections.json");
const RESULTS_FILE = path.resolve(".cache/ab-test-results.json");

// ---------------------------------------------------------------------------
// Load stores
// ---------------------------------------------------------------------------
interface HistoryEntry {
  entryId: string;
  title: string;
  url: string;
  contentType?: string;
  fields: Record<string, { value: string | string[]; confidence: number }>;
  bodySummary?: string;
}

interface Correction {
  entryId: string;
  fields: Record<string, string | string[]>;
}

function loadHistory(): HistoryEntry[] {
  return Object.values(
    loadJson<Record<string, HistoryEntry>>(HISTORY_FILE) ?? {},
  );
}

function loadCorrections(): Record<string, Correction> {
  const seed = loadJson<Record<string, unknown>>(SEED_FB_FILE) ?? {};
  const cache = loadJson<Record<string, unknown>>(CACHE_FB_FILE) ?? {};
  const merged: Record<string, Correction> = {};
  for (const [k, v] of Object.entries({ ...seed, ...cache })) {
    if (typeof v === "object" && v !== null && "entryId" in v)
      merged[k] = v as Correction;
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Variant definitions
// ──────────────────────────────────────────────────────────────────────────
// VARIANT_A = current production settings (control)
// VARIANT_B = the change you want to test
//
// To test a prompt change:
//   1. Make the change in classificationTool.ts behind a flag or env var
//   2. Set the env var here for VARIANT_B
//   3. Run: npx tsx scripts/ab-test-prompt.ts
// ---------------------------------------------------------------------------
const VARIANTS: Array<{
  name: string;
  env: Record<string, string>;
  description: string;
}> = [
  {
    name: "A (control)",
    description: "Current production: gemini-2.5-flash-lite, single-pass",
    env: {
      GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    },
  },
  {
    name: "B (test)",
    description: "Test variant: gemini-3.1-pro-preview, single-pass",
    env: {
      GEMINI_MODEL: "gemini-3.1-pro-preview",
    },
  },
];

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------
function normalize(v: unknown): string {
  if (Array.isArray(v)) return [...v].map(String).sort().join(" | ");
  return String(v ?? "").trim();
}

function fieldsMatch(a: unknown, b: unknown): boolean {
  return normalize(a) === normalize(b);
}

function scoreVsGroundTruth(value: unknown, truth: unknown): number {
  const aArr = Array.isArray(value) ? value.map(String) : [String(value ?? "")];
  const tArr = Array.isArray(truth) ? truth.map(String) : [String(truth ?? "")];
  const aSet = new Set(aArr.filter(Boolean));
  const tSet = new Set(tArr.filter(Boolean));
  if (aSet.size === 0 && tSet.size === 0) return 1;
  let hit = 0;
  for (const v of tSet) if (aSet.has(v)) hit++;
  return tSet.size > 0 ? hit / tSet.size : 0;
}

// ---------------------------------------------------------------------------
// Run a single classification under a variant's env settings
// ---------------------------------------------------------------------------
async function runVariant(
  variant: (typeof VARIANTS)[0],
  entry: HistoryEntry,
): Promise<Record<string, { value?: string | string[]; confidence?: number } | null | undefined>> {
  // Apply variant env vars temporarily
  const saved: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(variant.env)) {
    saved[k] = process.env[k];
    process.env[k] = v;
  }

  try {
    const result = await classifyContent({
      asset: {
        id: entry.entryId,
        title: entry.title,
        contentType: entry.contentType ?? "unknown",
        slug: entry.url,
        textContent: (entry as typeof entry & { bodySummary?: string }).bodySummary ?? "",
      },
      logger: {
        info: () => {},
        warn: () => {},
        error: () => {},
      },
    });
    return result as unknown as Record<string, { value?: string | string[]; confidence?: number } | null | undefined>;
  } finally {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

// ---------------------------------------------------------------------------
// Semantic fields to compare
// ---------------------------------------------------------------------------
const COMPARE_FIELDS = [
  "topic",
  "funnelStage",
  "industry",
  "jobLevel",
  "jobFunction",
  "audience",
  "useCases",
  "product",
  "assetType",
  "schemaType",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const jsonMode = argv.includes("--json");
const limitArg = argv[argv.indexOf("--limit") + 1];
const limit = limitArg ? parseInt(limitArg) : 50;

async function main() {
  const entries = loadHistory().slice(0, limit);
  const corrections = loadCorrections();

  if (!jsonMode) {
    console.log(`\nA/B Prompt Test\n`);
    console.log(`  Variant A: ${VARIANTS[0].description}`);
    console.log(`  Variant B: ${VARIANTS[1].description}`);
    console.log(
      `  Pages to test: ${entries.length} (${Object.keys(corrections).length} with ground truth)\n`,
    );
  }

  type FieldResult = {
    aValue: string;
    bValue: string;
    aScore: number;
    bScore: number; // vs human correction (0 if no correction)
    agree: boolean;
  };

  const results: Array<{
    entryId: string;
    title: string;
    url: string;
    fields: Record<string, FieldResult>;
  }> = [];

  for (const entry of entries) {
    if (!jsonMode)
      process.stdout.write(`  ${entry.title.slice(0, 50).padEnd(52)}`);

    try {
      const [resA, resB] = await Promise.all([
        runVariant(VARIANTS[0], entry),
        runVariant(VARIANTS[1], entry),
      ]);

      const truth = corrections[entry.entryId]?.fields ?? {};
      const fieldResults: Record<string, FieldResult> = {};

      for (const field of COMPARE_FIELDS) {
        const aVal = resA[field]?.value;
        const bVal = resB[field]?.value;
        const groundTruth = truth[field];

        fieldResults[field] = {
          aValue: normalize(aVal),
          bValue: normalize(bVal),
          aScore:
            groundTruth !== undefined
              ? scoreVsGroundTruth(aVal, groundTruth)
              : -1,
          bScore:
            groundTruth !== undefined
              ? scoreVsGroundTruth(bVal, groundTruth)
              : -1,
          agree: fieldsMatch(aVal, bVal),
        };
      }

      results.push({
        entryId: entry.entryId,
        title: entry.title,
        url: entry.url,
        fields: fieldResults,
      });

      const diffCount = Object.values(fieldResults).filter(
        (f) => !f.agree,
      ).length;
      if (!jsonMode)
        console.log(diffCount > 0 ? `${diffCount} field diffs` : "identical");
    } catch (err: unknown) {
      if (!jsonMode) console.log(`ERROR: ${err instanceof Error ? err.message?.slice(0, 60) : String(err)}`);
    }
  }

  // Save results
  fs.writeFileSync(
    RESULTS_FILE,
    JSON.stringify({ variants: VARIANTS, results }, null, 2),
    "utf-8",
  );

  // Aggregate per-field
  const fieldAgg: Record<
    string,
    { aWins: number; bWins: number; ties: number; diffs: number; total: number }
  > = {};
  for (const field of COMPARE_FIELDS) {
    fieldAgg[field] = { aWins: 0, bWins: 0, ties: 0, diffs: 0, total: 0 };
  }

  for (const r of results) {
    for (const field of COMPARE_FIELDS) {
      const f = r.fields[field];
      if (!f) continue;
      fieldAgg[field].total++;
      if (!f.agree) fieldAgg[field].diffs++;
      if (f.aScore >= 0 && f.bScore >= 0) {
        if (f.aScore > f.bScore) fieldAgg[field].aWins++;
        else if (f.bScore > f.aScore) fieldAgg[field].bWins++;
        else fieldAgg[field].ties++;
      }
    }
  }

  if (jsonMode) {
    const aTotal = Object.values(fieldAgg).reduce((s, f) => s + f.aWins, 0);
    const bTotal = Object.values(fieldAgg).reduce((s, f) => s + f.bWins, 0);
    console.log(
      JSON.stringify(
        {
          variants: VARIANTS.map((v) => ({
            name: v.name,
            description: v.description,
          })),
          pagesCompared: results.length,
          overallWinner: aTotal >= bTotal ? "A" : "B",
          fields: fieldAgg,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(
    "\nField-level comparison (vs human corrections where available):\n",
  );
  console.log(
    `  ${"Field".padEnd(20)} ${"Diffs".padStart(6)} ${"A wins".padStart(8)} ${"B wins".padStart(8)} ${"Ties".padStart(6)} ${"Winner".padStart(8)}`,
  );
  console.log("  " + "─".repeat(62));

  let totalAWins = 0,
    totalBWins = 0;
  for (const field of COMPARE_FIELDS) {
    const f = fieldAgg[field];
    const hasGT = f.aWins + f.bWins + f.ties > 0;
    const winner = !hasGT
      ? "(no GT)"
      : f.aWins > f.bWins
        ? "A"
        : f.bWins > f.aWins
          ? "B"
          : "tie";
    totalAWins += f.aWins;
    totalBWins += f.bWins;
    console.log(
      `  ${field.padEnd(20)} ${String(f.diffs).padStart(6)} ${String(f.aWins).padStart(8)} ${String(f.bWins).padStart(8)} ${String(f.ties).padStart(6)} ${winner.padStart(8)}`,
    );
  }

  console.log("  " + "─".repeat(62));
  const overallWinner =
    totalAWins >= totalBWins
      ? `A (${totalAWins} vs ${totalBWins})`
      : `B (${totalBWins} vs ${totalAWins})`;
  console.log(`\n  Overall winner: ${overallWinner}`);
  console.log(`  Full results saved to .cache/ab-test-results.json\n`);

  if (totalBWins > totalAWins) {
    console.log(
      "  Recommendation: Variant B outperforms A. Consider promoting variant B settings to production.\n",
    );
  } else {
    console.log(
      "  Recommendation: Current production settings (A) hold. Keep variant B as-is or try a different change.\n",
    );
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
