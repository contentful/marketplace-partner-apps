#!/usr/bin/env tsx
/**
 * accuracy-report.ts
 *
 * Measures classifier accuracy by comparing stored classification history
 * against human corrections in the feedback store.
 *
 * For each corrected entry, shows: what AI said vs. what human said.
 * Aggregates per-field accuracy rates and trends over time.
 *
 * Usage:
 *   npx tsx scripts/accuracy-report.ts
 *   npx tsx scripts/accuracy-report.ts --field topic        # focus on one field
 *   npx tsx scripts/accuracy-report.ts --json               # machine-readable output
 *
 * Reads from:
 *   seeds/feedback-corrections.json  (committed corrections)
 *   .cache/feedback-corrections.json (local corrections, if present)
 *   .cache/classification-history.json
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { loadJson } from "./_shared/scriptUtils.js";

// ---------------------------------------------------------------------------
// Load stores
// ---------------------------------------------------------------------------
const CACHE_DIR = path.resolve(".cache");
const HISTORY_FILE = path.join(CACHE_DIR, "classification-history.json");
const CACHE_FB_FILE = path.join(CACHE_DIR, "feedback-corrections.json");
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");

type HistoryEntry = {
  entryId: string;
  title: string;
  url: string;
  classifiedAt: string;
  overallConfidence: number;
  needsReview: boolean;
  fields: Record<string, { value: string | string[]; confidence: number }>;
};

type Correction = {
  entryId: string;
  title: string;
  url: string;
  correctedAt: string;
  notes?: string;
  fields: Record<string, string | string[]>;
};

function loadCorrections(): Record<string, Correction> {
  const seed = loadJson<Record<string, Correction>>(SEED_FB_FILE) ?? {};
  const cache = loadJson<Record<string, Correction>>(CACHE_FB_FILE) ?? {};
  // Strip _comment keys
  const merged: Record<string, Correction> = {};
  for (const [k, v] of Object.entries({ ...seed, ...cache })) {
    if (typeof v === "object" && v !== null && "entryId" in v)
      merged[k] = v as Correction;
  }
  return merged;
}

// ---------------------------------------------------------------------------
// Comparison helpers
// ---------------------------------------------------------------------------
function normalize(v: unknown): string {
  if (Array.isArray(v)) return v.map(String).sort().join(" | ");
  return String(v ?? "").trim();
}

function fieldMatch(ai: unknown, human: unknown): boolean {
  return normalize(ai) === normalize(human);
}

// Partial credit: % overlap for multi-select
function partialScore(ai: unknown, human: unknown): number {
  const aiArr = Array.isArray(ai) ? ai.map(String) : [String(ai ?? "")];
  const humArr = Array.isArray(human)
    ? human.map(String)
    : [String(human ?? "")];
  const aiSet = new Set(aiArr.filter(Boolean));
  const humSet = new Set(humArr.filter(Boolean));
  if (aiSet.size === 0 && humSet.size === 0) return 1;
  let hit = 0;
  for (const v of humSet) if (aiSet.has(v)) hit++;
  return humSet.size > 0 ? hit / humSet.size : 0;
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const fieldFocus = argv[argv.indexOf("--field") + 1] ?? null;
const jsonMode = argv.includes("--json");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const corrections = loadCorrections();
  const history = loadJson<Record<string, HistoryEntry>>(HISTORY_FILE) ?? {};

  const corrCount = Object.keys(corrections).length;
  const histCount = Object.keys(history).length;

  if (!jsonMode) {
    console.log("📊 Classifier Accuracy Report\n");
    console.log(`  Human corrections:       ${corrCount}`);
    console.log(`  Classification history:  ${histCount} entries`);
    console.log(
      `  Overlap (both present):  ${Object.keys(corrections).filter((id) => history[id]).length} entries\n`,
    );
  }

  // Gather overlap entries
  const overlap = Object.entries(corrections)
    .filter(([id]) => history[id])
    .map(([id, correction]) => ({ id, correction, hist: history[id] }));

  if (overlap.length === 0) {
    if (!jsonMode) {
      console.log("⚠️  No overlap between corrections and history found.");
      console.log(
        "   Run classify-pillar-pages.ts first, then this report will compare AI output vs human corrections.",
      );
    }
    return;
  }

  // Semantic fields to measure (ordered by importance)
  const FIELDS = [
    "topic",
    "funnelStage",
    "industry",
    "jobLevel",
    "jobFunction",
    "audience",
    "useCases",
    "product",
    "assetType",
    "assetSubType",
    "companySize",
    "schemaType",
    "language",
    "usageRights",
  ];

  const focusFields = fieldFocus ? [fieldFocus] : FIELDS;

  type FieldStats = {
    field: string;
    total: number;
    exact: number;
    partial: number; // avg partial score
    avgConfWrong: number; // avg AI confidence when wrong (miscalibration signal)
    examples: Array<{
      title: string;
      ai: string;
      human: string;
      confidence: number;
    }>;
  };

  const stats: FieldStats[] = [];

  for (const field of focusFields) {
    let total = 0,
      exact = 0,
      partialSum = 0,
      confWrongSum = 0,
      confWrongN = 0;
    const examples: FieldStats["examples"] = [];

    for (const { correction, hist } of overlap) {
      const humanVal = correction.fields[field];
      if (humanVal === undefined || humanVal === null) continue;

      const aiField = hist.fields[field];
      if (!aiField) continue;

      total++;
      const aiVal = aiField.value;
      const aiConf =
        typeof aiField.confidence === "number"
          ? aiField.confidence > 1
            ? aiField.confidence / 100
            : aiField.confidence
          : 0;

      const isExact = fieldMatch(aiVal, humanVal);
      const partial = partialScore(aiVal, humanVal);

      if (isExact) {
        exact++;
      } else {
        confWrongSum += aiConf;
        confWrongN++;
        examples.push({
          title: correction.title,
          ai: normalize(aiVal),
          human: normalize(humanVal),
          confidence: aiConf,
        });
      }
      partialSum += partial;
    }

    if (total === 0) continue;

    stats.push({
      field,
      total,
      exact,
      partial: total > 0 ? partialSum / total : 0,
      avgConfWrong: confWrongN > 0 ? confWrongSum / confWrongN : 0,
      examples: examples.slice(0, 3),
    });
  }

  // ── JSON output ──
  if (jsonMode) {
    const output = {
      generatedAt: new Date().toISOString(),
      corrections: corrCount,
      historyEntries: histCount,
      overlap: overlap.length,
      fields: stats.map((s) => ({
        field: s.field,
        exactAccuracy:
          s.total > 0 ? Math.round((s.exact / s.total) * 100) : null,
        partialAccuracy: Math.round(s.partial * 100),
        avgConfWhenWrong: Math.round(s.avgConfWrong * 100),
        total: s.total,
        misses: s.total - s.exact,
      })),
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  // ── Terminal output ──
  const sorted = [...stats].sort(
    (a, b) => a.exact / a.total - b.exact / b.total,
  );

  console.log("Field Accuracy (exact match vs. human corrections):\n");

  const COL_W = 30;
  console.log(
    `  ${"Field".padEnd(COL_W)} ${"Exact".padStart(7)} ${"Partial".padStart(8)} ${"Conf@Wrong".padStart(11)} ${"n".padStart(4)}`,
  );
  console.log("  " + "─".repeat(COL_W + 34));

  for (const s of sorted) {
    const exactPct = Math.round((s.exact / s.total) * 100);
    const partialPct = Math.round(s.partial * 100);
    const confPct = Math.round(s.avgConfWrong * 100);
    const flag = exactPct < 60 ? " ← needs attention" : exactPct < 80 ? "" : "";
    console.log(
      `  ${s.field.padEnd(COL_W)} ${String(exactPct + "%").padStart(7)} ${String(partialPct + "%").padStart(8)} ${String(confPct + "%").padStart(11)} ${String(s.total).padStart(4)}${flag}`,
    );
  }

  const overall =
    stats.length > 0
      ? Math.round(
          (stats.reduce((sum, s) => sum + s.exact / s.total, 0) /
            stats.length) *
            100,
        )
      : 0;
  console.log("\n  " + "─".repeat(COL_W + 34));
  console.log(
    `  ${"Overall (mean field accuracy)".padEnd(COL_W)} ${String(overall + "%").padStart(7)}\n`,
  );

  // Miscalibration alert
  const highConfWrong = stats.filter(
    (s) => s.avgConfWrong > 0.75 && s.total - s.exact > 0,
  );
  if (highConfWrong.length > 0) {
    console.log("⚠️  Miscalibration alert — AI confident but wrong:");
    for (const s of highConfWrong) {
      console.log(
        `   • ${s.field}: avg confidence ${Math.round(s.avgConfWrong * 100)}% on wrong predictions`,
      );
    }
    console.log(
      "   → Add more corrections for these fields to improve calibration.\n",
    );
  }

  // Show miss examples
  const problemFields = sorted.filter(
    (s) => s.exact / s.total < 0.8 && s.examples.length > 0,
  );
  if (problemFields.length > 0) {
    console.log("Miss examples (AI said → human corrected):");
    for (const s of problemFields.slice(0, 4)) {
      console.log(`\n  [${s.field}]`);
      for (const ex of s.examples) {
        const confStr = `${Math.round(ex.confidence * 100)}%`;
        console.log(`    "${ex.title}"`);
        console.log(`      AI (${confStr} conf): ${ex.ai || "(empty)"}`);
        console.log(`      Human:              ${ex.human}`);
      }
    }
  }

  // Tip
  console.log("\n💡 To improve accuracy:");
  console.log("   • Add more corrections to seeds/feedback-corrections.json");
  console.log(
    "   • Run npx tsx scripts/embed-corrections.ts to activate semantic few-shot",
  );
  console.log(
    "   • Re-run classify-pillar-pages.ts --force to measure improvement",
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
