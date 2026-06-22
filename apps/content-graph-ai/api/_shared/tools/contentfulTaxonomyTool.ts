import type { AllowedTaxonomyLabels } from "./classificationTool.js";
import type { Logger } from "../types.js";
import { sanitizeToken } from "../utils/sanitizeToken.js";
import { getStaticAllowedTaxonomyLabels } from "../config/taxonomyDefinition.js";

type LocalizedString = Record<string, string | undefined>;

type TaxonomyLink = {
  sys: {
    type: "Link";
    linkType: "TaxonomyConcept" | "TaxonomyConceptScheme";
    id: string;
  };
};

type ConceptScheme = {
  sys: { id: string; type: "TaxonomyConceptScheme" };
  prefLabel?: LocalizedString;
};

type Concept = {
  sys: { id: string; type: "TaxonomyConcept" };
  prefLabel?: LocalizedString;
  conceptSchemes?: Array<{
    sys: { id: string; type: "Link"; linkType: "TaxonomyConceptScheme" };
  }>;
};

type TaxonomyIndex = {
  orgId: string;
  schemesById: Map<string, ConceptScheme>;
  conceptsById: Map<string, Concept>;
  conceptsBySchemeId: Map<string, Concept[]>;
};

const TAXONOMY_CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CONTENTFUL_RETRIES = 5;

let cache:
  | {
      key: string;
      expiresAt: number;
      value: Promise<TaxonomyIndex>;
      lastSuccessful?: TaxonomyIndex;
    }
  | undefined;

function pickLabel(prefLabel: LocalizedString | undefined): string {
  if (!prefLabel) return "";
  return (
    prefLabel["en-US"] ||
    prefLabel["en"] ||
    Object.values(prefLabel).find(Boolean) ||
    ""
  );
}

function normalizeForMatch(input: string): string {
  return input
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/&/g, " and ")
    .replace(/\//g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(
  params: { url: string; token: string },
  attempt = 0,
): Promise<Record<string, unknown>> {
  const token = sanitizeToken(params.token);
  if (!token)
    throw new Error(
      "Contentful taxonomy request failed: missing auth token after trimming",
    );

  const res = await fetch(params.url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    },
  });
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    if (res.status === 429 && attempt < MAX_CONTENTFUL_RETRIES) {
      const resetHeader = Number(
        res.headers.get("x-contentful-ratelimit-reset") || "1",
      );
      const waitMs = Math.max(resetHeader, 1) * 1000 + attempt * 750;
      await sleep(waitMs);
      return fetchJson(params, attempt + 1);
    }
    const msg =
      typeof json["message"] === "string"
        ? json["message"]
        : `HTTP ${res.status}`;
    throw new Error(`Contentful taxonomy request failed: ${msg}`);
  }
  return json;
}

async function fetchAllPages(params: {
  url: string;
  token: string;
  limit?: number;
}): Promise<Record<string, unknown>[]> {
  const limit = params.limit ?? 200;
  let skip = 0;
  const items: Record<string, unknown>[] = [];
  while (true) {
    const pageUrl = new URL(params.url);
    pageUrl.searchParams.set("limit", String(limit));
    pageUrl.searchParams.set("skip", String(skip));
    const page = await fetchJson({
      url: pageUrl.toString(),
      token: params.token,
    });
    const batch: Record<string, unknown>[] = Array.isArray(page["items"])
      ? (page["items"] as Record<string, unknown>[])
      : [];
    items.push(...batch);
    if (batch.length < limit) break;
    skip += batch.length;
  }
  return items;
}

export async function loadOrganizationTaxonomy(params: {
  orgId: string;
  token: string;
}): Promise<TaxonomyIndex> {
  const key = `${params.orgId}:${params.token.slice(0, 8)}`;
  if (cache?.key === key && Date.now() < cache.expiresAt) return cache.value;

  const previous = cache?.key === key ? cache.lastSuccessful : undefined;
  cache = {
    key,
    expiresAt: Date.now() + TAXONOMY_CACHE_TTL_MS,
    value: (async () => {
      try {
        const base = `https://api.contentful.com/organizations/${params.orgId}/taxonomy`;
        const schemes = (await fetchAllPages({
          url: `${base}/concept-schemes`,
          token: params.token,
        })) as ConceptScheme[];
        const concepts = (await fetchAllPages({
          url: `${base}/concepts`,
          token: params.token,
        })) as Concept[];

        const schemesById = new Map<string, ConceptScheme>();
        for (const s of schemes) schemesById.set(s.sys.id, s);

        const conceptsById = new Map<string, Concept>();
        const conceptsBySchemeId = new Map<string, Concept[]>();

        for (const c of concepts) {
          conceptsById.set(c.sys.id, c);
          for (const schemeLink of c.conceptSchemes ?? []) {
            const schemeId = schemeLink?.sys?.id;
            if (!schemeId) continue;
            const arr = conceptsBySchemeId.get(schemeId) ?? [];
            arr.push(c);
            conceptsBySchemeId.set(schemeId, arr);
          }
        }

        const taxonomy = {
          orgId: params.orgId,
          schemesById,
          conceptsById,
          conceptsBySchemeId,
        };
        if (cache?.key === key) cache.lastSuccessful = taxonomy;
        return taxonomy;
      } catch (error) {
        if (previous) return previous;
        throw error;
      }
    })(),
  };
  return cache.value;
}

