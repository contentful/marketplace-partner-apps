/**
 * companyCache.ts
 *
 * Layer 2: Company enrichment via Gemini Search + persistent cache.
 *
 * For fields like Industry and Company Size, the content alone is often
 * insufficient — we need to know WHO is mentioned on the page (customer
 * logos, case study proof points) and what industry/size they are.
 *
 * Architecture:
 *   1. Check in-memory Map (fast, per-process lifetime)
 *   2. Check .cache/company-taxonomy.json (persistent, 30-day TTL)
 *   3. Query Gemini with search grounding (real-time, slow)
 *   4. Graceful fallback if search fails
 *
 * Cache file: .cache/company-taxonomy.json (gitignored)
 * Configure path: TAXONOMY_CACHE_PATH env var
 */

import * as fs from "fs";
import * as path from "path";
import { generateText } from "ai";
import { getGoogleProviderLabel, languageModel } from "./googleProvider.js";
import type { VendorTraceCollector } from "./vendorTrace.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const CONCURRENCY = 3;
const CACHE_FILE =
  process.env.TAXONOMY_CACHE_PATH ||
  path.resolve(".cache/company-taxonomy.json");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface CompanyData {
  industry: string | null;
  companySize: string | null;
  confidence: number;
  source: "search" | "seed" | "fallback";
  cachedAt: string;
}

type CacheStore = Record<string, CompanyData>;

// ---------------------------------------------------------------------------
// Seed data — known enterprise companies frequently referenced in Contentful
// content. Avoids unnecessary API calls for well-known brands.
// ---------------------------------------------------------------------------
const SEED_DATA: Record<
  string,
  Pick<CompanyData, "industry" | "companySize">
> = {
  "kraft heinz": {
    industry: "Consumer Packaged Goods (CPG)",
    companySize: "Enterprise (>$500M revenue)",
  },
  mailchimp: {
    industry: "Software, IT & Technology",
    companySize: "Commercial ($10M - $500M revenue)",
  },
  docusign: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  shopify: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  nike: {
    industry: "Retail & ecommerce",
    companySize: "Enterprise (>$500M revenue)",
  },
  spotify: {
    industry: "Media & Telecommunications",
    companySize: "Enterprise (>$500M revenue)",
  },
  atlassian: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  hubspot: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  salesforce: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  slack: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  airbnb: {
    industry: "Travel & Hospitality",
    companySize: "Enterprise (>$500M revenue)",
  },
  netflix: {
    industry: "Media & Telecommunications",
    companySize: "Enterprise (>$500M revenue)",
  },
  adobe: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  figma: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  vercel: {
    industry: "Software, IT & Technology",
    companySize: "Commercial ($10M - $500M revenue)",
  },
  netlify: {
    industry: "Software, IT & Technology",
    companySize: "Commercial ($10M - $500M revenue)",
  },
  bmw: { industry: "Automotive", companySize: "Enterprise (>$500M revenue)" },
  mercedes: {
    industry: "Automotive",
    companySize: "Enterprise (>$500M revenue)",
  },
  toyota: {
    industry: "Automotive",
    companySize: "Enterprise (>$500M revenue)",
  },
  volkswagen: {
    industry: "Automotive",
    companySize: "Enterprise (>$500M revenue)",
  },
  hsbc: {
    industry: "Financial Services",
    companySize: "Enterprise (>$500M revenue)",
  },
  jpmorgan: {
    industry: "Financial Services",
    companySize: "Enterprise (>$500M revenue)",
  },
  "goldman sachs": {
    industry: "Financial Services",
    companySize: "Enterprise (>$500M revenue)",
  },
  unilever: {
    industry: "Consumer Packaged Goods (CPG)",
    companySize: "Enterprise (>$500M revenue)",
  },
  walmart: {
    industry: "Retail & ecommerce",
    companySize: "Enterprise (>$500M revenue)",
  },
  target: {
    industry: "Retail & ecommerce",
    companySize: "Enterprise (>$500M revenue)",
  },
  ikea: {
    industry: "Retail & ecommerce",
    companySize: "Enterprise (>$500M revenue)",
  },
  stripe: {
    industry: "Financial Services",
    companySize: "Enterprise (>$500M revenue)",
  },
  twilio: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
  zendesk: {
    industry: "Software, IT & Technology",
    companySize: "Enterprise (>$500M revenue)",
  },
};

