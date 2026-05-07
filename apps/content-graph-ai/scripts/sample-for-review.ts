#!/usr/bin/env tsx
/**
 * sample-for-review.ts
 *
 * Samples uncorrected classification history entries for human review,
 * exports a CSV that a content reviewer can fill in to create ground-truth
 * corrections. This is the P0 step to get real accuracy numbers.
 *
 * Strategy: stratified random sample across inferred content types so the
 * review set covers the full distribution, not just the easy cases.
 *
 * Usage:
 *   npx tsx scripts/sample-for-review.ts
 *   npx tsx scripts/sample-for-review.ts --n 30           # sample size (default 25)
 *   npx tsx scripts/sample-for-review.ts --seed 42        # reproducible sample
 *   npx tsx scripts/sample-for-review.ts --fields topic,funnelStage,jobFunction
 *   npx tsx scripts/sample-for-review.ts --worst-confidence  # bias toward low-conf entries
 *
 * Output:
 *   exports/review-sample-<date>.csv  — import into Google Sheets for review
 *   exports/review-sample-<date>.json — machine-readable for later import as corrections
 *
 * After review:
 *   1. Fill in the "human_<field>" columns in the CSV
 *   2. Run: npx tsx scripts/import-review-corrections.ts exports/review-sample-<date>.csv
 *      (that script converts filled CSV → seeds/feedback-corrections.json entries)
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();
import * as fs from "fs";
import * as path from "path";
import { loadJson } from "./_shared/scriptUtils.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const HISTORY_FILE = path.resolve(".cache/classification-history.json");
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");
const CACHE_FB_FILE = path.resolve(".cache/feedback-corrections.json");
const EXPORTS_DIR = path.resolve("exports");

const REVIEW_FIELDS = [
  "assetType",
  "assetSubType",
  "schemaType",
  "product",
  "topic",
  "useCases",
  "industry",
  "companySize",
  "funnelStage",
  "jobFunction",
  "jobLevel",
  "audience",
  "language",
  "usageRights",
];

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const sampleSize = Number(argv[argv.indexOf("--n") + 1] ?? 25);
const seed = Number(argv[argv.indexOf("--seed") + 1] ?? Date.now());
const worstConf = argv.includes("--worst-confidence");
const fieldFilter = argv.includes("--fields")
  ? argv[argv.indexOf("--fields") + 1].split(",").map((f) => f.trim())
  : REVIEW_FIELDS;

// ---------------------------------------------------------------------------
// Deterministic shuffle (seeded LCG)
// ---------------------------------------------------------------------------
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = seed;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------------------------------------------------------------------------
// Content type inference from URL + title
// ---------------------------------------------------------------------------
function inferContentType(url: string, title: string): string {
  const u = url.toLowerCase();
  const t = title.toLowerCase();
  if (
    u.includes("case-stud") ||
    u.includes("/customers/") ||
    t.includes("case study")
  )
    return "pageCaseStudy";
  if (u.includes("/blog/") || u.includes("/articles/")) return "pageBlogPost";
  if (
    u.includes("/resources/") ||
    t.includes("ebook") ||
    t.includes("whitepaper") ||
    t.includes("report") ||
    t.includes("guide to")
  )
    return "pageResource";
  if (
    u.includes("/webinars/") ||
    t.includes("webinar") ||
    t.match(/-wbr-|-ws-/)
  )
    return "pageWebinar";
  if (u.includes("/solutions/")) return "pageSolution";
  if (u.includes("/products/") || u === "products") return "pageProduct";
  if (u.includes("/glossary/") || t.includes("glossary")) return "pageGlossary";
  if (
    t.startsWith("what is") ||
    t.startsWith("how to") ||
    t.includes(" guide") ||
    t.includes("explained")
  )
    return "pageLongFormSeo";
  return "other";
}

// ---------------------------------------------------------------------------
// Load helpers
// ---------------------------------------------------------------------------
function getAlreadyCorrectedIds(): Set<string> {
  const ids = new Set<string>();
  for (const file of [SEED_FB_FILE, CACHE_FB_FILE]) {
    const data = loadJson<Record<string, unknown>>(file);
    if (data) Object.keys(data).forEach((k) => ids.add(k));
  }
  return ids;
}

// ---------------------------------------------------------------------------
// CSV escaping
// ---------------------------------------------------------------------------
function csvCell(value: unknown): string {
  const str = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const history = loadJson<
    Record<
      string,
      {
        entryId: string;
        title: string;
        url: string;
        classifiedAt: string;
        overallConfidence: number;
        needsReview: boolean;
        fields: Record<string, { value: unknown; confidence: number }>;
      }
    >
  >(HISTORY_FILE);

  if (!history) {
    console.error("No classification history found at", HISTORY_FILE);
    console.error("Run classify-pillar-pages.ts first to build history.");
    process.exit(1);
  }

  const correctedIds = getAlreadyCorrectedIds();
  console.log(`Total history entries:    ${Object.keys(history).length}`);
  console.log(`Already corrected:        ${correctedIds.size}`);

  // Filter to uncorrected entries
  const uncorrected = Object.entries(history).filter(
    ([id]) => !correctedIds.has(id),
  );
  console.log(`Available for sampling:   ${uncorrected.length}`);

  if (uncorrected.length === 0) {
    console.log(
      "All history entries already have corrections. Nothing to sample.",
    );
    return;
  }

  // Enrich with inferred content type and group
  const enriched = uncorrected.map(([id, entry]) => ({
    id,
    entry,
    contentType: inferContentType(entry.url, entry.title),
  }));

  // Group by content type for stratified sampling
  const byType = new Map<string, typeof enriched>();
  for (const item of enriched) {
    if (!byType.has(item.contentType)) byType.set(item.contentType, []);
    byType.get(item.contentType)!.push(item);
  }

  console.log("\nContent type distribution of uncorrected entries:");
  for (const [ct, items] of [...byType.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )) {
    console.log(`  ${ct.padEnd(30)} ${items.length}`);
  }

  // Stratified sample: allocate proportionally, min 1 per type if possible
  const types = [...byType.keys()];
  const totalUncorrected = enriched.length;
  const n = Math.min(sampleSize, totalUncorrected);

  const allocations = new Map<string, number>();
  let allocated = 0;
  // First pass: guarantee at least 1 per type if sample budget allows
  for (const ct of types) {
    const quota = Math.max(
      1,
      Math.round((byType.get(ct)!.length / totalUncorrected) * n),
    );
    allocations.set(ct, quota);
    allocated += quota;
  }
  // Trim or expand to exactly n
  while (allocated > n) {
    const largest = [...allocations.entries()].sort((a, b) => b[1] - a[1])[0];
    allocations.set(largest[0], largest[1] - 1);
    allocated--;
  }
  while (allocated < n) {
    const ct = types[allocated % types.length];
    allocations.set(ct, (allocations.get(ct) ?? 0) + 1);
    allocated++;
  }

  // Sample from each type (bias toward low confidence if --worst-confidence)
  const sampled: typeof enriched = [];
  for (const [ct, quota] of allocations.entries()) {
    const pool = byType.get(ct)!;
    const ordered = worstConf
      ? [...pool].sort(
          (a, b) => a.entry.overallConfidence - b.entry.overallConfidence,
        )
      : seededShuffle(pool, seed + ct.charCodeAt(0));
    sampled.push(...ordered.slice(0, Math.min(quota, pool.length)));
  }

  // Sort for consistent CSV output (by content type, then title)
  sampled.sort(
    (a, b) =>
      a.contentType.localeCompare(b.contentType) ||
      a.entry.title.localeCompare(b.entry.title),
  );

  console.log(
    `\nSampling ${sampled.length} entries (target: ${n}, seed: ${seed})`,
  );
  console.log("Allocation:");
  for (const [ct, quota] of [...allocations.entries()].sort()) {
    console.log(`  ${ct.padEnd(30)} ${quota}`);
  }

  // ---------------------------------------------------------------------------
  // Build CSV
  // ---------------------------------------------------------------------------
  const activeFields = fieldFilter.filter((f) => REVIEW_FIELDS.includes(f));

  const headers = [
    "entry_id",
    "title",
    "url",
    "content_type",
    "overall_confidence",
    "needs_review",
    "classified_at",
    ...activeFields.map((f) => `ai_${f}`),
    ...activeFields.map((f) => `ai_conf_${f}`),
    ...activeFields.map((f) => `human_${f}`), // blank — reviewer fills these in
    "reviewer_notes",
    "contentful_url",
  ];

  const rows: string[][] = [headers];
  const jsonOutput: Array<Record<string, unknown>> = [];

  for (const { id, entry, contentType } of sampled) {
    const aiValues = activeFields.map((f) => {
      const field = entry.fields[f];
      if (!field) return "-";
      const v = field.value;
      return v != null && v !== "" && !(Array.isArray(v) && v.length === 0)
        ? csvCell(v)
        : "-";
    });
    const aiConfs = activeFields.map((f) => {
      const field = entry.fields[f];
      if (!field) return "";
      const c = field.confidence;
      const normalized = c > 1 ? c / 100 : c;
      return String(Math.round(normalized * 100)) + "%";
    });
    const humanBlanks = activeFields.map(() => ""); // reviewer fills in

    const cfUrl = entry.url
      ? `https://app.contentful.com/spaces/{SPACE_ID}/entries/${id}`
      : "";

    rows.push([
      id,
      csvCell(entry.title),
      entry.url,
      contentType,
      String(Math.round(entry.overallConfidence * 100)) + "%",
      entry.needsReview ? "YES" : "no",
      entry.classifiedAt
        ? new Date(entry.classifiedAt).toLocaleDateString()
        : "",
      ...aiValues,
      ...aiConfs,
      ...humanBlanks,
      "", // reviewer_notes
      cfUrl,
    ]);

    jsonOutput.push({
      entryId: id,
      title: entry.title,
      url: entry.url,
      contentType,
      overallConfidence: entry.overallConfidence,
      needsReview: entry.needsReview,
      classifiedAt: entry.classifiedAt,
      aiFields: Object.fromEntries(
        activeFields.map((f) => [
          f,
          {
            value: entry.fields[f]?.value ?? null,
            confidence: entry.fields[f]?.confidence ?? null,
          },
        ]),
      ),
      humanFields: {}, // to be filled
    });
  }

  // ---------------------------------------------------------------------------
  // Write outputs
  // ---------------------------------------------------------------------------
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  const dateStr = new Date().toISOString().slice(0, 10);
  const csvPath = path.join(EXPORTS_DIR, `review-sample-${dateStr}.csv`);
  const jsonPath = path.join(EXPORTS_DIR, `review-sample-${dateStr}.json`);

  fs.writeFileSync(csvPath, rows.map((r) => r.join(",")).join("\n"), "utf-8");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2), "utf-8");

  console.log(`\nExported:`);
  console.log(`  CSV:  ${csvPath}`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Open the CSV in Google Sheets`);
  console.log(
    `  2. For each row: fill in the human_<field> columns with the correct taxonomy values`,
  );
  console.log(`     - Leave blank if the AI got it right`);
  console.log(`     - Add a reviewer_notes if the case is ambiguous`);
  console.log(
    `  3. Run: npx tsx scripts/import-review-corrections.ts ${csvPath}`,
  );
  console.log(
    `     to convert filled corrections into seeds/feedback-corrections.json`,
  );
  console.log(`\nFields being reviewed: ${activeFields.join(", ")}`);
  console.log(`\nAccuracy measurement: once corrections are imported, run:`);
  console.log(`  npx tsx scripts/accuracy-report.ts`);
  console.log(`  to see real accuracy across all content types.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