function labelsFromTaxonomy(taxonomy: TaxonomyIndex): AllowedTaxonomyLabels {
  const labelFor = (concept: Concept) =>
    concept?.prefLabel?.["en-US"] || concept?.prefLabel?.["en"] || "";
  const labelsByScheme = (schemeId: string) =>
    (taxonomy.conceptsBySchemeId.get(schemeId) || [])
      .map((concept) => labelFor(concept))
      .filter(Boolean)
      .sort();

  return {
    assetSubType: labelsByScheme("6iTmYSodF3GoSjR8RsizS0"),
    topic: labelsByScheme("topic"),
    product: labelsByScheme("productName"),
    jobLevel: labelsByScheme("jobLevel"),
    jobFunction: labelsByScheme("jobFunction"),
    useCases: labelsByScheme("useCase"),
    funnelStage: labelsByScheme("funnelStage"),
    industry: labelsByScheme("industry"),
    companySize: labelsByScheme("companySize"),
    region: labelsByScheme("region"),
    language: labelsByScheme("language"),
    audience: labelsByScheme("persona"),
  };
}

export async function getAllowedTaxonomyLabels(params: {
  orgId?: string;
  token?: string;
  logger?: Logger;
}): Promise<AllowedTaxonomyLabels> {
  if (!params.orgId || !params.token) {
    return getStaticAllowedTaxonomyLabels();
  }

  try {
    const taxonomy = await loadOrganizationTaxonomy({
      orgId: params.orgId,
      token: params.token,
    });
    return labelsFromTaxonomy(taxonomy);
  } catch (error) {
    params.logger?.warn("Falling back to static taxonomy labels", {
      error: error instanceof Error ? error.message : String(error),
    });
    return getStaticAllowedTaxonomyLabels();
  }
}

export function resolveConceptIds(params: {
  taxonomy: TaxonomyIndex;
  schemeId: string;
  labels: string[];
  minScore?: number;
}): string[] {
  const concepts =
    params.taxonomy.conceptsBySchemeId.get(params.schemeId) ?? [];
  const minScore = params.minScore ?? 0.6;

  const normalizedToId = new Map<string, string>();
  const tokensById = new Map<string, Set<string>>();
  for (const c of concepts) {
    const label = pickLabel(c.prefLabel);
    const norm = normalizeForMatch(label);
    if (norm) normalizedToId.set(norm, c.sys.id);
    tokensById.set(c.sys.id, new Set(norm.split(" ").filter(Boolean)));
  }

  const out: string[] = [];
  for (const raw of params.labels) {
    const norm = normalizeForMatch(String(raw || ""));
    if (!norm) continue;

    const exact = normalizedToId.get(norm);
    if (exact) {
      out.push(exact);
      continue;
    }

    const want = new Set(norm.split(" ").filter(Boolean));
    let best: { id: string; score: number } | undefined;
    for (const [id, tokens] of tokensById.entries()) {
      const score = jaccard(want, tokens);
      if (!best || score > best.score) best = { id, score };
    }
    if (best && best.score >= minScore) out.push(best.id);
  }

  return Array.from(new Set(out));
}

export function resolveBestConceptId(params: {
  taxonomy: TaxonomyIndex;
  schemeId: string;
  labels: string[];
  minScore?: number;
}): string | undefined {
  const concepts =
    params.taxonomy.conceptsBySchemeId.get(params.schemeId) ?? [];
  const minScore = params.minScore ?? 0.6;

  const normalizedToId = new Map<string, string>();
  const tokensById = new Map<string, Set<string>>();
  for (const c of concepts) {
    const label = pickLabel(c.prefLabel);
    const norm = normalizeForMatch(label);
    if (norm) normalizedToId.set(norm, c.sys.id);
    tokensById.set(c.sys.id, new Set(norm.split(" ").filter(Boolean)));
  }

  let best: { id: string; score: number } | undefined;
  for (const raw of params.labels) {
    const norm = normalizeForMatch(String(raw || ""));
    if (!norm) continue;

    const exact = normalizedToId.get(norm);
    if (exact) return exact;

    const want = new Set(norm.split(" ").filter(Boolean));
    for (const [id, tokens] of tokensById.entries()) {
      const score = jaccard(want, tokens);
      if (!best || score > best.score) best = { id, score };
    }
  }

  if (!best || best.score < minScore) return undefined;
  return best.id;
}

export function toConceptLinks(conceptIds: string[]): TaxonomyLink[] {
  return conceptIds.map((id) => ({
    sys: { type: "Link", linkType: "TaxonomyConcept", id },
  }));
}

export function keepNonTargetSchemeConcepts(params: {
  existingConceptIds: string[];
  taxonomy: TaxonomyIndex;
  targetSchemeIds: string[];
}): string[] {
  const targets = new Set(params.targetSchemeIds);
  return params.existingConceptIds.filter((id) => {
    const c = params.taxonomy.conceptsById.get(id);
    if (!c) return false;
    const schemeIds = (c.conceptSchemes ?? [])
      .map((s) => s?.sys?.id)
      .filter(Boolean) as string[];
    return !schemeIds.some((sid) => targets.has(sid));
  });
}
