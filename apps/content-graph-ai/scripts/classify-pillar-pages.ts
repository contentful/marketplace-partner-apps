#!/usr/bin/env tsx
/**
 * classify-pillar-pages.ts
 *
 * Fetches the 7 pillar SEO pages from Contentful, runs AI taxonomy
 * classification using allowed values sourced from the Bynder Tagging
 * Taxonomy & Permissions Workbook, and writes results to a CSV in exports/.
 *
 * Taxonomy source: Contentful - Tagging Taxonomy & Permissions Workbook.xlsx
 * (Taxonomy sheet — last reviewed 2026-03-02)
 *
 * Usage:
 *   npx tsx scripts/classify-pillar-pages.ts
 *   npx tsx scripts/classify-pillar-pages.ts --content-type page --tag pillar
 *   npx tsx scripts/classify-pillar-pages.ts --ids id1,id2,id3
 *   npx tsx scripts/classify-pillar-pages.ts --content-type pageCaseStudy --limit 200 --force --dry-run
 *   npx tsx scripts/classify-pillar-pages.ts --crawl-concurrency 2 --classify-concurrency 5
 *   npx tsx scripts/classify-pillar-pages.ts --content-type pageCaseStudy --fact-content-limit 1200
 *   npx tsx scripts/classify-pillar-pages.ts --dry-run
 */

import { setupEnv } from "./_shared/env.js";
setupEnv();
import { createHash } from "crypto";
import contentfulManagement from "contentful-management";
const { createClient: createCfClient } = contentfulManagement;
import { createClient as createCdaClient } from "contentful";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import type { AllowedTaxonomyLabels } from "../api/_shared/tools/classificationTool.js";
import { getStaticAllowedTaxonomyLabels } from "../api/_shared/config/taxonomyDefinition.js";
import {
  BATCH_FACT_CONTENT_LIMITS,
  BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES,
} from "../api/_shared/config/classifierPolicy.js";
import { CLASSIFIER_PROMPT_VERSION } from "../api/_shared/config/classifierPipeline.js";
import {
  RecursiveContentCrawler,
  NOISE_CONTENT_TYPES,
} from "../api/_shared/utils/recursiveCrawler.js";
import {
  getClassificationHistory,
  recordClassification,
} from "../api/_shared/utils/classificationHistory.js";
import {
  correctionCount,
  embeddedCorrectionCount,
} from "../api/_shared/utils/feedbackStore.js";
import {
  upsertAssetNode,
  buildContentEdges,
} from "../api/_shared/graph/pgGraph.js";
import * as fs from "fs";
import * as path from "path";
import { logger } from "./_shared/logger.js";

// Note: signal extraction + company enrichment are now auto-run inside
// classifyContent for ALL callers. The script just needs to pass asset.slug.

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN! ||
  process.env.CONTENTFUL_ACCESS_TOKEN!;
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required env vars: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
};
const hasFlag = (flag: string) => args.includes(flag);

const CONTENT_TYPE = getArg("--content-type") || "page";
const TAG_FILTER = getArg("--tag"); // optional: filter by tag id
const DRY_RUN = hasFlag("--dry-run");
const IS_CASE_STUDY_BATCH = ["pageCaseStudy", "caseStudy"].includes(
  CONTENT_TYPE,
);
// --force: bypass classification history cache (always re-classify). Use during testing.
const FORCE_RECLASSIFY = hasFlag("--force");
const FORCE_USE_FEW_SHOT = hasFlag("--use-few-shot");
const SKIP_FEW_SHOT =
  hasFlag("--skip-few-shot") ||
  (!FORCE_USE_FEW_SHOT &&
    (BATCH_FEW_SHOT_DISABLED_CONTENT_TYPES as readonly string[]).includes(
      CONTENT_TYPE,
    ));
const REUSE_UNCHANGED_ROWS =
  !IS_CASE_STUDY_BATCH &&
  !FORCE_RECLASSIFY &&
  !hasFlag("--no-reuse-unchanged") &&
  !getArg("--ids");
const FACT_CONTENT_LIMIT = parseInt(
  getArg("--fact-content-limit") ||
    String(
      (BATCH_FACT_CONTENT_LIMITS as Partial<Record<string, number>>)[
        CONTENT_TYPE
      ] ?? 2000,
    ),
  10,
);
const LIMIT = parseInt(getArg("--limit") || "100", 10);
const CLASSIFY_CONCURRENCY = parseInt(
  getArg("--classify-concurrency") || getArg("--concurrency") || "5",
  10,
);
const CRAWL_CONCURRENCY = parseInt(
  getArg("--crawl-concurrency") ||
    process.env.CLASSIFICATION_CRAWL_CONCURRENCY ||
    "2",
  10,
);
const EXPLICIT_CONTENT_TYPE = args.includes("--content-type");

// The 7 canonical SEO pillar pages — used by default when no --ids or --tag is given.
const PILLAR_PAGE_IDS = [
  "72SM66tqt9OxVvFSxQCqnp", // Headless CMS          /headless-cms
  "2XtEyKdGVnlZk7fdR6Fj45", // Omnichannel           /omnichannel
  "2ebvJ3A9wkLEIjMionm8lQ", // Personalization       /guides/personalization
  "vkpOXTHq6MdMr12H4IlSW", // SEO Guide             /seo-guide
  "50NUCP3axWcuRTRxoHQB1q", // Segmentation          /guides/segmentation
  "2h1o7PJdK462gbfNskvirg", // API                   /guides/api
  "7hadvryR0RnXbPNB2JCHoE", // Composable Content    /composable-content
];