// Taxonomy options passed to AI to constrain output
const INDUSTRY_OPTIONS = [
  "Automotive",
  "Business services",
  "Consumer Packaged Goods (CPG)",
  "Education",
  "Entertainment",
  "Financial Services",
  "Government & Public Services",
  "Health & Wellness",
  "Manufacturing & Utilities",
  "Media & Telecommunications",
  "Non-profit",
  "Quick Service Restaurants (QSR)",
  "Retail & ecommerce",
  "Software, IT & Technology",
  "Transportation & Logistics",
  "Travel & Hospitality",
];

const SIZE_OPTIONS = [
  "Small business (<$10M revenue)",
  "Commercial ($10M - $500M revenue)",
  "Enterprise (>$500M revenue)",
];

// ---------------------------------------------------------------------------
// In-memory cache (lives for the lifetime of the process)
// ---------------------------------------------------------------------------
const memoryCache = new Map<string, CompanyData>();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(
      /\b(inc|corp|ltd|llc|plc|gmbh|sa|nv|ag|co\.?|company|group|holdings?)\b\.?/gi,
      "",
    )
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isExpired(cachedAt: string): boolean {
  return Date.now() - new Date(cachedAt).getTime() > CACHE_TTL_MS;
}

function loadFileCache(): CacheStore {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, "utf-8");
      return JSON.parse(raw) as CacheStore;
    }
  } catch {
    /* corrupt or missing — start fresh */
  }
  return {};
}

