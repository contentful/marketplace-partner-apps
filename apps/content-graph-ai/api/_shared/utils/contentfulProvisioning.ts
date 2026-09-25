type ContentfulFieldDefinition = {
  id: string;
  name: string;
  type: string;
  localized?: boolean;
  required?: boolean;
  validations?: Record<string, unknown>[];
  items?: { type: string; validations?: Record<string, unknown>[] };
};

type TaxonomySchemeDefinition = {
  schemeId: string;
  schemeLabel: string;
  concepts: Array<{ id: string; label: string }>;
};
import {
  FULL_TAXONOMY_DEFINITION,
  normalizeTaxonomyLabel,
} from "../config/taxonomyDefinition.js";

const TAXONOMY_ENSURE_TTL_MS = 10 * 60 * 1000;
const MAX_CONTENTFUL_RETRIES = 5;
let taxonomyEnsureCache:
  | {
      key: string;
      expiresAt: number;
      result: {
        schemesCreated: number;
        conceptsCreated: number;
        ensured: boolean;
      };
    }
  | undefined;

export const CLASSIFICATION_WRITEBACK_FIELDS: ContentfulFieldDefinition[] = [
  { id: "aiAssetType", name: "AI Asset Type", type: "Symbol", localized: true },
  {
    id: "aiAssetSubType",
    name: "AI Asset Sub-Type",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiSchemaType",
    name: "AI Schema Type",
    type: "Symbol",
    localized: true,
  },
  {
    id: "aiProduct",
    name: "AI Product",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiJobLevel",
    name: "AI Job Level",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiJobFunction",
    name: "AI Job Function",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiAudience",
    name: "AI Audience",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiTopic",
    name: "AI Topic",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiUseCases",
    name: "AI Use Cases",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiFunnelStage",
    name: "AI Funnel Stage",
    type: "Symbol",
    localized: true,
  },
  {
    id: "aiIndustry",
    name: "AI Industry",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiCompanySize",
    name: "AI Company Size",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  {
    id: "aiRegion",
    name: "AI Region",
    type: "Array",
    localized: true,
    items: { type: "Symbol", validations: [] },
  },
  { id: "aiLanguage", name: "AI Language", type: "Symbol", localized: true },
  {
    id: "aiUsageRights",
    name: "AI Usage Rights",
    type: "Symbol",
    localized: true,
  },
  { id: "aiEvent", name: "AI Event", type: "Symbol", localized: true },
  { id: "aiEventType", name: "AI Event Type", type: "Symbol", localized: true },
  { id: "aiSeason", name: "AI Season", type: "Symbol", localized: true },
  {
    id: "aiYearPublished",
    name: "AI Year Published",
    type: "Symbol",
    localized: true,
  },
  {
    id: "aiOverallConfidence",
    name: "AI Overall Confidence",
    type: "Number",
    localized: true,
    validations: [{ range: { min: 0, max: 1 } }],
  },
  {
    id: "aiConfidenceDataBacked",
    name: "AI Confidence Data Backed",
    type: "Boolean",
    localized: true,
  },
  {
    id: "aiReviewReasons",
    name: "AI Review Reasons",
    type: "Text",
    localized: true,
  },
  {
    id: "aiNeedsReview",
    name: "AI Needs Review",
    type: "Boolean",
    localized: true,
  },
  {
    id: "aiLastClassified",
    name: "AI Last Classified",
    type: "Date",
    localized: true,
  },
  { id: "aiReasoning", name: "AI Reasoning", type: "Text", localized: true },
  {
    id: "aiRecommendedActions",
    name: "AI Recommended Actions",
    type: "Object",
    localized: true,
  },
  {
    id: "aiCompetitivePositioning",
    name: "AI Competitive Positioning",
    type: "Object",
    localized: true,
  },
];

async function fetchJson(
  params: {
    url: string;
    token: string;
    method?: string;
    body?: Record<string, unknown>;
  },
  attempt = 0,
) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.token}`,
    "Content-Type": "application/vnd.contentful.management.v1+json",
  };

  const res = await fetch(params.url, {
    method: params.method || "GET",
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const text = await res.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 429 && attempt < MAX_CONTENTFUL_RETRIES) {
      const resetHeader = Number(
        res.headers.get("x-contentful-ratelimit-reset") || "1",
      );
      const waitMs = Math.max(resetHeader, 1) * 1000 + attempt * 750;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return fetchJson(params, attempt + 1);
    }
    const j = json as Record<string, unknown> | null;
    const msg =
      typeof j?.["message"] === "string" ? j["message"] : `HTTP ${res.status}`;
    throw new Error(`Contentful API error: ${msg} (${res.status})`);
  }

  return json as Record<string, unknown>;
}

async function fetchAllPages(params: { url: string; token: string }) {
  const limit = 200;
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
    const batch = Array.isArray(page?.items) ? page.items : [];
    items.push(...batch);
    if (batch.length < limit) break;
    skip += batch.length;
  }

  return items;
}

async function createScheme(
  baseUrl: string,
  token: string,
  scheme: TaxonomySchemeDefinition,
) {
  try {
    await fetchJson({
      url: `${baseUrl}/concept-schemes`,
      token,
      method: "PUT",
      body: {
        sys: { id: scheme.schemeId },
        prefLabel: { "en-US": scheme.schemeLabel },
      },
    });
  } catch {
    await fetchJson({
      url: `${baseUrl}/concept-schemes`,
      token,
      method: "POST",
      body: {
        sys: { id: scheme.schemeId },
        prefLabel: { "en-US": scheme.schemeLabel },
      },
    });
  }
}

async function createConcept(
  baseUrl: string,
  token: string,
  schemeId: string,
  concept: { id: string; label: string },
) {
  const body = {
    sys: { id: concept.id },
    prefLabel: { "en-US": concept.label },
    conceptSchemes: [
      {
        sys: {
          type: "Link",
          linkType: "TaxonomyConceptScheme",
          id: schemeId,
        },
      },
    ],
  };

  try {
    await fetchJson({
      url: `${baseUrl}/concepts`,
      token,
      method: "PUT",
      body,
    });
  } catch {
    await fetchJson({
      url: `${baseUrl}/concepts`,
      token,
      method: "POST",
      body,
    });
  }
}

import type { Logger } from "../types.js";

export async function ensureOrganizationTaxonomy(params: {
  orgId: string;
  token: string;
  logger?: Logger;
}) {
  const cacheKey = `${params.orgId}:${params.token.slice(0, 8)}`;
  if (
    taxonomyEnsureCache?.key === cacheKey &&
    Date.now() < taxonomyEnsureCache.expiresAt
  ) {
    params.logger?.info(
      "🧭 [ContentfulProvisioning] Reusing cached taxonomy ensure",
      {
        orgId: params.orgId,
      },
    );
    return taxonomyEnsureCache.result;
  }

  const baseUrl = `https://api.contentful.com/organizations/${params.orgId}/taxonomy`;
  const existingSchemes = await fetchAllPages({
    url: `${baseUrl}/concept-schemes`,
    token: params.token,
  });
  const existingConcepts = await fetchAllPages({
    url: `${baseUrl}/concepts`,
    token: params.token,
  });

  type TaxonomyRecord = Record<string, unknown>;
  const schemeIds = new Set(
    existingSchemes.map(
      (scheme) => ((scheme as TaxonomyRecord)["sys"] as TaxonomyRecord)["id"],
    ),
  );
  const schemeLabels = new Map(
    existingSchemes.map((scheme) => {
      const s = scheme as TaxonomyRecord;
      const pref = s["prefLabel"] as Record<string, string> | undefined;
      return [
        normalizeTaxonomyLabel(pref?.["en-US"] || pref?.["en"] || ""),
        ((s["sys"] as TaxonomyRecord)["id"] as string) || "",
      ] as const;
    }),
  );
  const conceptIds = new Set(
    existingConcepts.map(
      (concept) =>
        ((concept as TaxonomyRecord)["sys"] as TaxonomyRecord)["id"],
    ),
  );
  const conceptsBySchemeAndLabel = new Set(
    existingConcepts.flatMap((concept) => {
      const c = concept as TaxonomyRecord;
      const pref = c["prefLabel"] as Record<string, string> | undefined;
      const label = normalizeTaxonomyLabel(
        pref?.["en-US"] || pref?.["en"] || "",
      );
      const schemes = Array.isArray(c["conceptSchemes"])
        ? (c["conceptSchemes"] as TaxonomyRecord[])
        : [];
      return schemes.map(
        (schemeLink) =>
          `${(schemeLink["sys"] as TaxonomyRecord | undefined)?.["id"] || ""}:${label}`,
      );
    }),
  );

  let schemesCreated = 0;
  let conceptsCreated = 0;

  for (const scheme of FULL_TAXONOMY_DEFINITION) {
    const existingSchemeId = schemeIds.has(scheme.schemeId)
      ? scheme.schemeId
      : schemeLabels.get(normalizeTaxonomyLabel(scheme.schemeLabel));
    const targetSchemeId = existingSchemeId || scheme.schemeId;

    if (!existingSchemeId) {
      await createScheme(baseUrl, params.token, scheme);
      schemeIds.add(targetSchemeId);
      schemeLabels.set(
        normalizeTaxonomyLabel(scheme.schemeLabel),
        targetSchemeId,
      );
      schemesCreated += 1;
    }

    for (const concept of scheme.concepts) {
      const conceptKey = `${targetSchemeId}:${normalizeTaxonomyLabel(concept.label)}`;
      if (
        conceptIds.has(concept.id) ||
        conceptsBySchemeAndLabel.has(conceptKey)
      )
        continue;
      await createConcept(baseUrl, params.token, targetSchemeId, concept);
      conceptIds.add(concept.id);
      conceptsBySchemeAndLabel.add(conceptKey);
      conceptsCreated += 1;
    }
  }

  params.logger?.info("🧭 [ContentfulProvisioning] Taxonomy ensured", {
    orgId: params.orgId,
    schemesCreated,
    conceptsCreated,
  });

  const result = {
    schemesCreated,
    conceptsCreated,
    ensured: schemesCreated > 0 || conceptsCreated > 0,
  };

  taxonomyEnsureCache = {
    key: cacheKey,
    expiresAt: Date.now() + TAXONOMY_ENSURE_TTL_MS,
    result,
  };

  return result;
}