// --ids overrides the default list; --tag bypasses it entirely for ad-hoc runs
const ENTRY_IDS: string[] =
  getArg("--ids")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) ??
  (TAG_FILTER || EXPLICIT_CONTENT_TYPE ? [] : PILLAR_PAGE_IDS);

// ---------------------------------------------------------------------------
// Taxonomy allowed values — sourced from Bynder Tagging Taxonomy Workbook
// Sheet: "Taxonomy", reviewed 2026-03-02
// ---------------------------------------------------------------------------
const BYNDER_TAXONOMY: AllowedTaxonomyLabels = {
  assetSubType: [
    "Ads (organic and paid)",
    "B-Roll",
    "Blog",
    "Brand Guidelines",
    "Case Study",
    "Color",
    "Demo",
    "Documentation",
    "Ebook",
    "Email",
    "Event",
    "External Facing Presentation",
    "Font",
    "Headshot",
    "How To",
    "Icon",
    "Internal Only Presentation",
    "Interview Recording",
    "Logo",
    "Motion Graphic",
    "Music Track",
    "News",
    "One pager",
    "Pattern",
    "Podcast",
    "Product",
    "Rendering",
    "Report",
    "Still shots",
    "Stock",
    "Template",
    "Webinar",
    "Webpage",
    "Captions/SRT",
    "Thumbnail",
    "Background",
  ],
  product: [
    "Platform",
    "Studio",
    "Ecosystem",
    "Marketplace",
    "AI",
    "Ninetailed (Personalization)",
  ],
  jobLevel: [
    "C-Level",
    "VP",
    "Director",
    "Manager",
    "Individual Contributor",
    "Consultant",
  ],
  jobFunction: [
    "Digital strategists",
    "Content",
    "User Experience",
    "Designers",
    "Developers",
    "Digital",
    "Engineering",
    "IT/Engineering",
    "Marketing",
    "Procurement",
    "Product",
    "Retail / ecommerce",
    "Sales",
    "Web Development",
  ],
  audience: [
    "Prospect",
    "Direct Customer",
    "Solution / Agency Partner",
    "Tech / Platform / ISV Partner",
    "Contentful community",
    "Internal",
  ],
  topic: [
    "Analytics",
    "Artificial intelligence (AI)",
    "Community",
    "Composability",
    "Composable commerce",
    "Content governance",
    "Content modeling",
    "Content operations",
    "Deployment",
    "Design",
    "Design systems",
    "Digital experiences",
    "Experimentation",
    "Getting Started with Contentful",
    "GraphQL",
    "Headless CMS",
    "Infrastructure",
    "Integrations",
    "Migration",
    "Personalization",
    "Productivity",
    "Replatforming",
    "Scalability",
    "Security",
    "SEO",
    "Web Development",
    "Commerce",
    "Marketplace",
  ],
  useCases: [
    "Multi-brand experiences",
    "Personalization",
    "Composable commerce",
    "Websites",
    "Knowledge base",
    "Localization",
    "SEO / GEO",
    "Omnichannel",
    "Digital experiences",
    "Experimentation",
  ],
  funnelStage: [
    "Awareness (TOFU)",
    "Consideration (MOFU)",
    "Evaluation/Engagement (BOFU)",
    "Retention",
    "Sign-up",
  ],
  industry: [
    "Automotive",
    "Business services",
    "Consumer Packaged Goods (CPG)",
    "Education",
    "Entertainment",
    "Environment and Energy",
    "Financial Services",
    "Government & Public Services",
    "Health & Wellness",
    "Manufacturing & Utilities",
    "Media & Telecommunications",
    "Non-profit",
    "Quick Service Restaurants (QSR)",
    "Retail & ecommerce",
    "General business",
    "Software, IT & Technology",
    "Transportation & Logistics",
    "Travel & Hospitality",
  ],
  companySize: [
    "Small business (<$10M revenue)",
    "Commercial ($10M - $500M revenue)",
    "Enterprise (>$500M revenue)",
  ],
  region: ["APAC", "EMEA", "LATAM", "NA", "UKI", "Global"],
  language: ["EN", "FR", "DE"],
};

// ---------------------------------------------------------------------------
// Simple concurrency limiter — prevents overwhelming Gemini rate limits
// ---------------------------------------------------------------------------
async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, tasks.length) }, worker),
  );
  return results;
}

type ParsedCsvRecord = Record<string, string>;

function parseCsv(content: string): ParsedCsvRecord[] {
  const rows: string[][] = [];
  let current: string[] = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    const next = content[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        value += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        value += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      current.push(value);
      value = "";
      continue;
    }
    if (ch === "\n") {
      current.push(value);
      rows.push(current);
      current = [];
      value = "";
      continue;
    }
    if (ch !== "\r") value += ch;
  }
  if (value.length > 0 || current.length > 0) {
    current.push(value);
    rows.push(current);
  }

  const [header = [], ...dataRows] = rows;
  return dataRows.map((row) =>
    Object.fromEntries(header.map((key, idx) => [key, row[idx] ?? ""])),
  );
}

