#!/usr/bin/env tsx
/**
 * judge-classifications.ts
 *
 * LLM-as-Judge: Uses Gemini to automatically critique existing classifications
 * without needing human corrections. Generates "soft labels" that surface
 * potential errors and feed back into the improvement loop.
 *
 * For each history entry WITHOUT an existing human correction:
 *   1. Feeds the original content signals + the AI classification back to Gemini
 *   2. Asks: "Is this classification correct? What's wrong?"
 *   3. Saves verdict to .cache/judge-verdicts.json
 *   4. Optionally promotes high-confidence critique to corrections store
 *
 * Usage:
 *   npx tsx scripts/judge-classifications.ts
 *   npx tsx scripts/judge-classifications.ts --promote   # auto-add high-conf critiques as corrections
 *   npx tsx scripts/judge-classifications.ts --id <entryId>  # judge a single entry
 *   npx tsx scripts/judge-classifications.ts --json       # machine-readable output
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { loadJson } from "./_shared/scriptUtils.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const HISTORY_FILE = path.resolve(".cache/classification-history.json");
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");
const CACHE_FB_FILE = path.resolve(".cache/feedback-corrections.json");
const VERDICTS_FILE = path.resolve(".cache/judge-verdicts.json");

const JUDGE_MODEL =
  process.env.GEMINI_JUDGE_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash-lite";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface HistoryEntry {
  entryId: string;
  title: string;
  url: string;
  classifiedAt: string;
  overallConfidence: number;
  fields: Record<string, { value: string | string[]; confidence: number }>;
}

interface JudgeVerdict {
  entryId: string;
  title: string;
  url: string;
  judgedAt: string;
  overallScore: "correct" | "likely-correct" | "questionable" | "wrong";
  confidence: number; // 0–1: how sure the judge is of its verdict
  issues: Array<{
    field: string;
    aiValue: string;
    suggested: string;
    reason: string;
    severity: "critical" | "minor";
  }>;
  notes: string;
}

// ---------------------------------------------------------------------------
// Load stores
// ---------------------------------------------------------------------------
function loadHistory(): Record<string, HistoryEntry> {
  return loadJson(HISTORY_FILE) ?? {};
}

function loadCorrections(): Set<string> {
  const seed = loadJson<Record<string, unknown>>(SEED_FB_FILE) ?? {};
  const cache = loadJson<Record<string, unknown>>(CACHE_FB_FILE) ?? {};
  return new Set(
    [...Object.keys(seed), ...Object.keys(cache)].filter(
      (k) => !k.startsWith("_"),
    ),
  );
}

function loadVerdicts(): Record<string, JudgeVerdict> {
  return loadJson(VERDICTS_FILE) ?? {};
}

function saveVerdicts(verdicts: Record<string, JudgeVerdict>): void {
  const dir = path.dirname(VERDICTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(VERDICTS_FILE, JSON.stringify(verdicts, null, 2), "utf-8");
}

// ---------------------------------------------------------------------------
// Judge prompt
// ---------------------------------------------------------------------------
function buildJudgePrompt(entry: HistoryEntry): string {
  const fields = Object.entries(entry.fields)
    .map(([f, { value, confidence }]) => {
      const display = Array.isArray(value)
        ? value.join(", ")
        : String(value ?? "");
      return `  ${f}: ${display || "(empty)"}  [conf: ${Math.round(confidence * 100)}%]`;
    })
    .join("\n");

  return `You are an expert content taxonomy reviewer for a B2B SaaS company (Contentful — headless CMS).
Your job is to critically evaluate an AI classifier's output and flag any errors.

## CONTENT BEING REVIEWED
Title: ${entry.title}
URL: ${entry.url}
Classified at: ${entry.classifiedAt}

## AI CLASSIFICATION OUTPUT
${fields}

## YOUR TASK
Review each field and determine:
1. Is the classification correct for this type of content?
2. Are there any fields that are clearly wrong or suspicious?
3. What should the correct values be?

Key rules to check against:
- Product pages (URL: /products/) should be funnelStage = "Evaluation/Engagement (BOFU)"
- Blog posts (URL: /blog/) should be funnelStage = "Awareness (TOFU)"
- Documentation (URL: /developers/ or /docs/) should be funnelStage = "Retention"
- Industry should default to "Software, IT & Technology" unless clear vertical signals
- jobLevel should NOT be C-Level for TOFU/educational content
- schemaType SoftwareApplication = product pages only; Article/TechArticle = editorial
- DigitalDocument = downloadable files only, never web pages

CRITICAL — only suggest values from these exact taxonomy lists:
- assetType: Webpage | Document | Video | Audio | Graphic | Photo
- schemaType: SoftwareApplication | Article | TechArticle | BlogPosting | FAQPage | HowTo | Report | VideoObject | DigitalDocument | Event | PodcastEpisode | NewsArticle
- companySize: Enterprise | Commercial | Small business  (NEVER "All")
- product: Platform | AI Actions | Ecosystem | Personalization | Analytics | Front-end Hosting  (NEVER topic labels like "Headless CMS")
- funnelStage: Awareness (TOFU) | Consideration (MOFU) | Evaluation/Engagement (BOFU) | Retention | Sign-up

Be a tough critic. Flag anything that seems off, even if confidence is high.
If the field is correct, still say why.`;
}

// ---------------------------------------------------------------------------
// Verdict schema
// ---------------------------------------------------------------------------
const VerdictSchema = z.object({
  overallScore: z.enum(["correct", "likely-correct", "questionable", "wrong"]),
  confidence: z.number().min(0).max(1),
  notes: z.string(),
  issues: z.array(
    z.object({
      field: z.string(),
      aiValue: z.string(),
      suggested: z.string(),
      reason: z.string(),
      severity: z.enum(["critical", "minor"]),
    }),
  ),
});

// ---------------------------------------------------------------------------
// Judge a single entry
// ---------------------------------------------------------------------------
async function judgeEntry(entry: HistoryEntry): Promise<JudgeVerdict> {
  const prompt = buildJudgePrompt(entry);

  const { object } = await generateObject({
    model: google(JUDGE_MODEL) as import("ai").LanguageModel,
    schema: VerdictSchema,
    prompt,
    temperature: 0,
  });
  const verdict = VerdictSchema.parse(object);

  return {
    entryId: entry.entryId,
    title: entry.title,
    url: entry.url,
    judgedAt: new Date().toISOString(),
    overallScore: verdict.overallScore,
    confidence: verdict.confidence,
    issues: verdict.issues,
    notes: verdict.notes,
  };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
const argv = process.argv.slice(2);
const promote = argv.includes("--promote");
const jsonMode = argv.includes("--json");
const singleId = argv[argv.indexOf("--id") + 1] ?? null;

const scoreOrder: Record<string, number> = {
  wrong: 0,
  questionable: 1,
  "likely-correct": 2,
  correct: 3,
};

async function main() {
  const history = loadHistory();
  const corrected = loadCorrections();
  const verdicts = loadVerdicts();

  const allEntries = Object.values(history);
  const toJudge = allEntries
    .filter((e) => !corrected.has(e.entryId)) // skip human-corrected
    .filter((e) =>
      singleId ? e.entryId === singleId || e.url.includes(singleId) : true,
    )
    .filter((e) => !verdicts[e.entryId]) // skip already judged
    .slice(0, 20); // max 20 per run

  if (!jsonMode) {
    console.log(`\nLLM-as-Judge: ${JUDGE_MODEL}\n`);
    console.log(`  History entries:   ${allEntries.length}`);
    console.log(`  Human-corrected:   ${corrected.size} (skipped)`);
    console.log(`  Already judged:    ${Object.keys(verdicts).length}`);
    console.log(`  To judge now:      ${toJudge.length}\n`);
  }

  if (toJudge.length === 0) {
    if (!jsonMode)
      console.log(
        "Nothing to judge. All entries are either corrected or already judged.\n",
      );
    return;
  }

  let judged = 0;
  let flagged = 0;

  for (const entry of toJudge) {
    if (!jsonMode) process.stdout.write(`  Judging "${entry.title}"... `);

    try {
      const verdict = await judgeEntry(entry);
      verdicts[entry.entryId] = verdict;
      saveVerdicts(verdicts);

      const score = verdict.overallScore;
      const critCount = verdict.issues.filter(
        (i) => i.severity === "critical",
      ).length;

      if (!jsonMode) {
        const icon =
          score === "correct"
            ? "ok"
            : score === "likely-correct"
              ? "~ok"
              : score === "questionable"
                ? "?"
                : "WRONG";
        console.log(`${icon}  (${critCount} critical issues)`);
        for (const issue of verdict.issues.filter(
          (i) => i.severity === "critical",
        )) {
          console.log(
            `       [${issue.field}] AI="${issue.aiValue}" → should be "${issue.suggested}"`,
          );
          console.log(`       Reason: ${issue.reason}`);
        }
      }

      if (score !== "correct" && score !== "likely-correct") flagged++;
      judged++;

      // Promote high-confidence critiques to corrections store
      if (promote && verdict.confidence >= 0.85 && verdict.issues.length > 0) {
        // Taxonomy guard: only promote values that are valid in the taxonomy
        const VALID_SCHEMA_TYPES = new Set([
          "SoftwareApplication",
          "Article",
          "TechArticle",
          "BlogPosting",
          "FAQPage",
          "HowTo",
          "Report",
          "VideoObject",
          "DigitalDocument",
          "Event",
          "PodcastEpisode",
          "NewsArticle",
        ]);
        const VALID_COMPANY_SIZES = new Set([
          "Enterprise",
          "Commercial",
          "Small business",
        ]);
        const VALID_PRODUCTS = new Set([
          "Platform",
          "AI Actions",
          "Ecosystem",
          "Personalization",
          "Analytics",
          "Front-end Hosting",
        ]);
        const VALID_ASSET_TYPES = new Set([
          "Document",
          "Video",
          "Audio",
          "Graphic",
          "Photo",
        ]);

        const correctionFields: Record<string, string | string[]> = {};
        for (const issue of verdict.issues.filter(
          (i) => i.severity === "critical" && i.suggested,
        )) {
          const { field, suggested } = issue;
          // Reject known-invalid values before promoting
          if (
            field === "assetType" &&
            !VALID_ASSET_TYPES.has(suggested as string)
          )
            continue;
          if (
            field === "schemaType" &&
            !VALID_SCHEMA_TYPES.has(suggested as string)
          )
            continue;
          if (
            field === "companySize" &&
            !VALID_COMPANY_SIZES.has(suggested as string)
          )
            continue;
          if (field === "product") {
            const arr = Array.isArray(suggested) ? suggested : [suggested];
            if (!arr.every((p: string) => VALID_PRODUCTS.has(p))) continue;
          }
          correctionFields[field] = suggested;
        }
        if (Object.keys(correctionFields).length > 0) {
          const cacheStore = loadJson<Record<string, unknown>>(CACHE_FB_FILE) ?? {};
          cacheStore[entry.entryId] = {
            entryId: entry.entryId,
            title: entry.title,
            url: entry.url,
            correctedAt: new Date().toISOString(),
            correctedBy: `judge:${JUDGE_MODEL}`,
            notes: `Auto-promoted from LLM judge. Score: ${verdict.overallScore}. ${verdict.notes}`,
            fields: correctionFields,
          };
          const dir = path.dirname(CACHE_FB_FILE);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(
            CACHE_FB_FILE,
            JSON.stringify(cacheStore, null, 2),
            "utf-8",
          );
          if (!jsonMode)
            console.log(
              `       → Promoted to corrections store (${Object.keys(correctionFields).length} fields)`,
            );
        }
      }
    } catch (err: unknown) {
      if (!jsonMode) console.log(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Summary
  const allVerdicts = Object.values(verdicts);
  const byScore = allVerdicts.reduce<Record<string, number>>((acc, v) => {
    acc[v.overallScore] = (acc[v.overallScore] ?? 0) + 1;
    return acc;
  }, {});

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          judgedThisRun: judged,
          flaggedThisRun: flagged,
          totalJudged: allVerdicts.length,
          byScore,
          verdicts: allVerdicts.sort(
            (a, b) => scoreOrder[a.overallScore] - scoreOrder[b.overallScore],
          ),
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log(`\nThis run: ${judged} judged, ${flagged} flagged\n`);
  console.log("All-time verdicts:");
  for (const [score, count] of Object.entries(byScore).sort(
    (a, b) => scoreOrder[a[0]] - scoreOrder[b[0]],
  )) {
    const bar = "█".repeat(count);
    console.log(`  ${score.padEnd(15)} ${String(count).padStart(3)}  ${bar}`);
  }

  const criticalIssues = allVerdicts.flatMap((v) =>
    v.issues.filter((i) => i.severity === "critical"),
  );
  const byField = criticalIssues.reduce<Record<string, number>>((acc, i) => {
    acc[i.field] = (acc[i.field] ?? 0) + 1;
    return acc;
  }, {});
  if (Object.keys(byField).length > 0) {
    console.log("\nMost-flagged fields:");
    for (const [field, count] of Object.entries(byField).sort(
      (a, b) => b[1] - a[1],
    )) {
      console.log(`  ${field.padEnd(20)} ${count} critical issues`);
    }
  }

  console.log("\n  Verdicts stored in .cache/judge-verdicts.json");
  if (!promote)
    console.log(
      "  Run with --promote to auto-add high-confidence critiques to corrections store.",
    );
  console.log("");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
