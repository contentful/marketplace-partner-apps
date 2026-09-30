import {
  CLASSIFIER_NLP_ENDPOINT,
  CLASSIFIER_NLP_PROVIDER,
  CLASSIFIER_REQUIRE_NLP,
} from "../config/classifierPipeline.js";
import type { Logger } from "../types.js";
import { VendorDependencyError } from "./classifierErrors.js";
import {
  canonicalizeCompanyMentions,
  type ContentSignals,
} from "./contentSignals.js";
import type { VendorTraceCollector } from "./vendorTrace.js";
import { truncateTraceText } from "./vendorTrace.js";

export interface NlpEntity {
  type: string;
  value: string;
  confidence?: number;
}

export interface NlpIntent {
  label: string;
  confidence?: number;
}

export interface NlpTrace {
  provider: string;
  source: "external" | "heuristic";
  entities: NlpEntity[];
  intents: NlpIntent[];
  raw?: unknown;
}

type NlpSidecarResponse = {
  provider?: string;
  entities?: NlpEntity[];
  intents?: NlpIntent[];
  raw?: unknown;
};

function toBooleanIntent(
  intents: NlpIntent[],
  labels: string[],
  threshold = 0.7,
): boolean {
  return intents.some(
    (intent) =>
      labels.includes(intent.label) &&
      Number(intent.confidence || 0) >= threshold,
  );
}

function mergeUnique(values: string[], next: string[]): string[] {
  return Array.from(new Set([...values, ...next].filter(Boolean)));
}

async function callNlpSidecar(params: {
  slug?: string;
  title?: string;
  textContent: string;
  vendorTrace?: VendorTraceCollector;
}): Promise<NlpSidecarResponse | null> {
  const { vendorTrace, ...payloadInput } = params;
  if (!CLASSIFIER_NLP_ENDPOINT) {
    if (CLASSIFIER_REQUIRE_NLP) {
      throw new VendorDependencyError(
        "nlp-sidecar",
        "CLASSIFIER_NLP_ENDPOINT is required but not configured",
      );
    }
    return null;
  }

  const startedAt = Date.now();
  try {
    const response = await fetch(CLASSIFIER_NLP_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payloadInput),
    });

    if (!response.ok) {
      throw new VendorDependencyError(
        "nlp-sidecar",
        `sidecar request failed with status ${response.status}`,
      );
    }
    const payload = (await response.json()) as NlpSidecarResponse;
    vendorTrace?.recordCall({
      vendor: "nlp-sidecar",
      service: payload.provider || CLASSIFIER_NLP_PROVIDER,
      category: "nlp",
      operation: "enrich-content-signals",
      purpose: "enrich heuristic content signals with external NLP",
      status: "ok",
      durationMs: Date.now() - startedAt,
      input: {
        endpoint: CLASSIFIER_NLP_ENDPOINT,
        slug: params.slug,
        title: params.title,
        textLength: params.textContent.length,
        textPreview: truncateTraceText(params.textContent, 180),
      },
      output: {
        entityCount: payload.entities?.length || 0,
        intentCount: payload.intents?.length || 0,
        entities: (payload.entities || []).slice(0, 8),
        intents: (payload.intents || []).slice(0, 8),
      },
    });
    return payload;
  } catch (error) {
    vendorTrace?.recordCall({
      vendor: "nlp-sidecar",
      service: CLASSIFIER_NLP_PROVIDER,
      category: "nlp",
      operation: "enrich-content-signals",
      purpose: "enrich heuristic content signals with external NLP",
      status: "error",
      durationMs: Date.now() - startedAt,
      input: {
        endpoint: CLASSIFIER_NLP_ENDPOINT,
        slug: params.slug,
        title: params.title,
        textLength: params.textContent.length,
      },
      error: error instanceof Error ? error.message : String(error),
    });
    if (CLASSIFIER_REQUIRE_NLP) {
      if (error instanceof VendorDependencyError) throw error;
      throw new VendorDependencyError(
        "nlp-sidecar",
        error instanceof Error ? error.message : String(error),
      );
    }
    return null;
  }
}

export async function enrichSignalsWithNlp(params: {
  slug?: string;
  title?: string;
  textContent: string;
  signals: ContentSignals;
  logger?: Logger;
  vendorTrace?: VendorTraceCollector;
}): Promise<ContentSignals> {
  const { slug, title, textContent, logger, vendorTrace } = params;
  const nextSignals: ContentSignals = {
    ...params.signals,
    mentionedCompanies: [...params.signals.mentionedCompanies],
    mentionedProducts: [...params.signals.mentionedProducts],
    structuredContent: {
      ...params.signals.structuredContent,
      primaryCTAs: [...params.signals.structuredContent.primaryCTAs],
      mentionedBrands: [...params.signals.structuredContent.mentionedBrands],
      featureHeadings: [...params.signals.structuredContent.featureHeadings],
    },
    nlp: {
      provider: CLASSIFIER_NLP_PROVIDER,
      source: "heuristic",
      entities: [],
      intents: [],
    },
  };

  const sidecar = await callNlpSidecar({
    slug,
    title,
    textContent,
    vendorTrace,
  });
  if (!sidecar) return nextSignals;

  const entities = sidecar.entities || [];
  const intents = sidecar.intents || [];
  nextSignals.nlp = {
    provider: sidecar.provider || CLASSIFIER_NLP_PROVIDER,
    source: "external",
    entities,
    intents,
    raw: sidecar.raw,
  };

  const productEntities = entities
    .filter((entity) => entity.type === "product")
    .map((entity) => entity.value);
  const companyEntities = entities
    .filter((entity) => entity.type === "company")
    .map((entity) => entity.value);
  const canonicalCompanies = canonicalizeCompanyMentions([
    ...nextSignals.mentionedCompanies,
    ...companyEntities,
  ]);

  nextSignals.mentionedProducts = mergeUnique(
    nextSignals.mentionedProducts,
    productEntities,
  );
  nextSignals.mentionedCompanies = canonicalCompanies;
  nextSignals.structuredContent.mentionedBrands = canonicalCompanies;

  if (toBooleanIntent(intents, ["Request Demo", "Talk to Sales"])) {
    nextSignals.hasDemo = true;
  }
  if (toBooleanIntent(intents, ["View Pricing", "Start Trial"])) {
    nextSignals.hasPricing = true;
  }
  if (toBooleanIntent(intents, ["Read FAQ"])) {
    nextSignals.hasFAQ = true;
  }

  logger?.info("[NLP] Enriched content signals from sidecar", {
    provider: nextSignals.nlp.provider,
    entities: entities.length,
    intents: intents.length,
  });

  return nextSignals;
}