function loadLatestExportRows(
  safeContentType: string,
): Map<string, ParsedCsvRecord> {
  const exportsDir = path.resolve("exports");
  if (!fs.existsSync(exportsDir)) return new Map();
  const candidates = fs
    .readdirSync(exportsDir)
    .filter(
      (name) =>
        name.startsWith(`${safeContentType}-taxonomy-`) &&
        name.endsWith(".csv"),
    )
    .sort();
  const latest = candidates.at(-1);
  if (!latest) return new Map();
  const content = fs.readFileSync(path.join(exportsDir, latest), "utf8");
  const parsed = parseCsv(content);
  return new Map(parsed.map((row) => [row["Entry ID"], row] as const));
}

// Retry wrapper with exponential backoff for transient AI/network errors
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  label = "",
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const errObj = err as { message?: string; name?: string; cause?: { code?: string } };
      const isTransient =
        errObj?.message?.includes("Timeout") ||
        errObj?.message?.includes("timeout") ||
        errObj?.message?.includes("ECONNRESET") ||
        errObj?.name === "AI_APICallError" ||
        errObj?.cause?.code === "UND_ERR_HEADERS_TIMEOUT";

      if (attempt === maxAttempts || !isTransient) throw err;
      const delay = 1000 * 2 ** (attempt - 1); // 1s, 2s, 4s
      console.log(
        `  ⚠️  ${label} — attempt ${attempt} failed (${errObj.message ?? err}), retrying in ${delay / 1000}s...`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("unreachable");
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------
// Deduplicate repetitive text before sending to AI.
// Ninetailed personalization entries can produce thousands of repeated tokens
// (e.g. "Fall launch, Fall launch, ...") that cause Gemini to loop until
// MAX_TOKENS. This collapses consecutive duplicate sentences/phrases.
// ---------------------------------------------------------------------------
function deduplicateText(text: string, maxLen = 20000): string {
  // Split on sentence/clause boundaries
  const parts = text.split(/(?<=[.!?\n,])\s+/);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const norm = part.trim().toLowerCase();
    if (norm.length < 3) {
      out.push(part);
      continue;
    }
    if (!seen.has(norm)) {
      seen.add(norm);
      out.push(part);
    }
  }
  return out.join(" ").slice(0, maxLen);
}

// ---------------------------------------------------------------------------
function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = Array.isArray(val) ? val.join(" | ") : String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(fields: unknown[]): string {
  return fields.map(csvEscape).join(",");
}