function saveFileCache(store: CacheStore): void {
  try {
    const dir = path.dirname(CACHE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch {
    /* non-fatal — cache write failure degrades gracefully */
  }
}

// ---------------------------------------------------------------------------
// Gemini search lookup
// ---------------------------------------------------------------------------
async function searchCompanyData(
  companyName: string,
  vendorTrace?: VendorTraceCollector,
): Promise<CompanyData> {
  const model = process.env.GEMINI_SEARCH_MODEL || "gemini-3.0-flash";
  const startedAt = Date.now();
  try {
    const { text } = await generateText({
      model: languageModel(model),
      temperature: 0,
      prompt: `What is the primary industry and approximate revenue size of the company "${companyName}"?

Reply ONLY with valid JSON, no markdown, no explanation:
{"industry":"<pick exactly one: ${INDUSTRY_OPTIONS.join(" | ")}>","size":"<pick exactly one: ${SIZE_OPTIONS.join(" | ")}>","confidence":<0.0-1.0>}

Rules:
- industry: pick the single BEST fit from the list above. Use "Software, IT & Technology" for tech/SaaS companies.
- size: base on annual revenue. Fortune 500 = Enterprise. Well-known startups with funding = Commercial. Local/small = Small business.
- confidence: 0.9 for well-known companies, 0.7 for less-known, 0.3 if uncertain or unknown.
- If you genuinely do not know the company's industry or size, return null for that field. Do not guess.`,
    });

    const clean = text
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const json = JSON.parse(clean);

    const result: CompanyData = {
      industry: INDUSTRY_OPTIONS.includes(json.industry) ? json.industry : null,
      companySize: SIZE_OPTIONS.includes(json.size) ? json.size : null,
      confidence:
        typeof json.confidence === "number"
          ? Math.min(1, Math.max(0, json.confidence))
          : 0.3,
      source: "search",
      cachedAt: new Date().toISOString(),
    };
    vendorTrace?.recordCall({
      vendor: getGoogleProviderLabel(),
      service: model,
      category: "company-enrichment",
      operation: "lookup-company-taxonomy",
      purpose: `resolve industry and company size for ${companyName}`,
      status: "ok",
      durationMs: Date.now() - startedAt,
      input: { companyName },
      output: {
        industry: result.industry,
        companySize: result.companySize,
        confidence: result.confidence,
        source: result.source,
      },
    });
    return result;
  } catch {
    vendorTrace?.recordCall({
      vendor: getGoogleProviderLabel(),
      service: model,
      category: "company-enrichment",
      operation: "lookup-company-taxonomy",
      purpose: `resolve industry and company size for ${companyName}`,
      status: "error",
      durationMs: Date.now() - startedAt,
      input: { companyName },
      error: "company search failed",
    });
    return {
      industry: null,
      companySize: null,
      confidence: 0,
      source: "fallback",
      cachedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export async function lookupCompanies(
  companyNames: string[],
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
  },
  options?: { allowSearch?: boolean; vendorTrace?: VendorTraceCollector },
): Promise<Map<string, CompanyData>> {
  if (companyNames.length === 0) return new Map();
  const allowSearch = options?.allowSearch ?? true;

  const results = new Map<string, CompanyData>();
  const toFetch: string[] = [];

  for (const name of companyNames) {
    const key = normalizeCompanyName(name);

    // 1. Seed data (instant, no expiry)
    if (SEED_DATA[key]) {
      const seedEntry: CompanyData = {
        ...SEED_DATA[key],
        confidence: 0.95,
        source: "seed",
        cachedAt: new Date().toISOString(),
      };
      results.set(name, seedEntry);
      continue;
    }

    // 2. Memory cache (this process)
    if (memoryCache.has(key)) {
      results.set(name, memoryCache.get(key)!);
      continue;
    }

    toFetch.push(name);
  }

  // 3. File cache — only loaded if seed/memory didn't resolve everything
  const fileCache: CacheStore = toFetch.length > 0 ? loadFileCache() : {};
  const stillToFetch: string[] = [];
  for (const name of toFetch) {
    const key = normalizeCompanyName(name);
    if (fileCache[key] && !isExpired(fileCache[key].cachedAt)) {
      memoryCache.set(key, fileCache[key]);
      results.set(name, fileCache[key]);
    } else {
      stillToFetch.push(name);
    }
  }

  if (!allowSearch) {
    return results;
  }

  // 4. Gemini search for unknowns (batched by CONCURRENCY)
  const cacheUpdated = stillToFetch.length > 0;
  for (let i = 0; i < stillToFetch.length; i += CONCURRENCY) {
    const batch = stillToFetch.slice(i, i + CONCURRENCY);

    const fetched = await Promise.all(
      batch.map(async (name) => {
        logger?.info(`🔍 [CompanyCache] Searching: "${name}"`);
        const data = await searchCompanyData(name, options?.vendorTrace);
        const key = normalizeCompanyName(name);
        memoryCache.set(key, data);
        fileCache[key] = data;
        if (data.source === "fallback") {
          logger?.warn(
            `[CompanyCache] Search fallback for "${name}" — no data found`,
          );
        }
        return { name, data };
      }),
    );

    fetched.forEach(({ name, data }) => results.set(name, data));
  }

  if (cacheUpdated) saveFileCache(fileCache);

  return results;
}

/**
 * Derive the best Industry and Company Size from a company data map.
 * Returns the highest-confidence picks across all looked-up companies.
 */
export function deriveIndustryAndSize(companyData: Map<string, CompanyData>): {
  industry: string | null;
  companySize: string | null;
  confidence: number;
} {
  if (companyData.size === 0)
    return { industry: null, companySize: null, confidence: 0 };

  const entries = Array.from(companyData.values()).filter(
    (d) => d.confidence > 0.5,
  );
  if (entries.length === 0)
    return { industry: null, companySize: null, confidence: 0 };

  // Industry: most frequently occurring industry among high-confidence lookups
  const industryCounts = new Map<string, number>();
  for (const e of entries) {
    if (e.industry)
      industryCounts.set(e.industry, (industryCounts.get(e.industry) || 0) + 1);
  }
  const topIndustry =
    [...industryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Company size: prefer Enterprise if any enterprise company is mentioned
  const hasEnterprise = entries.some(
    (d) => d.companySize === "Enterprise (>$500M revenue)",
  );
  const topSize = hasEnterprise
    ? "Enterprise (>$500M revenue)"
    : (entries.sort((a, b) => b.confidence - a.confidence)[0]?.companySize ??
      null);

  const avgConfidence =
    entries.reduce((s, e) => s + e.confidence, 0) / entries.length;

  return {
    industry: topIndustry,
    companySize: topSize,
    confidence: Math.round(avgConfidence * 100) / 100,
  };
}
