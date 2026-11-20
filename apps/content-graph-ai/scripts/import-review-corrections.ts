#!/usr/bin/env tsx
/**
 * import-review-corrections.ts
 *
 * Reads a filled review CSV (produced by sample-for-review.ts) and converts
 * human corrections into entries in seeds/feedback-corrections.json.
 *
 * Only rows where a reviewer has filled in at least one human_<field> column
 * are imported. Rows with all human_<field> columns blank are skipped
 * (treated as "AI was correct").
 *
 * Usage:
 *   npx tsx scripts/import-review-corrections.ts exports/review-sample-2026-03-27.csv
 *   npx tsx scripts/import-review-corrections.ts exports/review-sample-2026-03-27.csv --dry-run
 *   npx tsx scripts/import-review-corrections.ts exports/review-sample-2026-03-27.csv --reviewer "alice@contentful.com"
 *
 * Output:
 *   Appends new correction entries to seeds/feedback-corrections.json
 *   Prints a summary of what was imported and what was skipped.
 *
 * After import:
 *   Run: npx tsx scripts/accuracy-report.ts
 *   to see updated accuracy metrics with real ground truth data.
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const csvPath = argv.find((a) => a.endsWith(".csv"));
const dryRun = argv.includes("--dry-run");
const reviewerIdx = argv.indexOf("--reviewer");
const reviewer = reviewerIdx >= 0 ? argv[reviewerIdx + 1] : "content-team";

if (!csvPath) {
  console.error(
    "Usage: npx tsx scripts/import-review-corrections.ts <path-to-csv> [--dry-run] [--reviewer name]",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");

// Multi-value fields that should be stored as arrays
const MULTI_VALUE_FIELDS = new Set([
  "assetSubType",
  "product",
  "topic",
  "useCases",
  "industry",
  "companySize",
  "region",
  "jobFunction",
  "jobLevel",
  "audience",
]);

// ---------------------------------------------------------------------------
// Parse CSV (handles quoted fields with commas and escaped quotes)
// ---------------------------------------------------------------------------
function parseCSV(content: string): string[][] {
  const rows: string[][] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const cells: string[] = [];
    let inQuotes = false;
    let current = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current);
    rows.push(cells);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Normalize a human-entered field value
// ---------------------------------------------------------------------------
function normalizeValue(
  raw: string,
  fieldName: string,
): string | string[] | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (MULTI_VALUE_FIELDS.has(fieldName)) {
    // Reviewer may use semicolons or commas as separators
    const parts = trimmed
      .split(/[;|]/)
      .map((p) => p.trim())
      .filter(Boolean);
    return parts.length === 1 ? parts : parts;
  }
  return trimmed;
}

// ---------------------------------------------------------------------------
// Load / save seed corrections
// ---------------------------------------------------------------------------
function loadSeedCorrections(): Record<string, unknown> {
  try {
    if (fs.existsSync(SEED_FB_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_FB_FILE, "utf-8")) as Record<
        string,
        unknown
      >;
    }
  } catch {
    /* ignore */
  }
  return {};
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!fs.existsSync(csvPath!)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath!, "utf-8");
  const rows = parseCSV(content);

  if (rows.length < 2) {
    console.error("CSV has no data rows.");
    process.exit(1);
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  // Build column index
  const col = (name: string) => headers.indexOf(name);

  const entryIdCol = col("entry_id");
  const titleCol = col("title");
  const urlCol = col("url");
  const notesCol = col("reviewer_notes");

  if (entryIdCol < 0) {
    console.error("CSV missing required column: entry_id");
    process.exit(1);
  }

  // Detect which fields are present (human_<field> columns)
  const humanFieldCols = headers
    .map((h, i) => ({ header: h, index: i }))
    .filter(({ header }) => header.startsWith("human_"))
    .map(({ header, index }) => ({
      field: header.replace("human_", ""),
      index,
    }));

  if (humanFieldCols.length === 0) {
    console.error(
      "No human_<field> columns found in CSV. Did you use the right file?",
    );
    process.exit(1);
  }

  console.log(`CSV: ${csvPath}`);
  console.log(`Data rows: ${dataRows.length}`);
  console.log(
    `Human fields detected: ${humanFieldCols.map((f) => f.field).join(", ")}`,
  );
  if (dryRun) console.log("DRY RUN — no files will be written\n");

  // ---------------------------------------------------------------------------
  // Process each row
  // ---------------------------------------------------------------------------
  const existing = loadSeedCorrections();
  const toImport: Array<{
    entryId: string;
    correction: Record<string, unknown>;
  }> = [];
  let skippedBlank = 0;
  let skippedDuplicate = 0;

  for (const row of dataRows) {
    const entryId = row[entryIdCol]?.trim();
    if (!entryId) continue;

    // Collect non-blank human corrections for this row
    const correctedFields: Record<string, string | string[]> = {};
    for (const { field, index } of humanFieldCols) {
      const raw = row[index] ?? "";
      const normalized = normalizeValue(raw, field);
      if (normalized !== null) {
        correctedFields[field] = normalized;
      }
    }

    if (Object.keys(correctedFields).length === 0) {
      skippedBlank++;
      continue; // Reviewer left all blank = AI was correct = no correction needed
    }

    if (existing[entryId]) {
      skippedDuplicate++;
      console.log(
        `  SKIP (already corrected): ${entryId} — ${row[titleCol] ?? ""}`,
      );
      continue;
    }

    const correction = {
      entryId,
      title: row[titleCol]?.trim() ?? "",
      url: row[urlCol]?.trim() ?? "",
      correctedAt: new Date().toISOString(),
      correctedBy: reviewer,
      notes: row[notesCol]?.trim() || undefined,
      source: "review-sample",
      fields: correctedFields,
    };

    toImport.push({ entryId, correction });
    console.log(`  IMPORT: ${entryId} — ${correction.title.slice(0, 55)}`);
    for (const [field, value] of Object.entries(correctedFields)) {
      console.log(
        `    ${field}: ${Array.isArray(value) ? value.join(", ") : value}`,
      );
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Rows with corrections: ${toImport.length}`);
  console.log(`  Rows with blank human fields (AI correct): ${skippedBlank}`);
  console.log(`  Rows already in corrections store: ${skippedDuplicate}`);

  if (toImport.length === 0) {
    console.log("\nNothing to import.");
    return;
  }

  if (dryRun) {
    console.log(
      "\nDry run complete. Re-run without --dry-run to write corrections.",
    );
    return;
  }

  // ---------------------------------------------------------------------------
  // Write to seeds file
  // ---------------------------------------------------------------------------
  const updated = { ...existing };
  for (const { entryId, correction } of toImport) {
    updated[entryId] = correction;
  }

  fs.writeFileSync(SEED_FB_FILE, JSON.stringify(updated, null, 2), "utf-8");
  console.log(`\nWrote ${toImport.length} new corrections to ${SEED_FB_FILE}`);
  console.log(`Total corrections in seed file: ${Object.keys(updated).length}`);
  console.log(`\nNext steps:`);
  console.log(
    `  1. npx tsx scripts/embed-corrections.ts        — add embeddings for semantic few-shot`,
  );
  console.log(
    `  2. npx tsx scripts/accuracy-report.ts          — see updated accuracy with real ground truth`,
  );
  console.log(
    `  3. npx tsx scripts/calibrate-confidence.ts     — rebuild calibration profile (needs 25+)`,
  );
  console.log(
    `  4. git add seeds/feedback-corrections.json && git commit -m "chore(corrections): import review batch"`,
  );
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