type ContentTypeField = {
  id: string;
  name?: string;
  type?: string;
  localized?: boolean;
  required?: boolean;
  validations?: unknown[];
  disabled?: boolean;
  omitted?: boolean;
  items?: unknown;
};

type ContentTypeShape = {
  fields: ContentTypeField[];
  update(): Promise<ContentTypeShape>;
  publish(): Promise<ContentTypeShape>;
};

export async function ensureContentTypeWritebackFields(params: {
  environment: {
    getContentType(id: string): Promise<ContentTypeShape>;
  };
  contentTypeId: string;
  logger?: Logger;
}) {
  let contentType = await params.environment.getContentType(
    params.contentTypeId,
  );
  const existingFieldIds = new Set<string>(
    contentType.fields.map((field: { id: string }) => field.id),
  );
  const missingFields = CLASSIFICATION_WRITEBACK_FIELDS.filter(
    (field) => !existingFieldIds.has(field.id),
  );

  if (missingFields.length === 0) {
    return {
      ensured: false,
      createdFieldIds: [] as string[],
      fieldIds: new Set<string>(existingFieldIds),
    };
  }

  for (const field of missingFields) {
    contentType.fields.push({
      id: field.id,
      name: field.name,
      type: field.type,
      localized: field.localized ?? true,
      required: false,
      validations: field.validations || [],
      disabled: false,
      omitted: false,
      ...(field.items ? { items: field.items } : {}),
    });
  }

  contentType = await contentType.update();
  contentType = await contentType.publish();

  params.logger?.info("🧱 [ContentfulProvisioning] Writeback fields ensured", {
    contentTypeId: params.contentTypeId,
    createdFieldIds: missingFields.map((field) => field.id),
  });

  return {
    ensured: true,
    createdFieldIds: missingFields.map((field) => field.id),
    fieldIds: new Set<string>(contentType.fields.map((field) => field.id)),
  };
}