function sanitizeEntryTitle(input: string): string {
  return input
    .replace(/\s*[[(](?:churned|deprecated|sunset|archived)[\])]\s*/gi, " ")
    .replace(
      /\s*[[(](?:replaced with translated version|translated version|internal only)[\])]\s*/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
}

const CSV_HEADER = [
  // Identity
  "Entry ID",
  "Title",
  "Content Type",
  "URL / Slug",
  // Classification fields + per-field confidence
  "Asset Type",
  "Asset Type Confidence",
  "Asset Sub-Type",
  "Asset Sub-Type Confidence",
  "Schema Type (SEO)",
  "Schema Type Confidence",
  "Product",
  "Product Confidence",
  "Job Level",
  "Job Level Confidence",
  "Job Function",
  "Job Function Confidence",
  "Audience",
  "Audience Confidence",
  "Topic",
  "Topic Confidence",
  "Use Cases",
  "Use Cases Confidence",
  "Funnel Stage",
  "Funnel Stage Confidence",
  "Industry",
  "Industry Confidence",
  "Company Size",
  "Company Size Confidence",
  "Region",
  "Region Confidence",
  "Language",
  "Language Confidence",
  "Usage Rights",
  "Usage Rights Confidence",
  // Optional event fields
  "Event",
  "Season",
  "Year Published",
  // Quality
  "Overall Confidence",
  "Confidence Data-Backed",
  "Review Tier",
  "Review Reasons",
  "AI Reasoning",
  // Extras
  "Competitive Mentions",
  "Recommended Actions",
  "Classified At",
  "Model",
  "Low Content Warning",
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("🚀 Content Taxonomy Classification\n");
  console.log(`Space:        ${SPACE_ID}`);
  console.log(`Environment:  ${ENV_ID}`);
  console.log(`Content Type: ${CONTENT_TYPE}`);
  if (IS_CASE_STUDY_BATCH) {
    console.log(
      "Batch policy: case studies always run fresh; cached reasoning suppressed while fresh reasoning is preserved",
    );
  }
  console.log(`Crawl conc.:  ${CRAWL_CONCURRENCY}`);
  console.log(`Classify con.: ${CLASSIFY_CONCURRENCY}`);
  console.log(
    `Few-shot:     ${SKIP_FEW_SHOT ? "disabled for this batch" : "enabled"}`,
  );
  console.log(`Fact body:    ${FACT_CONTENT_LIMIT} chars`);
  if (TAG_FILTER) console.log(`Tag Filter:   ${TAG_FILTER}`);
  else if (getArg("--ids"))
    console.log(`Entry IDs:    ${ENTRY_IDS.join(", ")} (custom)`);
  else if (ENTRY_IDS.length > 0)
    console.log(`Entry IDs:    ${ENTRY_IDS.length} default pillar pages`);
  else console.log(`Entry IDs:    query by content type`);
  if (DRY_RUN) console.log("⚠️  DRY RUN — no Contentful writes\n");

  const client = createCfClient({ accessToken: MGMT_TOKEN } as Parameters<typeof createCfClient>[0]);
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  // Use persistent CDA token from env (CONTENTFUL_CDA_TOKEN) to avoid rate limits.
  // If not set, create an ephemeral one via CMA as fallback.
  let cdaToken: string | null = process.env.CONTENTFUL_CDA_TOKEN ?? null;
  let createdKeyId: string | null = null;

  if (cdaToken) {
    console.log("🔑 Using persistent Delivery API token");
  } else {
    try {
      const envLink = {
        sys: { type: "Link", linkType: "Environment", id: ENV_ID },
      };
      const created = await space.createApiKey({
        name: `taxonomy-classifier-${Date.now()}`,
        environments: [envLink],
      } as Parameters<typeof space.createApiKey>[0]);
      const createdKey = created as unknown as { accessToken?: string; sys?: { id?: string } };
      cdaToken = createdKey.accessToken ?? null;
      createdKeyId = createdKey.sys?.id ?? null;
      if (cdaToken)
        console.log(
          "🔑 Created ephemeral Delivery API token for fast crawling",
        );
    } catch {
      console.log(
        "⚠️  Could not create Delivery API token — falling back to Management API crawler",
      );
    }
  }

  // Build a CDA client if we got a token
  const cdaClient = cdaToken
    ? createCdaClient({
        space: SPACE_ID,
        accessToken: cdaToken,
        environment: ENV_ID,
      })
    : null;

  // -------------------------------------------------------------------------
  // 1. Fetch pillar pages
  // -------------------------------------------------------------------------
  console.log("\n🔍 Fetching pillar pages from Contentful...");

  type CmaEntry = { sys: { id: string; contentType: { sys: { id: string } }; updatedAt?: string }; fields: Record<string, Record<string, unknown>> };
  let entries: CmaEntry[];

  if (ENTRY_IDS && ENTRY_IDS.length > 0) {
    // Fetch specific entries by ID
    const fetched = await Promise.all(
      ENTRY_IDS.map((id) =>
        environment.getEntry(id).catch((e: unknown) => {
          logger.warn(`Could not fetch entry ${id}: ${e instanceof Error ? e.message : String(e)}`);
          return null;
        }),
      ),
    );
    entries = (fetched.filter((x) => x != null) as unknown[]) as CmaEntry[];
  } else {
    // Query by content type, optionally filtered by tag
    const query: Record<string, string | number> = {
      content_type: CONTENT_TYPE,
      limit: LIMIT,
    };

    if (TAG_FILTER) {
      query["metadata.tags.sys.id[in]"] = TAG_FILTER;
    }

    const result = await environment.getEntries(query);
    entries = result.items as CmaEntry[];
    console.log(
      `Found ${result.total} total entries, fetched ${entries.length}`,
    );

    // If no tag filter and we got more than expected, let the user know
    if (!TAG_FILTER && result.total > LIMIT) {
      console.log(
        `\n💡 Tip: Use --tag <tagId> to filter for pillar pages specifically,`,
      );
      console.log(`   or --ids id1,id2,... to target specific entries.`);
      console.log(`   Processing first ${entries.length} entries.\n`);
    }
  }

  if (entries.length === 0) {
    console.log("⚠️  No entries found. Check your filters and content type.");
    process.exit(0);
  }

  console.log(`\nProcessing ${entries.length} page(s):\n`);

  const getTitle = (e: CmaEntry) =>
    sanitizeEntryTitle(
      String(e.fields.title?.["en-US"] ?? "") ||
        String(e.fields.name?.["en-US"] ?? "") ||
        String(e.fields.nameInternal?.["en-US"] ?? "") ||
        String(e.fields.internalName?.["en-US"] ?? "") ||
        String(e.fields.pageName?.["en-US"] ?? "") ||
        "(Untitled)",
    );

  const safeContentType = CONTENT_TYPE.replace(/[^a-zA-Z0-9_-]/g, "-");
  const historyByEntryId = REUSE_UNCHANGED_ROWS
    ? getClassificationHistory()
    : {};
  const latestExportRows = REUSE_UNCHANGED_ROWS
    ? loadLatestExportRows(safeContentType)
    : new Map<string, ParsedCsvRecord>();
  const reusedRows = new Map<string, unknown[]>();
  const entriesToProcess = entries.filter((entry) => {
    if (!REUSE_UNCHANGED_ROWS) return true;
    const title = getTitle(entry);
    const slug =
      entry.fields.slug?.["en-US"] || entry.fields.url?.["en-US"] || "";
    const previous = historyByEntryId[entry.sys.id] || null;
    const previousCsvRow = latestExportRows.get(entry.sys.id);
    if (!previous || !previousCsvRow) return true;
    const unchangedSinceLastRun =
      new Date(entry.sys.updatedAt ?? 0).getTime() <=
        new Date(previous.classifiedAt).getTime() &&
      previous.title === title &&
      previous.url === slug;
    if (!unchangedSinceLastRun) return true;
    reusedRows.set(
      entry.sys.id,
      CSV_HEADER.map((header) => previousCsvRow[header] ?? ""),
    );
    console.log(
      `  ⚡ [REUSE] ${title} — entry unchanged since ${previous.classifiedAt}, reusing prior CSV row`,
    );
    return false;
  });

  if (reusedRows.size > 0) {
    console.log(
      `\n⚡ Reusing ${reusedRows.size} unchanged row(s) from the latest native export before crawl.\n`,
    );
  }

  // -------------------------------------------------------------------------
  // 2. Crawl + classify all pages IN PARALLEL
  // -------------------------------------------------------------------------
  const crawler = new RecursiveContentCrawler(environment);
  const classifiedAt = new Date().toISOString();
  // Normalize confidence to 0-1 before converting to % string.
  // Model sometimes returns 0-100 scale (e.g. 85) and sometimes 0-1 (e.g. 0.85).
  const normConf = (c: number) => (c > 1 ? c / 100 : c);
  const pct = (c?: number) =>
    c !== undefined ? `${Math.round(normConf(c) * 100)}%` : "";
  const usedModel = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";

  // ── Phase 1: crawl all pages ──
  // If CDA token available: fetch all pages IN PARALLEL using getEntry with include:10
  //   → one API call per entry, returns full linked-entry tree, no rate limits
  // Fallback: crawl sequentially via CMA batch fetcher
  type CrawledPage = {
    entry: CmaEntry;
    title: string;
    slug: string;
    contentTypeId: string;
    textContent: string;
    contentfulTags: string[]; // metadata.tags sys IDs
  };

  type CdaEntryLike = { sys?: { id?: string; type?: string; contentType?: { sys?: { id?: string } } }; fields?: Record<string, unknown>; nodeType?: string; value?: string; content?: CdaEntryLike[]; data?: { target?: CdaEntryLike } };

  function extractTextFromCdaEntry(
    entry: CdaEntryLike,
    visited = new Set<string>(),
    depth = 0,
  ): string {
    if (!entry || depth > 10) return "";
    const id = entry.sys?.id;
    if (id) {
      if (visited.has(id)) return "";
      visited.add(id);
    }

    const contentTypeId = entry.sys?.contentType?.sys?.id;
    if (depth > 0 && contentTypeId && NOISE_CONTENT_TYPES.has(contentTypeId))
      return "";

    // High-signal field name patterns (extract first, with labels)
    const SEO_FIELD_PATTERNS =
      /^(seo|meta|og|searchDescription|metaDescription|seoTitle|metaTitle|pageDescription|description|excerpt|summary)$/i;
    const TITLE_FIELD_PATTERNS =
      /^(title|name|nameInternal|headline|heading|h1|pageTitle|heroTitle)$/i;
    // Fields to skip entirely
    const SKIP_FIELD_PATTERNS =
      /^(ai|internal|_|sys|id|slug|url|canonical|noIndex|noFollow|robots|sitemap|structuredData|jsonLd)$/i;

    const highSignalParts: string[] = [];
    const bodyParts: string[] = [];

    const fields = entry.fields || {};
    for (const [key, value] of Object.entries(fields)) {
      if (!value) continue;
      if (SKIP_FIELD_PATTERNS.test(key)) continue;

      const isHighSignal =
        SEO_FIELD_PATTERNS.test(key) || TITLE_FIELD_PATTERNS.test(key);
      const targetArray = isHighSignal ? highSignalParts : bodyParts;

      if (typeof value === "string") {
        if (isHighSignal) targetArray.push(`[${key}]: ${value}`);
        else targetArray.push(value);
      } else if (Array.isArray(value) && typeof value[0] === "string") {
        targetArray.push((value as string[]).join(", "));
      } else if (
        typeof value === "object" &&
        (value as CdaEntryLike).sys?.type === "Entry"
      ) {
        bodyParts.push(extractTextFromCdaEntry(value as CdaEntryLike, visited, depth + 1));
      } else if (Array.isArray(value)) {
        for (const item of value as CdaEntryLike[]) {
          if (item?.sys?.type === "Entry")
            bodyParts.push(extractTextFromCdaEntry(item, visited, depth + 1));
          else if (typeof item === "string") bodyParts.push(item);
        }
      } else if (
        typeof value === "object" &&
        (value as CdaEntryLike).nodeType === "document"
      ) {
        const extractRt = (node: CdaEntryLike): string => {
          if (node.nodeType === "text") return node.value || "";
          if (node.data?.target?.sys?.type === "Entry")
            return extractTextFromCdaEntry(node.data.target, visited, depth + 1);
          return (node.content || []).map(extractRt).join(" ");
        };
        bodyParts.push(extractRt(value));
      }
    }

    // High-signal fields first, then body content
    return [...highSignalParts, ...bodyParts].filter(Boolean).join("\n");
  }

  // ── Phase 1: crawl all pages IN PARALLEL ──
  // Strategy: try CDA first per-entry (fastest, resolves full tree in one request).
  // Any entry that fails CDA falls back to CMA on its own — one bad entry never
  // blocks the rest. Both paths run concurrently via Promise.allSettled.
  const crawlConcurrency = Math.max(
    1,
    Math.min(CRAWL_CONCURRENCY, entriesToProcess.length),
  );
  console.log(
    crawlConcurrency === 1
      ? `\n⚡ Crawling ${entriesToProcess.length} page(s) sequentially...\n`
      : `\n⚡ Crawling ${entriesToProcess.length} pages (concurrency: ${crawlConcurrency})...\n`,
  );

  // Content types where the only unique content is the title:
  // - sections field = generic "Related Resources" (not entry-specific content)
  // - legacyReference = cross-space ResourceLink (unresolvable without legacy space CDA token)
  // Crawling these with full recursion produces 18k chars of WRONG content that misleads the classifier.
  // Treat as title-only so the content quality rubric correctly flags them as REVIEW tier.
  const LEGACY_REF_CONTENT_TYPES = new Set(["pageResourceDetails"]);

  const crawlTasks = entriesToProcess.map(
    (entry) => async (): Promise<CrawledPage> => {
      const title = getTitle(entry);
      const slug = String(
        entry.fields.slug?.["en-US"] ?? entry.fields.url?.["en-US"] ?? "",
      );
      const contentTypeId = entry.sys.contentType.sys.id;
      type TagRef = { sys?: { id?: string; tagId?: string } };
      const entryWithMeta = entry as CmaEntry & { metadata?: { tags?: TagRef[] } };
      const contentfulTags = (entryWithMeta.metadata?.tags || [])
        .map((t: TagRef) => t.sys?.id || t.sys?.tagId)
        .filter((x): x is string => Boolean(x));
      console.log(`  ▸ [CRAWL] ${title}`);

      // Legacy-reference content types: skip deep crawl — sections are generic noise,
      // actual content lives in a cross-space legacy entry we can't resolve.
      if (LEGACY_REF_CONTENT_TYPES.has(contentTypeId)) {
        logger.warn(
          `  ▸ [LEGACY-REF] ${title} — skipping sections crawl (cross-space legacyReference, title-only)`,
        );
        return {
          entry,
          title,
          slug,
          contentTypeId,
          contentfulTags,
          textContent: title,
        };
      }

      // Try CDA first — one request, resolves full linked-entry tree up to 10 levels
      if (cdaClient) {
        try {
          const cdaClientTyped = cdaClient as unknown as { getEntry(id: string, opts: Record<string, number>): Promise<CdaEntryLike> };
          const cdaEntry = await cdaClientTyped.getEntry(entry.sys.id, { include: 10 });
          return {
            entry,
            title,
            slug,
            contentTypeId,
            contentfulTags,
            textContent: deduplicateText(extractTextFromCdaEntry(cdaEntry)),
          };
        } catch {
          // CDA failed for this entry — fall through to CMA below
        }
      }

      // CMA fallback (per-entry) — batch-fetches linked entries using RecursiveContentCrawler
      const rawText = await crawler.extractTextRecursive(entry, 0, 4);
      return {
        entry,
        title,
        slug,
        contentTypeId,
        contentfulTags,
        textContent: deduplicateText(rawText),
      };
    },
  );

  const crawled: CrawledPage[] = await withConcurrency(
    crawlTasks,
    crawlConcurrency,
  );

  // ── Phase 2: classify all pages with concurrency limit + retry ──
  console.log(
    `\n⚡ Classifying ${crawled.length} page(s) and reusing ${reusedRows.size} page(s) (classify concurrency: ${CLASSIFY_CONCURRENCY})...\n`,
  );

  const rowResults = await withConcurrency(
    crawled.map(
      ({ entry, title, slug, contentTypeId, textContent, contentfulTags }) =>
        async () => {
          if (!textContent || textContent.length < 30) {
            logger.warn(
              `  Skipping ${entry.sys.id} — insufficient text content`,
            );
            return [
              entry.sys.id,
              title,
              contentTypeId,
              slug,
              ...Array(34).fill(""),
              "Skipped: insufficient content",
              "",
              "",
              classifiedAt,
              usedModel,
            ];
          }

          console.log(`  ▸ [START] ${title} (${entry.sys.id})`);

          // Prepend Contentful tags as a structured signal block to improve AI classification accuracy
          const tagsBlock =
            contentfulTags.length > 0
              ? `CONTENTFUL TAGS: ${contentfulTags.join(", ")}\n\n`
              : "";
          const enrichedText = tagsBlock + textContent;

          // Content hash — used for cache skip detection and stored in history
          const contentHash = createHash("sha256")
            .update(slug + "|" + title + "|" + enrichedText.slice(0, 4000))
            .digest("hex");

          // Classify — signals + company enrichment auto-run inside classifyContent
          const result = await withRetry(
            () =>
              classifyContent({
                asset: {
                  id: entry.sys.id,
                  title,
                  contentType: contentTypeId,
                  textContent: enrichedText,
                  slug,
                },
                allowedLabels: BYNDER_TAXONOMY,
                logger,
                skipCache: FORCE_RECLASSIFY || IS_CASE_STUDY_BATCH,
                disableDynamicFewShot: SKIP_FEW_SHOT,
                factContentLimit: FACT_CONTENT_LIMIT,
              }),
            3,
            title,
          );

          const resultExtra = result as typeof result & { cached?: boolean; confidenceCalibration?: Record<string, number>; reviewReasons?: string[]; lowContentWarning?: string };
          if (resultExtra.cached && !IS_CASE_STUDY_BATCH) {
            console.log(
              `  ⚡ [CACHE] ${title} — skipped Gemini (content unchanged)`,
            );
          }

          const confidencePct = Math.round(
            (result.overallConfidence ?? 0) * 100,
          );
          const confidenceCalibration = resultExtra.confidenceCalibration || {};
          const reviewReasons = Array.isArray(resultExtra.reviewReasons)
            ? (resultExtra.reviewReasons as string[])
            : [];
          // REVIEW always wins if the classifier itself requires review.
          // Otherwise, use confidence buckets for READY vs SPOT-CHECK.
          const reviewTier = result.needsReview
            ? "REVIEW"
            : confidencePct >= 90
              ? "READY"
              : confidencePct >= 75
                ? "SPOT-CHECK"
                : "REVIEW";
          const competitorMentions = [
            ...(result.competitivePositioning?.competitorNames || []),
            ...(result.competitivePositioning?.competitorCategories || []),
          ];
          const competitorLine = result.competitivePositioning
            ?.mentionsCompetitors
            ? `YES — ${competitorMentions.join(", ")}`
            : "no";
          const actions = ((result as Record<string, unknown>).recommendedActions as { priority: string; action: string; reason: string }[] | undefined || [])
            .map(
              (a: { priority: string; action: string; reason: string }) =>
                `[${a.priority.toUpperCase()}] ${a.action}: ${a.reason}`,
            )
            .join(" | ");
          // Strip FINAL OUTPUT SNAPSHOT blocks regardless of cache/live path.
          const stripSnapshot = (s: string) =>
            s.replace(/\bFINAL\s+OUTPUT\s+SNAPSHOT\b[\s\S]*/i, "")
             .replace(/\bFIELD\s+SUMMARY\b[\s\S]*/i, "")
             .trim();
          const exportedReasoning = stripSnapshot(result.reasoning || "");

          const lowContentWarning: string = resultExtra.lowContentWarning || "";
          const reviewFlag =
            reviewTier === "REVIEW"
              ? " ⚠️  REVIEW"
              : reviewTier === "SPOT-CHECK"
                ? " 👀 SPOT-CHECK"
                : " ✓";
          const sparseFlag = lowContentWarning ? " [SPARSE CONTENT]" : "";
          console.log(
            `  ▸ [DONE]  ${title} — ${confidencePct}% [${reviewTier}] | ${result.funnelStage.value} | ${(result.topic.value as string[]).join(", ")}${reviewFlag}${sparseFlag}`,
          );

          // Record to history for drift detection on future runs
          const rawFieldSnapshot: Record<string, { value: string | string[]; confidence: number }> = {};
          for (const [k, v] of Object.entries(result)) {
            if (
              v &&
              typeof v === "object" &&
              "value" in v &&
              "confidence" in v
            ) {
              const vTyped = v as { value: string | string[]; confidence: number };
              rawFieldSnapshot[k] = {
                value: vTyped.value,
                confidence: vTyped.confidence,
              };
            }
          }

          // Filter fieldSnapshot to only include values present in the current taxonomy.
          // This ensures the history baseline reflects valid labels only, preventing
          // stale taxonomy values from being recorded as ground truth.
          const taxonomyLabels = getStaticAllowedTaxonomyLabels();
          const fieldSnapshot: Record<string, { value: string | string[]; confidence: number }> = {};
          for (const [field, entry] of Object.entries(rawFieldSnapshot)) {
            const allowed = (taxonomyLabels as Record<string, string[] | undefined>)[field];
            if (!allowed) {
              fieldSnapshot[field] = entry;
              continue;
            }
            const filteredValue = Array.isArray(entry.value)
              ? entry.value.filter((v) => allowed.includes(v))
              : allowed.includes(entry.value as string)
                ? entry.value
                : null;
            if (filteredValue !== null && (!Array.isArray(filteredValue) || filteredValue.length > 0)) {
              fieldSnapshot[field] = { ...entry, value: filteredValue as string | string[] };
            }
          }

          const drift = recordClassification({
            entryId: entry.sys.id,
            title,
            url: slug,
            classifiedAt: classifiedAt,
            overallConfidence: result.overallConfidence ?? 0,
            needsReview: result.needsReview ?? false,
            fields: fieldSnapshot,
            contentHash,
            promptVersion: CLASSIFIER_PROMPT_VERSION,
            reasoning: result.reasoning,
            competitivePositioning: result.competitivePositioning,
          });
          if (drift && drift.hasRegressions) {
            const changed = drift.changedFields
              .map(
                (f) =>
                  `${f.field}: "${Array.isArray(f.before) ? f.before.join(",") : f.before}" → "${Array.isArray(f.after) ? f.after.join(",") : f.after}"`,
              )
              .join("; ");
            console.log(
              `  ⚠️  [DRIFT]  ${title} — regression detected (${changed})`,
            );
          } else if (drift && drift.changedFields.length > 0) {
            console.log(
              `  ℹ️  [DRIFT]  ${title} — ${drift.changedFields.length} field(s) updated (Δ confidence ${drift.confidenceDelta >= 0 ? "+" : ""}${Math.round(drift.confidenceDelta * 100)}%)`,
            );
          }

          return [
            entry.sys.id,
            title,
            contentTypeId,
            slug,
            result.assetType.value,
            pct(result.assetType.confidence),
            result.assetSubType.value,
            pct(result.assetSubType.confidence),
            result.schemaType?.value || "",
            pct(result.schemaType?.confidence),
            result.product.value,
            pct(result.product.confidence),
            result.jobLevel.value,
            pct(result.jobLevel.confidence),
            result.jobFunction.value,
            pct(result.jobFunction.confidence),
            result.audience.value,
            pct(result.audience.confidence),
            result.topic.value,
            pct(result.topic.confidence),
            result.useCases.value,
            pct(result.useCases.confidence),
            result.funnelStage.value,
            pct(result.funnelStage.confidence),
            result.industry.value,
            pct(result.industry.confidence),
            result.companySize.value,
            pct(result.companySize.confidence),
            result.region.value,
            pct(result.region.confidence),
            result.language.value,
            pct(result.language.confidence),
            result.usageRights.value,
            pct(result.usageRights.confidence),
            result.event?.value || "N/A",
            result.season?.value || "N/A",
            result.yearPublished?.value || "N/A",
            `${confidencePct}%`,
            confidenceCalibration.dataBacked ? "Yes" : "No",
            reviewTier,
            reviewReasons.join(" | "),
            exportedReasoning,
            competitorLine,
            actions,
            classifiedAt,
            usedModel,
            lowContentWarning,
          ];
        },
    ),
    CLASSIFY_CONCURRENCY,
  );

  const rowResultsByEntryId = new Map(
    rowResults.map((row) => [String(row[0] ?? ""), row]),
  );
  const rows = entries
    .map(
      (entry) =>
        reusedRows.get(entry.sys.id) || rowResultsByEntryId.get(entry.sys.id),
    )
    .filter(Boolean) as unknown[][];

  // -------------------------------------------------------------------------
  // 3. Write CSV
  // -------------------------------------------------------------------------
  const exportsDir = path.resolve("exports");
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outFile = path.join(
    exportsDir,
    `${safeContentType}-taxonomy-${timestamp}.csv`,
  );

  const csvLines = [buildCsvRow(CSV_HEADER), ...rows.map(buildCsvRow)];
  fs.writeFileSync(outFile, csvLines.join("\n"), "utf8");

  console.log(`\n✅ Done! ${rows.length} page(s) classified.`);
  console.log(`📄 Output saved to: ${outFile}`);
  console.log("\nOpen in Excel/Sheets for content team review.");
  console.log(
    'Use the "Review Tier" column to decide publish vs spot-check vs manual review.',
  );

  // Summary
  const tierCol = CSV_HEADER.indexOf("Review Tier");
  const readyCount = rows.filter((r) => r[tierCol] === "READY").length;
  const spotCheckCount = rows.filter((r) => r[tierCol] === "SPOT-CHECK").length;
  const reviewCount = rows.filter((r) => r[tierCol] === "REVIEW").length;
  const humanCorrections = correctionCount();
  const embeddedCount = embeddedCorrectionCount();
  console.log(`\nSummary:`);
  console.log(`  Total classified:  ${rows.length}`);
  console.log(`  ✓  READY:          ${readyCount}  (≥90% — publish directly)`);
  console.log(
    `  👀 SPOT-CHECK:     ${spotCheckCount}  (75-89% — review before tagging)`,
  );
  console.log(
    `  ⚠️  REVIEW:         ${reviewCount}  (<75% — human must verify)`,
  );
  console.log(
    `  Human corrections: ${humanCorrections} (${embeddedCount} with embeddings — semantic few-shot ${embeddedCount >= 3 ? "ACTIVE" : "pending (need >= 3 embedded)"})`,
  );
  if (humanCorrections === 0) {
    console.log(
      `\n💡 Tip: Add corrections to .cache/feedback-corrections.json to improve future runs.`,
    );
    console.log(`   See api/_shared/utils/feedbackStore.ts for the schema.`);
  }

  // -------------------------------------------------------------------------
  // Build content-to-content graph edges from classification results
  // -------------------------------------------------------------------------
  if (process.env.DATABASE_URL && !DRY_RUN) {
    console.log("\n🕸️  Building content graph edges...");
    try {
      // Collect classified asset metadata for edge building
      const graphAssets = crawled.map(
        ({ entry, title, slug, contentTypeId }, idx) => {
          const row = rowResults[idx];
          // Extract topic and funnelStage from the row (positions 15 and 19)
          // Row layout: id, title, contentType, slug, assetType, conf, assetSubType, conf,
          //   schemaType, conf, product, conf, jobLevel, conf, jobFunction, conf,
          //   audience, conf, topic, conf (idx 18,19), useCases, conf, funnelStage (22), conf,
          //   industry (24), conf, ...
          // Note: crawled[idx] has result, but it's faster to re-use the row values.
          // We have classifyContent results stored in a closure — use the resultMap instead.
          return {
            entryId: entry.sys.id,
            title,
            url: slug,
            contentType: contentTypeId,
            topics: (Array.isArray(row[18])
              ? row[18]
              : String(row[18] || "").split(" | ")
            ).filter(Boolean),
            funnelStage: String(row[22] || ""),
            industry: (Array.isArray(row[24])
              ? row[24]
              : String(row[24] || "").split(" | ")
            ).filter(Boolean),
            audience: (Array.isArray(row[16])
              ? row[16]
              : String(row[16] || "").split(" | ")
            ).filter(Boolean),
            isPillar: ENTRY_IDS.includes(entry.sys.id),
          };
        },
      );

      // Upsert asset nodes in the graph
      await Promise.all(
        graphAssets.map((a) =>
          upsertAssetNode(a.entryId, { title: a.title, url: a.url }),
        ),
      );

      // Build content-to-content edges
      const { edgesAdded } = await buildContentEdges(graphAssets);
      console.log(`   ✓ ${edgesAdded} content edges added to graph`);
    } catch (err: unknown) {
      console.log(`   ⚠️  Graph update skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Cleanup: delete the ephemeral CDA API key to avoid accumulating stale keys
  if (createdKeyId) {
    try {
      const spaceTyped = space as unknown as { deleteApiKey(id: string): Promise<void> };
      await spaceTyped.deleteApiKey(createdKeyId);
      console.log("🧹 Cleaned up temporary Delivery API key");
    } catch {
      // Non-fatal — stale keys can be cleaned up manually
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
