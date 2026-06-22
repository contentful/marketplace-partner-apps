import { z } from "zod";
import { generateObject, type LanguageModel } from "ai";
import type { Logger } from "../types.js";
import { createHash } from "crypto";
import type { ContentSignals } from "../utils/contentSignals.js";
import type { ContentZone } from "../utils/recursiveCrawler.js";
import {
  buildEvidenceMap,
  buildFactEvidenceBlock,
  buildSubjectiveEvidenceBlock,
} from "../utils/evidenceMap.js";
import {
  deriveIndustryAndSize,
  type CompanyData,
} from "../utils/companyCache.js";
import {
  applyFeedbackOverrides,
  buildFewShotSelection,
  correctionCount,
  embeddedCorrectionCount,
} from "../utils/feedbackStore.js";
import { getCachedClassification } from "../utils/classificationHistory.js";
import {
  CLASSIFIER_FACT_MODEL,
  CLASSIFIER_PROMPT_VERSION,
  CLASSIFIER_REQUIRE_CHROMA,
  CLASSIFIER_REVIEW_OVERALL_THRESHOLD,
  CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD,
  CLASSIFIER_SUBJECTIVE_MODEL,
  EVIDENCE_MAP_MIN_NONEMPTY_FIELDS,
} from "../config/classifierPipeline.js";
import {
  buildFactPrompt,
  buildFactSummaryBlock,
  buildSubjectivePrompt,
  ClassificationFactsSchema,
  ClassificationSubjectiveSchema,
  type PromptSections,
} from "../prompts/classifierPrompts.js";
import { enrichSignalsWithNlp } from "../utils/nlpPipeline.js";
import {
  isVendorDependencyError,
  VendorDependencyError,
} from "../utils/classifierErrors.js";
import { languageModel } from "../utils/googleProvider.js";
import {
  createVendorTraceCollector,
  type VendorTraceCollector,
} from "../utils/vendorTrace.js";
import { makeLangSmithTraceable } from "../utils/langsmithClient.js";
import {
  CLASSIFIER_EXECUTION_PROFILES,
  type ClassifierExecutionMode,
} from "../config/classifierPolicy.js";
import { loadContentTypeProfile } from "../config/contentTypeProfiles.js";
import {
  COMPETITIVE_POSITIONING_TYPE_LABELS,
  getStaticAllowedTaxonomyLabels,
} from "../config/taxonomyDefinition.js";
import {
  coerceSingleAllowed,
  coerceToAllowed,
  jaccard,
  mergeUsage,
  normalizeLabel,
  normalizeUsage,
  sanitizeClassifierTitle,
  toLangSmithChatInput,
  toLangSmithChatOutput,
} from "../utils/classificationSupport.js";
import {
  applyDeterministicRuntimePolicies,
  finalizeClassificationReviewState,
  normalizeCompetitivePositioning,
  normalizeConfidenceValue,
} from "./classificationRuntimePolicy.js";
export {
  computeOpenQuestionFlags,
  isGenericPlatformProductPage,
  isHeadlessCmsPlatformContext,
  isWebinarLikeContent,
  normalizeAudienceSelection,
  normalizeCompetitivePositioning,
  normalizeIndustrySelection,
  normalizeJobFunctionSelection,
  normalizeJobLevelSelection,
  normalizeSeasonValue,
  shouldKeepSeasonTag,
  shouldPrioritizeHumanReview,
} from "./classificationRuntimePolicy.js";

// Classification result schema matching the new taxonomy
const ClassificationResultSchema = z.object({
  assetType: z.object({ value: z.string(), confidence: z.number() }),
  assetSubType: z.object({
    value: z.array(z.string()),
    confidence: z.number(),
  }), // Multi-select
  schemaType: z.object({ value: z.string(), confidence: z.number() }), // SEO Schema (Dual Mapping)
  product: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  jobLevel: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  jobFunction: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select (Persona)
  audience: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  topic: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  useCases: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  funnelStage: z.object({ value: z.string(), confidence: z.number() }), // Single-select
  industry: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  companySize: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select (Segment)
  region: z.object({ value: z.array(z.string()), confidence: z.number() }), // Multi-select
  event: z
    .object({
      value: z.string().nullable().optional(),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(), // Single-select
  eventType: z
    .object({
      value: z.string().nullable().optional(),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(), // Single-select
  season: z
    .object({
      value: z.string().nullable().optional(),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(), // Single-select
  language: z.object({ value: z.string(), confidence: z.number() }), // Single-select
  yearPublished: z
    .object({
      value: z
        .string()
        .nullable()
        .optional()
        .describe("4-digit year only, e.g. '2024'. Null if unknown. NEVER include timestamps, URLs, or body text."),
      confidence: z.number().optional(),
    })
    .nullable()
    .optional(), // Single-select
  usageRights: z.object({ value: z.string(), confidence: z.number() }), // Single-select

  competitivePositioning: z.object({
    mentionsCompetitors: z.boolean(),
    competitorNames: z.array(z.string()).optional(),
    competitorCategories: z.array(z.string()).optional(),
    positioningType: z.enum(COMPETITIVE_POSITIONING_TYPE_LABELS).optional(),
  }),
  // Computed fields — overallConfidence is calculated by our code, not the AI.
  // No max constraint so the model doesn't fail if it returns a 0-100 value (we normalize it).
  overallConfidence: z.number().optional(),
  needsReview: z.boolean().optional(),
  reasoning: z.string().optional(),
  // Structured provenance — parsed from reasoning string, one entry per field.
  // tag: LOCKED | AI | SIGNAL | METADATA | ENRICHMENT
  fieldProvenance: z
    .record(z.string(), z.object({ tag: z.string(), reason: z.string() }))
    .optional(),
});

export type ClassificationResult = z.infer<typeof ClassificationResultSchema>;

/**
 * Parses the LLM's per-field reasoning string into a structured provenance
 * record. Each line has the format:
 *   fieldName: [TAG] short reason text
 * Returns a record keyed by field name, so callers can query individual field
 * decisions without regex-scraping the full prose string.
 */
function parseReasoningToProvenance(
  reasoning: string | undefined,
): Record<string, { tag: string; reason: string }> | undefined {
  if (!reasoning) return undefined;
  // Strip trailing snapshot/dump blocks (e.g. "FINAL OUTPUT SNAPSHOT\n...") before parsing.
  // These are post-processing noise and should not pollute the per-field provenance record.
  const stripped = reasoning
    .replace(/\bFINAL\s+OUTPUT\s+SNAPSHOT\b[\s\S]*/i, "")
    .replace(/\bFIELD\s+SUMMARY\b[\s\S]*/i, "")
    .trim();
  const result: Record<string, { tag: string; reason: string }> = {};
  // Widen regex: allow optional leading list numbers (e.g. "1. fieldName: [TAG] reason"),
  // and accept mixed-case tags so minor model formatting variation doesn't drop entries.
  const lineRe = /^(?:\d+\.\s*)?(\w+):\s*\[([A-Za-z_]+)\]\s*(.*)$/;
  for (const line of stripped.split(/\n+/)) {
    const m = line.trim().match(lineRe);
    if (m) {
      result[m[1]] = { tag: m[2].toUpperCase(), reason: m[3].trim() };
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Reasoning–value consistency check.
 *
 * If the model's (or cached) reasoning says "left blank" or "no evidence" for
 * a field but the value is non-empty, trust the reasoning and clear the field.
 * This prevents hallucinated values from persisting on broad content — whether
 * the classification is fresh or served from cache.
 *
 * Array fields: value is cleared to [].
 * NullableSingleValueFields (event, eventType, season, yearPublished, funnelStage):
 *   value is cleared to null.
 */
function applyReasoningConsistency(classification: ClassificationResult): void {
  const reasoning = classification.reasoning ?? "";
  const cls = classification as unknown as Record<
    string,
    { value: string | string[] | null | undefined; confidence: number } | null | undefined
  >;

  // Multi-value array fields — clear to [] when reasoning says "left blank"
  const optionalArrayFields = [
    "companySize", "industry", "region", "topic", "useCases",
    "jobFunction", "audience",
  ] as const;
  for (const field of optionalArrayFields) {
    const prov = classification.fieldProvenance?.[field];
    const provBlank = prov && /left blank|no evidence/i.test(prov.reason);
    // Raw scan: match "companySize: left blank" or "companySize: [AI] left blank"
    const rawPattern = new RegExp(
      `${field}:\\s*(?:\\[[^\\]]+\\]\\s*)?(?:left blank|no evidence)`,
      "i",
    );
    const rawBlank = rawPattern.test(reasoning);
    if (provBlank || rawBlank) {
      const entry = cls[field];
      if (entry && Array.isArray(entry.value) && entry.value.length > 0) {
        (entry as { value: string[] }).value = [];
      }
    }
  }

  // NullableSingleValueFields — clear to null when reasoning says "left blank"
  const optionalSingleFields = [
    "funnelStage", "yearPublished", "event", "eventType", "season",
  ] as const;
  for (const field of optionalSingleFields) {
    const rawPattern = new RegExp(
      `${field}:\\s*(?:\\[[^\\]]+\\]\\s*)?(?:left blank|no evidence)`,
      "i",
    );
    if (rawPattern.test(reasoning)) {
      const entry = cls[field];
      if (entry?.value != null) {
        (entry as { value: null }).value = null;
      }
    }
  }
}

export type AllowedTaxonomyLabels = Partial<{
  assetType: string[];
  assetSubType: string[];
  schemaType: string[];
  product: string[];
  jobLevel: string[];
  jobFunction: string[];
  audience: string[];
  topic: string[];
  useCases: string[];
  funnelStage: string[];
  industry: string[];
  companySize: string[];
  region: string[];
  language: string[];
}>;

/**
 * Returns the full static taxonomy as a flat Record<fieldName, string[]>.
 * Used by the review endpoint to validate approve/correct payloads against
 * the canonical allowed values before writing to Contentful or feedbackStore.
 */
export function getStaticAllowedLabelsFlat(): Record<string, string[]> {
  const labels = getStaticAllowedTaxonomyLabels();
  return {
    assetType: labels.assetType ?? [],
    assetSubType: labels.assetSubType ?? [],
    schemaType: labels.schemaType ?? [],
    product: labels.product ?? [],
    jobLevel: labels.jobLevel ?? [],
    jobFunction: labels.jobFunction ?? [],
    audience: labels.audience ?? [],
    topic: labels.topic ?? [],
    useCases: labels.useCases ?? [],
    funnelStage: labels.funnelStage ?? [],
    industry: labels.industry ?? [],
    companySize: labels.companySize ?? [],
    region: labels.region ?? [],
    language: labels.language ?? [],
  };
}

/** Re-export coercion utilities so callers don't need to reach into classificationSupport. */
export { coerceSingleAllowed, coerceToAllowed };

type ClassifyContentParams = {
  asset: {
    id: string;
    title?: string;
    contentType: string;
    textContent: string;
    slug?: string;
  };
  signals?: ContentSignals;
  /** Structured content zones from zone-aware CDA crawl. Passed into auto-signal extraction. */
  contentZones?: ContentZone[];
  companyData?: Map<string, CompanyData>;
  taxonomyVersion?: string;
  allowedLabels?: AllowedTaxonomyLabels;
  logger?: Logger;
  skipCache?: boolean;
  disableDynamicFewShot?: boolean;
  factContentLimit?: number;
  executionMode?: ClassifierExecutionMode;
  collectTrace?: boolean;
  vendorTrace?: VendorTraceCollector;
};

async function classifyContentImpl(params: ClassifyContentParams) {
  const {
    asset,
    taxonomyVersion = "v2",
    allowedLabels,
    logger,
    skipCache = false,
    disableDynamicFewShot = false,
    factContentLimit = 2000,
    executionMode = "default",
    collectTrace = false,
    vendorTrace: providedVendorTrace,
  } = params;
  const _startMs = Date.now();
  const stageTimings: Record<string, number> = {};
  const executionProfile = CLASSIFIER_EXECUTION_PROFILES[executionMode];
  const useDynamicFewShot =
    executionProfile.useDynamicFewShot && !disableDynamicFewShot;
  const vendorTrace =
    providedVendorTrace ||
    (collectTrace ? createVendorTraceCollector() : undefined);
  const assetTitle = sanitizeClassifierTitle(asset.title) || asset.title || "";
  const truncateText = (input: string | undefined, limit = 1200) => {
    const value = String(input || "").trim();
    if (!value) return "";
    return value.length > limit ? `${value.slice(0, limit)}...` : value;
  };
  const trace: {
    metadata: Record<string, unknown>;
    steps: Array<Record<string, unknown>>;
    vendorCalls?: Array<Record<string, unknown>>;
    wiring?: Array<Record<string, unknown>>;
  } | null = collectTrace
    ? {
        metadata: {
          assetId: asset.id,
          title: assetTitle,
          contentType: asset.contentType,
          slug: asset.slug || "",
          taxonomyVersion,
          executionMode,
        },
        steps: [],
      }
    : null;
  const syncVendorTrace = () => {
    if (!trace || !vendorTrace) return;
    const snapshot = vendorTrace.snapshot();
    trace.metadata.vendors = snapshot.vendors;
    trace.vendorCalls = snapshot.calls as unknown as Array<
      Record<string, unknown>
    >;
    trace.wiring = snapshot.wiring as unknown as Array<Record<string, unknown>>;
  };
  const getLatestVendorCall = (
    predicate: (call: {
      vendor: string;
      service?: string;
      operation: string;
      status: string;
      category: string;
    }) => boolean,
  ) => {
    if (!vendorTrace) return null;
    const calls = vendorTrace.snapshot().calls;
    for (let index = calls.length - 1; index >= 0; index -= 1) {
      if (predicate(calls[index])) {
        return calls[index];
      }
    }
    return null;
  };
  const toVendorNode = (call: { vendor: string; service?: string } | null) => {
    if (!call) return null;
    if (call.vendor === "postgres" && call.service === "pgvector") {
      return "postgres/pgvector";
    }
    return call.vendor;
  };
  const traceStep = (step: string, output: Record<string, unknown>) => {
    if (!trace) return;
    const event = {
      step,
      at: new Date().toISOString(),
      output,
    };
    trace.steps.push(event);
    logger?.info("🧭 [ClassificationTool] Trace step", {
      assetId: asset.id,
      step,
      output,
    });
  };
  const withVendorTrace = async <T>(
    call: Parameters<VendorTraceCollector["trace"]>[0],
    task: () => Promise<T>,
  ): Promise<T> => {
    if (!vendorTrace) return await task();
    return await vendorTrace.trace(call, task);
  };
  const traceFactPrompt = makeLangSmithTraceable(
    (input: {
      assetId: string;
      contentType: string;
      executionMode: ClassifierExecutionMode;
      fewShotStrategy: string;
      promptSections: PromptSections;
    }) => buildFactPrompt(input.promptSections),
    {
      name: "format_fact_prompt",
      run_type: "prompt",
      processInputs: (input) => ({
        assetId: input.assetId,
        contentType: input.contentType,
        executionMode: input.executionMode,
        fewShotStrategy: input.fewShotStrategy,
      }),
      processOutputs: (output) => ({ prompt: output.outputs }),
    },
  );
  const traceSubjectivePrompt = makeLangSmithTraceable(
    (input: {
      assetId: string;
      contentType: string;
      executionMode: ClassifierExecutionMode;
      promptSections: PromptSections;
      factSummaryBlock: string;
    }) =>
      buildSubjectivePrompt({
        ...input.promptSections,
        factSummaryBlock: input.factSummaryBlock,
      }),
    {
      name: "format_subjective_prompt",
      run_type: "prompt",
      processInputs: (input) => ({
        assetId: input.assetId,
        contentType: input.contentType,
        executionMode: input.executionMode,
      }),
      processOutputs: (output) => ({ prompt: output.outputs }),
    },
  );
  const traceFactLlm = makeLangSmithTraceable(
    async (input: { prompt: string; model: string }) => {
      const result = await generateObject({
        model: languageModel(input.model) as LanguageModel,
        schema: ClassificationFactsSchema,
        prompt: input.prompt,
        temperature: 0,
      });
      return {
        object: result.object,
        usage: result.usage,
      };
    },
    {
      name: "invoke_fact_llm",
      run_type: "llm",
      getInvocationParams: (input) => ({
        ls_provider: "google",
        ls_model_name: input.model,
        ls_model_type: "chat",
        temperature: 0,
      }),
      processInputs: (input) => toLangSmithChatInput(input.prompt),
      processOutputs: (output: { object: unknown; usage?: unknown }) =>
        toLangSmithChatOutput(output),
    },
  );
  const traceSubjectiveLlm = makeLangSmithTraceable(
    async (input: { prompt: string; model: string }) => {
      const result = await generateObject({
        model: languageModel(input.model) as LanguageModel,
        schema: ClassificationSubjectiveSchema,
        prompt: input.prompt,
        temperature: 0,
      });
      return {
        object: result.object,
        usage: result.usage,
      };
    },
    {
      name: "invoke_subjective_llm",
      run_type: "llm",
      getInvocationParams: (input) => ({
        ls_provider: "google",
        ls_model_name: input.model,
        ls_model_type: "chat",
        temperature: 0,
      }),
      processInputs: (input) => toLangSmithChatInput(input.prompt),
      processOutputs: (output: { object: unknown; usage?: unknown }) =>
        toLangSmithChatOutput(output),
    },
  );

  // Content hash for cache lookup — computed from stable, content-identifying fields.
  // Hashing the first 4000 chars of body is sufficient to detect any meaningful content change.
  const _contentHash = createHash("sha256")
    .update(
      (asset.slug || "") +
        "|" +
        assetTitle +
        "|" +
        (asset.textContent || "").slice(0, 4000),
    )
    .digest("hex");

  // Auto-extract signals if not pre-computed — applies to ALL callers, not just the script.
  // Lazily imported to avoid circular dependencies.
  let signals = params.signals;
  let companyData = params.companyData;
  const profile = loadContentTypeProfile(asset.contentType);

  // -------------------------------------------------------------------------
  // Content quality assessment — how much evidence does the AI actually have?
  // Computed before signals so the rubric block can be injected into the prompt.
  // This is the answer to "how do we stop the model from guessing confidently":
  // we measure what it has, tell it in the prompt, and enforce a ceiling in post-processing.
  // -------------------------------------------------------------------------
  const _bodyText = (asset.textContent || "")
    .replace(assetTitle, "")
    .replace(/\s+/g, " ")
    .trim();
  const _bodyCharCount = _bodyText.length;
  const _headingCount = (asset.textContent.match(/\n[A-Z][^\n]{5,80}\n/g) || [])
    .length;

  type ContentQualityLevel =
    | "TITLE_ONLY"
    | "TITLE_HEADINGS"
    | "PARTIAL_BODY"
    | "FULL_BODY"
    | "SUSPICIOUS_BODY";
  const suspiciousEvidenceReasons: string[] = [];
  if (_bodyCharCount > 250_000) {
    suspiciousEvidenceReasons.push(
      `bodyCharCount ${_bodyCharCount} exceeds 250000`,
    );
  }
  if (_headingCount > 2500) {
    suspiciousEvidenceReasons.push(
      `headingCount ${_headingCount} exceeds 2500`,
    );
  }
  const contentQuality: ContentQualityLevel =
    suspiciousEvidenceReasons.length > 0
      ? "SUSPICIOUS_BODY"
      : _bodyCharCount < 100 && _headingCount < 2
        ? "TITLE_ONLY"
        : _bodyCharCount < 400
          ? "TITLE_HEADINGS"
          : _bodyCharCount < 1000
            ? "PARTIAL_BODY"
            : "FULL_BODY";

  // Maximum confidence allowed for semantic fields at each quality level.
  // Fields locked by signals (language, usageRights, region) are exempt.
  const SEMANTIC_CONF_CEILING: Record<ContentQualityLevel, number> = {
    TITLE_ONLY: 0.62, // Guessing from title — forces SPOT-CHECK or REVIEW tier
    TITLE_HEADINGS: 0.74, // Limited evidence — forces SPOT-CHECK
    PARTIAL_BODY: 0.87, // Reasonable evidence — can reach SPOT-CHECK
    FULL_BODY: 0.97, // Sufficient evidence — still capped (100% confidence is never real)
    SUSPICIOUS_BODY: 0.72, // Over-expanded crawl — treat as untrustworthy evidence
  };
  const _semanticCeiling = SEMANTIC_CONF_CEILING[contentQuality];
  traceStep("content-quality", {
    bodyCharCount: _bodyCharCount,
    headingCount: _headingCount,
    contentQuality,
    semanticConfidenceCeiling: _semanticCeiling,
    suspiciousEvidenceReasons,
  });

  if (!signals && (asset.slug || asset.textContent)) {
    const signalStartedAt = Date.now();
    const { extractContentSignals } = await import(
      "../utils/contentSignals.js"
    );
    signals = extractContentSignals(
      asset.slug || "",
      assetTitle,
      asset.textContent,
      params.contentZones,
    );
    stageTimings.signalExtractionMs = Date.now() - signalStartedAt;
    logger?.info("⚡ [ClassificationTool] Auto-extracted content signals", {
      urlPattern: signals.urlPattern,
      isProductPage: signals.isProductPage,
      hasDemo: signals.hasDemo,
      mentionedCompanies: signals.mentionedCompanies,
    });
    traceStep("signal-extraction", {
      urlPattern: signals.urlPattern,
      isProductPage: signals.isProductPage,
      hasDemo: signals.hasDemo,
      hasPricing: signals.hasPricing,
      hasFAQ: signals.hasFAQ,
      hasVideo: signals.hasVideo,
      hasDownload: signals.hasDownload,
      hasStepByStep: signals.hasStepByStep,
      detectedLanguage: signals.detectedLanguage,
      mentionedProducts: signals.mentionedProducts,
      mentionedCompanies: signals.mentionedCompanies,
      detectedSeasons: signals.detectedSeasons,
      audienceHints: signals.audienceHints,
      topicHints: signals.topicHints,
      industryHints: signals.industryHints,
      overrides: signals.override,
      structuredContent: {
        title: signals.structuredContent?.title || assetTitle,
        primaryCTAs: signals.structuredContent?.primaryCTAs || [],
        mentionedBrands: signals.structuredContent?.mentionedBrands || [],
        featureHeadings: signals.structuredContent?.featureHeadings || [],
        bodySummary: truncateText(signals.structuredContent?.bodySummary, 1500),
      },
    });
  }

  if (signals && executionProfile.useExternalNlp) {
    const nlpStartedAt = Date.now();
    const traceNlpEnrichment = makeLangSmithTraceable(
      async () =>
        await enrichSignalsWithNlp({
          slug: asset.slug,
          title: assetTitle,
          textContent: asset.textContent,
          signals: signals!,
          logger,
          vendorTrace,
        }),
      {
        name: "enrich_with_nlp",
        run_type: "tool",
        processInputs: () => ({
          assetId: asset.id,
          slug: asset.slug,
          title: assetTitle,
          textLength: asset.textContent.length,
        }),
        processOutputs: (output) => ({
          provider: output.nlp?.provider || null,
          entityCount: output.nlp?.entities?.length || 0,
          intentCount: output.nlp?.intents?.length || 0,
          mentionedCompanies: output.mentionedCompanies,
          mentionedProducts: output.mentionedProducts,
        }),
      },
    );
    signals = await traceNlpEnrichment();
    stageTimings.nlpMs = Date.now() - nlpStartedAt;
    traceStep("nlp-enrichment", {
      provider: signals.nlp?.provider || null,
      source: signals.nlp?.source || null,
      intents: signals.nlp?.intents || [],
      entities: signals.nlp?.entities || [],
      mergedSignals: {
        hasDemo: signals.hasDemo,
        hasPricing: signals.hasPricing,
        hasFAQ: signals.hasFAQ,
        mentionedCompanies: signals.mentionedCompanies,
        mentionedProducts: signals.mentionedProducts,
      },
    });
    vendorTrace?.link({
      from: "signal-extraction",
      to: "nlp-sidecar",
      description: "heuristic signals are enriched by the NLP sidecar",
    });
  } else if (signals) {
    stageTimings.nlpMs = 0;
    logger?.info("⚡ [ClassificationTool] Skipping external NLP enrichment", {
      assetId: asset.id,
      executionMode,
    });
    traceStep("nlp-enrichment-skipped", {
      reason: "execution-profile-disabled",
      executionMode,
    });
  }

  const allowCompanyLookup = Boolean(profile?.companyEnrichmentApplies);

  if (
    allowCompanyLookup &&
    !companyData &&
    signals &&
    signals.mentionedCompanies.length > 0
  ) {
    try {
      const companyStartedAt = Date.now();
      const { lookupCompanies } = await import("../utils/companyCache.js");
      // For case studies, only enrich the featured customer (first mentioned company),
      // not every brand on the page — random logos/partners would skew industry/size.
      const isCaseStudyType = ["pageCaseStudy", "caseStudy"].includes(
        asset.contentType,
      );
      const companiesToLookup = isCaseStudyType
        ? signals.mentionedCompanies.slice(0, 1)
        : signals.mentionedCompanies;
      companyData = await lookupCompanies(companiesToLookup, logger, {
        allowSearch: executionProfile.companyLookupMode === "full",
        vendorTrace,
      });
      stageTimings.companyLookupMs = Date.now() - companyStartedAt;
      logger?.info(
        `🏢 [ClassificationTool] Company enrichment: ${companyData.size} companies resolved`,
      );
      traceStep("company-enrichment", {
        lookupMode: executionProfile.companyLookupMode,
        lookedUpCompanies: companiesToLookup,
        resolvedCompanies: Array.from(companyData.entries()).map(
          ([name, data]) => ({
            name,
            industry: data.industry ?? null,
            companySize: data.companySize ?? null,
            confidence: data.confidence,
            source: data.source,
          }),
        ),
        derivedRecommendation: deriveIndustryAndSize(companyData),
      });
    } catch (err) {
      logger?.warn(
        "[ClassificationTool] Company lookup failed — continuing without enrichment",
        { err },
      );
      traceStep("company-enrichment-error", {
        message: err instanceof Error ? err.message : String(err),
      });
    }
  } else {
    stageTimings.companyLookupMs = 0;
    traceStep("company-enrichment-skipped", {
      reason: !signals?.mentionedCompanies?.length
        ? "no-mentioned-companies"
        : companyData
          ? "precomputed-company-data"
          : "profile-disabled",
    });
  }

  logger?.info("🔧 [ClassificationTool] Starting content classification", {
    assetId: asset.id,
    contentType: asset.contentType,
    textLength: asset.textContent.length,
    taxonomyVersion,
  });

  // SKIP OFFLINE HEURISTIC FOR NEW TAXONOMY (Too complex to maintain manually)
  // if (process.env.MASTRA_CLASSIFIER_MODE === 'offline') ...

  try {
    // -------------------------------------------------------------------------
    // Build structured context blocks from pre-computed signals
    // -------------------------------------------------------------------------
    const includeBrandSignals = Boolean(profile?.companyEnrichmentApplies);
    const signalBlock = signals
      ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 1 — PRE-COMPUTED SIGNALS (ground truth, do not contradict unless you have overwhelming evidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Content Type:       ${asset.contentType} [ground truth — use for schema/format decisions]
URL Pattern:        ${signals.urlPattern}
Is Product Page:    ${signals.isProductPage ? "YES" : "no"}
Has Demo CTA:       ${signals.hasDemo ? `YES — ${signals.structuredContent.primaryCTAs.slice(0, 3).join(", ")}` : "no"}
Has Pricing:        ${signals.hasPricing ? "YES" : "no"}
Has FAQ structure:  ${signals.hasFAQ ? "YES" : "no"}
Has Video content:  ${signals.hasVideo ? "YES" : "no"}
Has Download:       ${signals.hasDownload ? "YES" : "no"}
Has Step-by-step:   ${signals.hasStepByStep ? "YES" : "no"}
Detected Language:  ${signals.detectedLanguage}
Mentioned Products: ${signals.mentionedProducts.join(", ") || "none detected"}
Mentioned Brands:   ${includeBrandSignals ? signals.mentionedCompanies.join(", ") || "none detected" : "suppressed — company enrichment disabled for this content type"}
NLP Provider:       ${signals.nlp?.provider || "heuristic"} (${signals.nlp?.source || "heuristic"})
NLP Intents:        ${signals.nlp?.intents?.map((intent) => `${intent.label}${intent.confidence ? ` (${Math.round(intent.confidence * 100)}%)` : ""}`).join(", ") || "none detected"}
NLP Entities:       ${signals.nlp?.entities?.map((entity) => `${entity.type}:${entity.value}${entity.confidence ? ` (${Math.round(entity.confidence * 100)}%)` : ""}`).join(", ") || "none detected"}
Season Signals:     ${signals.detectedSeasons.length > 0 ? signals.detectedSeasons.join(", ") + (signals.detectedSeasons.length > 1 ? " (MULTIPLE — use content to pick the primary launch season)" : " (detected from title)") : "none detected"}
Year Published: ${signals.override.yearPublished ?? "NOT INFERRED — use your judgment"}
Region:         ${signals.override.region ? `${signals.override.region} [OVERRIDE — do not change]` : "NOT INFERRED — default to Global"}
Audience Hints:  ${signals.audienceHints?.length > 0 ? signals.audienceHints.join(", ") + " (from URL pattern — high confidence)" : "none"}
Topic Hints:     ${signals.topicHints?.length > 0 ? signals.topicHints.join(", ") + " (from slug/product — use unless content clearly contradicts)" : "none"}
Industry Hints:  ${signals.industryHints?.length > 0 ? signals.industryHints.join(", ") + " (from solution URL — strong signal, treat as primary industry)" : "none"}

INFERRED FROM SIGNALS (high-confidence pre-fills — reference these in your classification):
  Schema Type:   ${signals.override.schemaType ?? "NOT INFERRED — use your judgment"}
  Asset Type:    ${signals.override.assetType ?? "NOT INFERRED — use your judgment"}
  Asset SubType: ${signals.override.assetSubType ?? "NOT INFERRED — use your judgment"}
  Funnel Stage:  ${signals.override.funnelStage ?? "NOT INFERRED — use your judgment"}
  Season:        ${signals.override.season ?? (signals.detectedSeasons.length > 1 ? `AMBIGUOUS (${signals.detectedSeasons.join(" or ")}) — pick primary based on content` : "NOT INFERRED — use your judgment")}
  Region:         ${signals.override.region ?? "NOT INFERRED — default to Global"}
  Language:      ${signals.override.language} [OVERRIDE — do not change]
  Usage Rights:  ${signals.override.usageRights} [OVERRIDE — do not change]

CONTENT TYPE PROFILE (deterministic constraints — apply before semantic judgement):
  Asset Sub-Type: ${profile?.assetSubType ?? "AI decides"} ${profile?.assetSubType ? "[LOCKED]" : ""}
  Schema Type:    ${profile?.schemaType?.default ?? "AI decides"} ${profile && !profile.schemaType.aiDecides ? "[LOCKED]" : "[AI picks between options]"}
  Funnel Stage:   ${profile?.funnelStage?.default ?? "AI decides"} (allowed: ${profile?.funnelStage?.allowed?.join(", ") ?? "any"}) ${profile?.funnelStage?.never?.length ? `(NEVER: ${profile.funnelStage.never.join(", ")})` : ""}

SCHEMA TYPE DECISION TREE (apply in order, stop at first match):
  1. Content type is pageLongFormSeo/longFormSeo → Article by default. Use TechArticle only if the page is clearly developer-implementation content (code, SDKs, API auth/reference, setup steps, engineering workflows).
  2. Content type is pageBlogPost/blogPost → BlogPosting
  3. Content type is pageCaseStudy/caseStudy → Article
  4. Content type is pageEvent/event → Event
  5. Content type is pagePricing → SoftwareApplication
  6. URL contains /products/ or /features/ → SoftwareApplication
  7. URL contains /blog/ → BlogPosting
  8. URL contains /customers/ or /case-stud → Article
  9. Has FAQ as primary structure → FAQPage
  10. Step-by-step procedural with actionable verbs → HowTo
  11. Primary content is downloadable file → DigitalDocument
  12. Default → Article
`
      : "";

    const companyBlock =
      companyData && companyData.size > 0
        ? (() => {
            const derived = deriveIndustryAndSize(companyData);
            const lines = Array.from(companyData.entries())
              .filter(
                ([, d]) => d.confidence > 0.5 && (d.industry || d.companySize),
              )
              .map(
                ([name, d]) =>
                  `  ${name}: industry="${d.industry ?? "unknown"}", size="${d.companySize ?? "unknown"}" (confidence ${Math.round(d.confidence * 100)}%, source=${d.source})`,
              )
              .join("\n");
            return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 2 — COMPANY ENRICHMENT (from external lookup — use to inform Industry and Company Size)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${lines || "  No company data available"}

Derived recommendation:
  Industry:     ${derived.industry ?? "not derived — use content signals"}
  Company Size: ${derived.companySize ?? "not derived — use content signals"}
  Confidence:   ${Math.round(derived.confidence * 100)}%

Note: Company Size in this context = the SIZE OF THE TARGET AUDIENCE/BUYER, not Contentful's size.
Use these company proofs aggressively for case studies and customer proof pages. For broad educational SEO/blog/glossary content, treat them as advisory only — logos do not define the buyer.
`;
          })()
        : "";

    const sc = signals?.structuredContent;
    const zones = signals?.contentZones;

    // Build the structured evidence map when zones are available.
    // This physically pre-filters content per field — jobFunction only receives
    // hero/summary text, industry never sees footer logos, funnelStage only
    // sees CTA zones. Enforcement is at the data layer, not the instruction layer.
    let evidenceMap =
      zones && zones.length > 0 ? buildEvidenceMap(zones) : null;

    // Unknown-zone fallback guard: if all evidence fields are empty (every zone
    // was classified as "unknown" — common for custom component naming conventions),
    // the evidenceMap provides no signal. In this case, null it out so the prompt
    // falls back to flat textContent, which is better than all "(no evidence)" blocks.
    if (evidenceMap) {
      const nonEmptyFields = Object.values(evidenceMap).filter(
        (ev) => ev.text.trim().length > 0,
      ).length;
      if (nonEmptyFields < EVIDENCE_MAP_MIN_NONEMPTY_FIELDS) {
        logger?.warn(
          "[ClassificationTool] All EvidenceMap fields empty — all zones classified as unknown. Falling back to flat text.",
          { assetId: asset.id, zoneCount: zones?.length ?? 0 },
        );
        evidenceMap = null;
      }
    }

    const hasZones = zones && zones.length > 0 && evidenceMap !== null;

    const contentBlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — STRUCTURED CONTENT (for semantic classification)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title:            ${sc?.title || assetTitle || "(no title)"}
Primary CTAs:     ${sc?.primaryCTAs.join(" | ") || "none detected"}
Customer Logos:   ${includeBrandSignals ? sc?.mentionedBrands.join(", ") || "none detected" : "suppressed — company enrichment disabled for this content type"}
Feature Headings: ${sc?.featureHeadings.join(" | ") || "none detected"}
${
  hasZones && evidenceMap
    ? `Zone count: ${zones.length} structural sections detected

PRE-FILTERED FIELD EVIDENCE (each block contains ONLY the zones allowed for that field):
${buildFactEvidenceBlock(evidenceMap)}`
    : `
Body (signal-dense excerpt):
${truncateText(sc?.bodySummary || asset.textContent, factContentLimit)}`
}
`;

    const subjectiveContentBlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 3 — STRUCTURED CONTENT (pre-filtered per field for subjective classification)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title:            ${sc?.title || assetTitle || "(no title)"}
Primary CTAs:     ${sc?.primaryCTAs.join(" | ") || "none detected"}
Feature Headings: ${sc?.featureHeadings.join(" | ") || "none detected"}
${
  hasZones && evidenceMap
    ? `
PRE-FILTERED FIELD EVIDENCE (jobFunction = hero/summary only; jobLevel = hero/summary/speaker; funnelStage = CTA only):
${buildSubjectiveEvidenceBlock(evidenceMap)}`
    : `
Body (compressed excerpt):
${truncateText(sc?.bodySummary || asset.textContent, 900)}`
}
`;

    const allowedBlock = allowedLabels
      ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 4 — ALLOWED TAXONOMY VALUES (use EXACT casing — no other values accepted)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Asset Sub-Type:  ${allowedLabels.assetSubType?.join(" | ") || "N/A"}
Product:         ${allowedLabels.product?.join(" | ") || "N/A"}
Job Level:       ${allowedLabels.jobLevel?.join(" | ") || "N/A"}
Job Function:    ${allowedLabels.jobFunction?.join(" | ") || "N/A"}
Audience:        ${allowedLabels.audience?.join(" | ") || "N/A"}
Topic:           ${allowedLabels.topic?.join(" | ") || "N/A"}
Use Cases:       ${allowedLabels.useCases?.join(" | ") || "N/A"}
Funnel Stage:    ${allowedLabels.funnelStage?.join(" | ") || "N/A"}
Industry:        ${allowedLabels.industry?.join(" | ") || "N/A"}
Company Size:    ${allowedLabels.companySize?.join(" | ") || "N/A"}
Region:          ${allowedLabels.region?.join(" | ") || "N/A"}
Language:        ${allowedLabels.language?.join(" | ") || "N/A"}
`
      : "";

    // Section 5 — few-shot examples from human-corrected feedback store
    // Uses semantic selection (embedding similarity) when enough corrections are embedded;
    // falls back to recency sort otherwise. Always non-blocking.
    let queryEmbedding: number[] | null = null;
    if (useDynamicFewShot && correctionCount() > 0) {
      if (embeddedCorrectionCount() >= 3 && assetTitle) {
        try {
          const embeddingStartedAt = Date.now();
          const { getEmbedding, buildEmbedText } = await import(
            "../utils/embeddingCache.js"
          );
          const embedText = buildEmbedText({
            title: assetTitle,
            slug: asset.slug,
            contentType: asset.contentType,
            topicHints: signals?.topicHints,
            bodySample: signals?.structuredContent?.bodySummary?.slice(0, 300),
          });
          queryEmbedding = await getEmbedding(embedText, {
            vendorTrace,
            operation: "embed-few-shot-query",
            purpose: "build query embedding for dynamic few-shot retrieval",
            input: {
              assetId: asset.id,
              contentType: asset.contentType,
            },
          });
          stageTimings.queryEmbeddingMs = Date.now() - embeddingStartedAt;
          if (queryEmbedding) {
            logger?.info(
              "🧲 [ClassificationTool] Semantic few-shot selection active",
            );
            const embeddingCall = getLatestVendorCall(
              (call) =>
                call.category === "embedding" &&
                call.operation === "embed-few-shot-query" &&
                call.status === "ok",
            );
            const embeddingNode = toVendorNode(embeddingCall);
            if (embeddingNode) {
              vendorTrace?.link({
                from: "signal-extraction",
                to: embeddingNode,
                description:
                  "page summary becomes an embedding query for few-shot retrieval",
              });
            }
          }
        } catch (error) {
          if (CLASSIFIER_REQUIRE_CHROMA) {
            throw new VendorDependencyError(
              "embedding",
              error instanceof Error ? error.message : String(error),
            );
          }
        }
      } else if (CLASSIFIER_REQUIRE_CHROMA && embeddedCorrectionCount() >= 3) {
        throw new VendorDependencyError(
          "embedding",
          "query embedding could not be built for dynamic few-shot retrieval",
        );
      }
    } else {
      stageTimings.queryEmbeddingMs = 0;
    }
    const fewShotSelection =
      useDynamicFewShot && correctionCount() > 0
        ? await (async () => {
            const fewShotStartedAt = Date.now();
            const traceFewShotSelection = makeLangSmithTraceable(
              async () =>
                await buildFewShotSelection(queryEmbedding, {
                  excludeEntryIds: [asset.id],
                  vendorTrace,
                }),
              {
                name: "retrieve_few_shot_examples",
                run_type: "retriever",
                processInputs: () => ({
                  assetId: asset.id,
                  hasQueryEmbedding: Boolean(queryEmbedding?.length),
                  embeddingDimensions: queryEmbedding?.length || 0,
                  excludeEntryIds: [asset.id],
                }),
                processOutputs: (output) => ({
                  strategy: output.strategy,
                  exampleCount: output.examples.length,
                  examples: output.examples.map((example) => ({
                    entryId: example.entryId,
                    title: example.title,
                    similarity: example.similarity,
                    selectionStrategy: example.selectionStrategy,
                  })),
                }),
              },
            );
            const selection = await traceFewShotSelection();
            stageTimings.fewShotSelectionMs = Date.now() - fewShotStartedAt;
            const embeddingCall = getLatestVendorCall(
              (call) =>
                call.category === "embedding" &&
                call.operation === "embed-few-shot-query" &&
                call.status === "ok",
            );
            const retrievalCall = getLatestVendorCall(
              (call) =>
                call.category === "retrieval" &&
                call.operation === "query-few-shot-corrections" &&
                call.status === "ok",
            );
            const embeddingNode = toVendorNode(embeddingCall);
            const retrievalNode = toVendorNode(retrievalCall);
            if (embeddingNode && retrievalNode) {
              vendorTrace?.link({
                from: embeddingNode,
                to: retrievalNode,
                description:
                  "query embedding is used to retrieve similar corrected examples",
              });
            }
            if (selection.examples.length > 0) {
              vendorTrace?.link({
                from: "few-shot-selection",
                to: "gemini-fact-stage",
                description:
                  "retrieved examples are injected into the fact-stage prompt",
              });
            }
            return selection;
          })()
        : { block: "", examples: [], strategy: "recency" as const };
    if (!useDynamicFewShot) {
      stageTimings.fewShotSelectionMs = 0;
      logger?.info(
        "⚡ [ClassificationTool] Skipping dynamic few-shot retrieval",
        {
          assetId: asset.id,
          executionMode,
          disabledByCaller: disableDynamicFewShot,
        },
      );
    }
    const fewShotBlock = fewShotSelection.block;
    traceStep("few-shot-selection", {
      strategy: fewShotSelection.strategy,
      exampleCount: fewShotSelection.examples.length,
      examples: fewShotSelection.examples.map((example) => ({
        entryId: example.entryId,
        title: example.title,
        url: example.url,
        contentType: example.contentType,
        similarity: example.similarity,
        selectionStrategy: example.selectionStrategy,
        fields: example.fields,
      })),
    });

    // -------------------------------------------------------------------------
    // Content quality rubric — injected into the prompt so the model knows
    // exactly how much evidence it has and what confidence ceiling applies.
    // This is the rubric the model aligns itself against before assigning confidence.
    // -------------------------------------------------------------------------
    const QUALITY_LABELS: Record<ContentQualityLevel, string> = {
      TITLE_ONLY: "TITLE ONLY — body text is absent or negligible",
      TITLE_HEADINGS: "TITLE + HEADINGS — body text is minimal (<400 chars)",
      PARTIAL_BODY: "PARTIAL BODY — some body text present but incomplete",
      FULL_BODY: "FULL BODY — sufficient text for confident classification",
      SUSPICIOUS_BODY:
        "SUSPICIOUS BODY — crawl appears over-expanded or polluted",
    };
    const contentQualityBlock = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SECTION 0 — EVIDENCE QUALITY (READ THIS BEFORE ASSIGNING ANY CONFIDENCE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available body text: ${_bodyCharCount} chars (after title stripped)
Headings detected:   ${_headingCount}
Evidence level:      ${QUALITY_LABELS[contentQuality]}

CONFIDENCE RUBRIC — you MUST calibrate your confidence based on what evidence you actually have:
  TITLE ONLY       → cap ALL semantic field confidence at 0.60 — you are inferring from a title, not reading content
  TITLE + HEADINGS → cap ALL semantic field confidence at 0.74 — limited evidence
  PARTIAL BODY     → cap ALL semantic field confidence at 0.87 — reasonable but incomplete
  FULL BODY        → no cap — full confidence allowed

YOUR CURRENT EVIDENCE CEILING: ${Math.round(_semanticCeiling * 100)}% for topic, useCases, jobLevel, jobFunction, industry, audience

MANDATORY: If you are working from ${contentQuality === "TITLE_ONLY" ? "title only" : contentQuality === "TITLE_HEADINGS" ? "title + headings only" : contentQuality === "SUSPICIOUS_BODY" ? "suspicious or over-expanded body text" : "partial body text"}, state this explicitly in the reasoning field. Do NOT report confidence above ${Math.round(_semanticCeiling * 100)}% for any semantic field — a high confidence score on sparse content is a misrepresentation.
`;

    const promptSections = {
      contentQualityBlock,
      signalBlock,
      companyBlock,
      contentBlock,
      allowedBlock,
      fewShotBlock,
      assetId: asset.id,
      contentType: asset.contentType,
    };
    // -------------------------------------------------------------------------
    // Content hash cache — skip Gemini if content hasn't changed since last run.
    // Post-processing still runs so new corrections and signal changes are applied.
    // -------------------------------------------------------------------------
    const useCache = !skipCache && !process.env.CLASSIFIER_SKIP_CACHE;
    const cachedEntry =
      useCache && asset.id
        ? getCachedClassification(asset.id, _contentHash)
        : null;

    if (cachedEntry) {
      logger?.info(
        `⚡ [ClassificationTool] Cache hit for "${assetTitle}" — content unchanged, skipping Gemini`,
      );
      // Reconstruct a classification object from cached field snapshots
      const cached: Record<string, { value: unknown; confidence: number }> = {};
      for (const [field, snapshot] of Object.entries(cachedEntry.fields)) {
        cached[field] = {
          value: snapshot.value,
          confidence: snapshot.confidence,
        };
      }
      // Ensure required structural fields exist (assetSubType is a { value[], confidence } field)
      if (!cached.assetSubType)
        cached.assetSubType = { value: [], confidence: 0.9 };
      // Re-apply feedback overrides so any new corrections take effect on cached results
      const overriddenFields = applyFeedbackOverrides(asset.id, cached as unknown as Record<string, { value?: string | string[]; confidence?: number } | null | undefined>);
      if (overriddenFields.length > 0) {
        logger?.info(
          `📌 [ClassificationTool] Applied ${overriddenFields.length} correction(s) to cached result`,
        );
      }
      // Rebuild confidence and needsReview from (potentially updated) cached values.
      // Normalize: old history entries may store confidence as 0-100 integer; divide by 100 if > 1.
      const SEMANTIC_FIELDS_CACHE = [
        "topic",
        "useCases",
        "jobLevel",
        "jobFunction",
        "funnelStage",
        "industry",
      ];
      const semanticConfs = SEMANTIC_FIELDS_CACHE.map((f) =>
        normalizeConfidenceValue(cached[f]?.confidence ?? 0),
      ).filter((c) => c > 0);
      const weakest = semanticConfs.length > 0 ? Math.min(...semanticConfs) : 0;
      const confValues = Object.values(cached).filter(
        (v) => typeof v?.confidence === "number",
      );
      const avgConf =
        confValues.reduce(
          (s: number, v) => s + normalizeConfidenceValue(v.confidence),
          0,
        ) / Math.max(1, confValues.length);
      traceStep("cache-hit", {
        contentHash: _contentHash,
        overriddenFields,
        overallConfidence: Math.round(avgConf * 100) / 100,
        weakestSemantic: weakest,
      });
      const cachedReasoning = cachedEntry.reasoning
        ? cachedEntry.reasoning
            .replace(/\bFINAL\s+OUTPUT\s+SNAPSHOT\b[\s\S]*/i, "")
            .replace(/\bFIELD\s+SUMMARY\b[\s\S]*/i, "")
            .trim() || undefined
        : undefined;
      const cachedResult = {
        ...Object.fromEntries(Object.entries(cached).map(([k, v]) => [k, v])),
        overallConfidence: Math.round(avgConf * 100) / 100,
        needsReview:
          avgConf < CLASSIFIER_REVIEW_OVERALL_THRESHOLD ||
          weakest < CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD,
        reasoning:
          cachedReasoning ??
          "Cache hit — content unchanged since last classification.",
        // Reconstruct fieldProvenance from persisted reasoning when available.
        // Entries saved before this field existed will have undefined here.
        fieldProvenance: parseReasoningToProvenance(cachedReasoning),
        // Use persisted competitive positioning when available; fall back to safe default
        // for history entries saved before this field was added.
        competitivePositioning: cachedEntry.competitivePositioning ?? {
          mentionsCompetitors: false,
          competitorNames: [],
        },
        cached: true,
      } as unknown as ClassificationResult;
      // Apply the same reasoning-value consistency check as the fresh path so
      // hallucinated values stored in the cache do not persist across runs.
      applyReasoningConsistency(cachedResult);
      if (trace) {
        syncVendorTrace();
        (cachedResult as unknown as Record<string, unknown>).debugTrace = trace;
      }
      return cachedResult;
    }

    logger?.info(
      "📝 [ClassificationTool] Requesting chained classification from AI",
      {
        promptVersion: CLASSIFIER_PROMPT_VERSION,
        fewShotStrategy: fewShotSelection.strategy,
        executionMode,
      },
    );

    const factPrompt = await traceFactPrompt({
      assetId: asset.id,
      contentType: asset.contentType,
      executionMode,
      fewShotStrategy: fewShotSelection.strategy,
      promptSections,
    });
    const factStartedAt = Date.now();
    const factGeneration = await withVendorTrace(
      {
        vendor: "gemini",
        service: CLASSIFIER_FACT_MODEL,
        category: "llm",
        operation: "fact-stage-classification",
        purpose:
          "derive factual taxonomy fields from content and retrieval context",
        input: {
          assetId: asset.id,
          contentType: asset.contentType,
          executionMode,
          promptLength: factPrompt.length,
          fewShotStrategy: fewShotSelection.strategy,
        },
        mapResult: (result: unknown) => ({
          usage: normalizeUsage((result as { usage?: unknown })?.usage as unknown as Record<string, number> | null) || null,
          fieldKeys: Object.keys((result as { object?: Record<string, unknown> })?.object || {}),
        }),
      },
      async () =>
        await traceFactLlm({
          prompt: factPrompt,
          model: CLASSIFIER_FACT_MODEL,
        }),
    );
    stageTimings.factPromptMs = Date.now() - factStartedAt;
    traceStep("fact-stage", {
      model: CLASSIFIER_FACT_MODEL,
      promptPreview: truncateText(factPrompt, 4000),
      output: factGeneration.object as Record<string, unknown>,
      usage: normalizeUsage((factGeneration as unknown as { usage?: Record<string, number> }).usage) || null,
    });

    const subjectivePrompt = await traceSubjectivePrompt({
      assetId: asset.id,
      contentType: asset.contentType,
      executionMode,
      promptSections: {
        ...promptSections,
        companyBlock: "",
        contentBlock: subjectiveContentBlock,
        fewShotBlock: "",
      },
      factSummaryBlock: buildFactSummaryBlock(factGeneration.object),
    });
    const subjectiveStartedAt = Date.now();
    vendorTrace?.link({
      from: "gemini-fact-stage",
      to: "gemini-subjective-stage",
      description: "fact output is summarized into the subjective-stage prompt",
    });
    const subjectiveGeneration = await withVendorTrace(
      {
        vendor: "gemini",
        service: CLASSIFIER_SUBJECTIVE_MODEL,
        category: "llm",
        operation: "subjective-stage-classification",
        purpose:
          "derive subjective taxonomy fields from content and fact summary",
        input: {
          assetId: asset.id,
          contentType: asset.contentType,
          executionMode,
          promptLength: subjectivePrompt.length,
        },
        mapResult: (result: unknown) => ({
          usage: normalizeUsage((result as { usage?: unknown })?.usage as unknown as Record<string, number> | null) || null,
          fieldKeys: Object.keys((result as { object?: Record<string, unknown> })?.object || {}),
        }),
      },
      async () =>
        await traceSubjectiveLlm({
          prompt: subjectivePrompt,
          model: CLASSIFIER_SUBJECTIVE_MODEL,
        }),
    );
    stageTimings.subjectivePromptMs = Date.now() - subjectiveStartedAt;
    traceStep("subjective-stage", {
      model: CLASSIFIER_SUBJECTIVE_MODEL,
      promptPreview: truncateText(subjectivePrompt, 4000),
      output: subjectiveGeneration.object as Record<string, unknown>,
      usage: normalizeUsage((subjectiveGeneration as unknown as { usage?: Record<string, number> }).usage) || null,
    });

    const factObj = factGeneration.object as Record<string, unknown>;
    const subjectiveObj = subjectiveGeneration.object as Record<string, unknown>;
    // Strip FINAL OUTPUT SNAPSHOT blocks emitted despite prompt instructions.
    const stripSnapshot = (s: string | undefined) =>
      s ? s.replace(/\bFINAL\s+OUTPUT\s+SNAPSHOT\b[\s\S]*/i, "").replace(/\bFIELD\s+SUMMARY\b[\s\S]*/i, "").trim() : undefined;
    // Merge fact + subjective reasoning into a single string for CSV/review output.
    const mergedReasoning =
      [
        factObj.factReasoning ? `FACT FIELDS:\n${stripSnapshot(factObj.factReasoning as string | undefined)}` : "",
        subjectiveObj.reasoning
          ? `SUBJECTIVE FIELDS:\n${stripSnapshot(subjectiveObj.reasoning as string | undefined)}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n") || undefined;

    const classification = ClassificationResultSchema.parse({
      ...factGeneration.object,
      ...subjectiveGeneration.object,
      overallConfidence: undefined,
      needsReview: undefined,
      reasoning: mergedReasoning,
    });

    // Structured provenance — parse reasoning string into a queryable per-field record.
    classification.fieldProvenance = parseReasoningToProvenance(
      classification.reasoning,
    );

    // Reasoning–value consistency: if the model's reasoning says "left blank" for
    // a field but it still emitted values, trust the reasoning and clear the field.
    // This prevents hallucinated companySize, industry, etc. on broad content.
    applyReasoningConsistency(classification);

    // Enforce safe defaults for required fields when the model returns empty values.
    const ensureArray = (value: unknown, fallback: string[]) =>
      Array.isArray(value) && value.length > 0 ? value : fallback;
    classification.assetType.value =
      classification.assetType.value || "Webpage";
    classification.assetSubType.value = ensureArray(
      classification.assetSubType.value,
      ["Webpage"],
    );
    classification.schemaType.value =
      classification.schemaType.value || "Article";
    classification.product.value = ensureArray(classification.product.value, [
      "Platform",
    ]);
    classification.region.value = ensureArray(classification.region.value, [
      "Global",
    ]);
    classification.language.value = classification.language.value || "EN";
    classification.usageRights.value =
      classification.usageRights.value || "External";

    // Helper: safely convert unknown AI output to string[]
    const asArray = (v: unknown): string[] => {
      if (Array.isArray(v)) return v.filter(Boolean).map(String);
      if (v && typeof v === "string") return [v];
      return [];
    };

    // Save raw AI values for synonym-prone fields before Jaccard coercion runs.
    // These are used by the embedding fallback below if Jaccard returns empty.
    const rawTopic = [...asArray(classification.topic?.value)];
    const rawUseCases = [...asArray(classification.useCases?.value)];
    const rawIndustry = [...asArray(classification.industry?.value)];

    // Use caller-supplied allowedLabels when present; otherwise fall back to the
    // full static taxonomy so callers that omit allowedLabels (batch jobs,
    // scripts, CI) still get taxonomy validation against canonical values.
    const labels = allowedLabels ?? getStaticAllowedTaxonomyLabels();
    {
      const coerceMulti = (values: string[], allowed?: string[]) =>
        allowed ? coerceToAllowed({ values, allowed }) : values;
      const coerceSingle = (value: string, allowed?: string[]) =>
        allowed ? coerceSingleAllowed({ value, allowed }) || value : value;

      const contentTokens = new Set(
        normalizeLabel(`${assetTitle} ${asset.textContent || ""}`)
          .split(" ")
          .filter(Boolean),
      );
      const tokensForLabel = (label: string) =>
        new Set(normalizeLabel(label).split(" ").filter(Boolean));
      const scoreLabel = (label: string) =>
        jaccard(tokensForLabel(label), contentTokens);
      const pickTop = (
        values: string[],
        opts: { max: number; allowAdditionalIfClose?: boolean },
      ) => {
        const uniq = Array.from(new Set(values)).filter(Boolean);
        if (uniq.length <= 1) return uniq;
        const ranked = uniq
          .map((v) => ({ v, score: scoreLabel(v) }))
          .sort((a, b) => b.score - a.score || a.v.localeCompare(b.v));
        // Keep all AI-selected values up to the max — the model already
        // decided they apply. Only trim beyond the cap, ranked by relevance.
        return ranked.slice(0, opts.max).map((r) => r.v);
      };

      const isBroadNonSpecialistContent =
        [
          "pageLongFormSeo",
          "longFormSeo",
          "pageBlogPost",
          "blogPost",
          "pageGlossary",
          "glossary",
        ].includes(asset.contentType) &&
        !signals?.industryHints?.length &&
        !signals?.audienceHints?.length;
      const broadTopicMax = isBroadNonSpecialistContent ? 4 : 3;

      // assetType and schemaType — single-value fields coerced against canonical lists
      if (labels.assetType?.length) {
        classification.assetType.value =
          coerceSingle(classification.assetType.value, labels.assetType) ??
          classification.assetType.value;
      }
      if (labels.schemaType?.length) {
        classification.schemaType.value =
          coerceSingle(classification.schemaType.value, labels.schemaType) ??
          classification.schemaType.value;
      }

      classification.assetSubType.value = pickTop(
        coerceMulti(
          classification.assetSubType.value,
          labels.assetSubType,
        ),
        { max: 1 },
      );
      classification.product.value = pickTop(
        coerceMulti(classification.product.value, labels.product),
        { max: 2, allowAdditionalIfClose: true },
      );
      {
        const rawLevels = coerceMulti(classification.jobLevel.value, labels.jobLevel);
        // Broad educational TOFU content (SEO pages, glossary, blog) with no
        // specialist audience signals is level-agnostic — expand to all levels.
        // The model consistently picks 3 arbitrary levels for these; override.
        const isTOFU = classification.funnelStage?.value === "Awareness (TOFU)";
        if (isBroadNonSpecialistContent && isTOFU && rawLevels.length >= 3) {
          classification.jobLevel.value = labels.jobLevel ?? rawLevels;
        } else {
          classification.jobLevel.value = pickTop(rawLevels, { max: 3, allowAdditionalIfClose: true });
        }
      }
      classification.jobFunction.value = pickTop(
        coerceMulti(
          classification.jobFunction.value,
          labels.jobFunction,
        ),
        {
          max: 3,
          allowAdditionalIfClose: true,
        },
      );
      classification.audience.value = pickTop(
        coerceMulti(classification.audience.value, labels.audience),
        {
          max: 3,
          allowAdditionalIfClose: true,
        },
      );
      classification.topic.value = pickTop(
        coerceMulti(classification.topic.value, labels.topic),
        {
          max: broadTopicMax,
          allowAdditionalIfClose: true,
        },
      );
      classification.useCases.value = pickTop(
        coerceMulti(classification.useCases.value, labels.useCases),
        {
          max: broadTopicMax,
          allowAdditionalIfClose: true,
        },
      );
      classification.funnelStage.value = coerceSingle(
        classification.funnelStage.value,
        labels.funnelStage,
      );
      classification.industry.value = pickTop(
        coerceMulti(classification.industry.value, labels.industry),
        {
          max: 2,
          allowAdditionalIfClose: true,
        },
      );
      classification.companySize.value = pickTop(
        coerceMulti(
          classification.companySize.value,
          labels.companySize,
        ),
        {
          max: 1,
        },
      );
      classification.region.value = pickTop(
        coerceMulti(classification.region.value, labels.region),
        { max: 1 },
      );
      classification.language.value =
        coerceSingle(classification.language.value, labels.language) ||
        classification.language.value;
    }

    // Deterministic writeback: when the signal layer extracted a clean year from
    // the title, always use it — don't let the model override or corrupt it.
    if (signals?.override.yearPublished) {
      classification.yearPublished = {
        value: signals.override.yearPublished,
        confidence: 0.99,
      };
    } else if (classification.yearPublished?.value != null) {
      // Enforce 4-digit year format — clear anything the AI emitted that isn't \d{4}
      if (!/^\d{4}$/.test(String(classification.yearPublished.value))) {
        classification.yearPublished = { value: null, confidence: 0 };
      }
    }

    // -------------------------------------------------------------------------
    // EMBEDDING FALLBACK COERCION
    // Fires ONLY for synonym-prone fields (topic, useCases, industry) when
    // Jaccard coercion returned empty — meaning the AI used a synonym or
    // paraphrase not captured by token overlap (e.g. "Headless Commerce" vs
    // "Headless CMS"). Uses cosine similarity on cached embeddings.
    // Threshold: 0.88 (high precision — only clear semantic matches)
    // Non-blocking: embedding failures are silently ignored.
    // -------------------------------------------------------------------------
    try {
      type EmbedField = {
        field: "topic" | "useCases" | "industry";
        raw: string[];
        allowed?: string[];
      };
      const embedFields: EmbedField[] = [
        { field: "topic", raw: rawTopic, allowed: labels.topic },
        {
          field: "useCases",
          raw: rawUseCases,
          allowed: labels.useCases,
        },
        {
          field: "industry",
          raw: rawIndustry,
          allowed: labels.industry,
        },
      ];

      const cls = classification as unknown as Record<
        string,
        { value: string | string[]; confidence: number }
      >;

      const needsFallback = embedFields.filter(
        (f) =>
          f.allowed?.length &&
          f.raw.length > 0 &&
          asArray(cls[f.field]?.value).length === 0,
      );

      if (needsFallback.length > 0) {
        const { getEmbedding, cosineSimilarity } = await import(
          "../utils/embeddingCache.js"
        );
        const EMBED_THRESHOLD = 0.88;

        for (const { field, raw, allowed } of needsFallback) {
          const results: string[] = [];
          for (const aiVal of raw) {
            const aiEmbed = await getEmbedding(aiVal, {
              vendorTrace,
              operation: "embed-taxonomy-candidate",
              purpose: `coerce model output for ${field} onto allowed taxonomy labels`,
              input: { field, kind: "candidate" },
            });
            if (!aiEmbed) continue;
            let best: { label: string; score: number } | undefined;
            for (const label of allowed!) {
              const labelEmbed = await getEmbedding(label, {
                vendorTrace,
                operation: "embed-taxonomy-label",
                purpose: `score allowed label similarity for ${field}`,
                input: { field, kind: "allowed-label" },
              });
              const score = cosineSimilarity(aiEmbed, labelEmbed);
              if (!best || score > best.score) best = { label, score };
            }
            if (best && best.score >= EMBED_THRESHOLD) {
              results.push(best.label);
              logger?.info(
                `[ClassificationTool] Embedding coercion: "${aiVal}" -> "${best.label}" ` +
                  `(${Math.round(best.score * 100)}% sim) for field ${field}`,
              );
            }
          }
          if (results.length > 0) {
            cls[field].value = Array.from(new Set(results));
          }
        }
      }
    } catch {
      /* non-fatal — embedding API unavailable */
    }

    const { consistencyWarnings, openQuestionFlags, lowContentWarning } =
      applyDeterministicRuntimePolicies({
        classification,
        asset,
        assetTitle,
        signals,
        companyData,
        allowedLabels,
        profile,
        contentQuality,
        semanticCeiling: _semanticCeiling,
        bodyCharCount: _bodyCharCount,
        suspiciousEvidenceReasons,
        logger,
      });

    classification.competitivePositioning = normalizeCompetitivePositioning({
      competitivePositioning: classification.competitivePositioning,
      title: assetTitle,
      slug: asset.slug,
      textContent: asset.textContent,
    });

    const {
      weakestSemantic,
      reviewReasons,
      confidenceCalibration,
      overriddenByHuman,
    } = finalizeClassificationReviewState({
      classification,
      assetId: asset.id,
      contentQuality,
      suspiciousEvidenceReasons,
      consistencyWarnings,
      openQuestionFlags,
      logger,
    });
    traceStep("post-processing", {
      profile: profile
        ? {
            assetType: profile.assetType,
            assetSubType: profile.assetSubType,
            schemaType: profile.schemaType,
            funnelStage: profile.funnelStage,
            companyEnrichmentApplies: profile.companyEnrichmentApplies,
          }
        : null,
      lowContentWarning,
      consistencyWarnings,
      openQuestionFlags,
      humanOverrides: overriddenByHuman,
      reviewReasons,
      confidenceCalibration,
      finalFields: {
        assetType: classification.assetType,
        assetSubType: classification.assetSubType,
        schemaType: classification.schemaType,
        product: classification.product,
        jobLevel: classification.jobLevel,
        jobFunction: classification.jobFunction,
        audience: classification.audience,
        topic: classification.topic,
        useCases: classification.useCases,
        funnelStage: classification.funnelStage,
        industry: classification.industry,
        companySize: classification.companySize,
        region: classification.region,
        language: classification.language,
        usageRights: classification.usageRights,
        event: classification.event,
        eventType: classification.eventType,
        season: classification.season,
        yearPublished: classification.yearPublished,
        competitivePositioning: classification.competitivePositioning,
        overallConfidence: classification.overallConfidence,
        needsReview: classification.needsReview,
      },
    });

    logger?.info("✅ [ClassificationTool] Content classification completed", {
      assetId: asset.id,
      overallConfidence: classification.overallConfidence,
      needsReview: classification.needsReview,
      executionMode,
      stageTimings: {
        ...stageTimings,
        totalMs: Date.now() - _startMs,
      },
      classifications: {
        assetType: classification.assetType.value,
        topic: classification.topic.value,
        funnelStage: classification.funnelStage.value,
        industry: classification.industry.value,
      },
    });

    // Structured observability logging — non-blocking
    try {
      syncVendorTrace();
      const { logRun } = await import("../utils/observability.js");
      const { hasFeedback } = await import("../utils/feedbackStore.js");
      const fieldValues: Record<string, { value: unknown; confidence: number }> =
        {};
      for (const [k, v] of Object.entries(
        classification as unknown as Record<
          string,
          { value?: unknown; confidence?: number }
        >,
      )) {
        if (v && typeof v === "object" && "value" in v && "confidence" in v) {
          fieldValues[k] = { value: v.value, confidence: v.confidence ?? 0 };
        }
      }
      await logRun({
        entryId: asset.id,
        title: assetTitle,
        url: asset.slug,
        contentType: asset.contentType,
        durationMs: Date.now() - _startMs,
        overallConf: classification.overallConfidence ?? 0,
        needsReview: classification.needsReview ?? false,
        fieldValues,
        consistencyWarnings: (
          classification as unknown as Record<string, unknown>
        )["consistencyWarnings"] as string[] | undefined,
        model: `${CLASSIFIER_FACT_MODEL} -> ${CLASSIFIER_SUBJECTIVE_MODEL}`,
        hasCorrection: hasFeedback(asset.id),
        promptVersion: CLASSIFIER_PROMPT_VERSION,
        fewShotExamples: fewShotSelection.examples as unknown as Record<string, unknown>[],
        trace: {
          factPrompt,
          subjectivePrompt,
          fewShotStrategy: fewShotSelection.strategy,
          nlp: signals?.nlp,
          vendorCalls: trace?.vendorCalls || [],
          wiring: trace?.wiring || [],
        },
        tokenUsage: mergeUsage(
          normalizeUsage(
            (factGeneration as unknown as { usage?: Record<string, number> }).usage,
          ),
          normalizeUsage(
            (subjectiveGeneration as unknown as { usage?: Record<string, number> }).usage,
          ),
        ),
        stageTimings: {
          ...stageTimings,
          totalMs: Date.now() - _startMs,
        },
        reviewRouting: {
          reviewReasons,
          weakestSemantic,
          overallConfidence: classification.overallConfidence,
          needsReview: classification.needsReview,
        },
        confidenceCalibration: confidenceCalibration as unknown as Record<string, string | number | boolean | null>,
        vendorTrace,
      });
    } catch {
      /* non-fatal */
    }

    if (trace) {
      syncVendorTrace();
      (classification as unknown as Record<string, unknown>)["debugTrace"] =
        trace;
    }
    return classification;
  } catch (error) {
    if (isVendorDependencyError(error)) {
      logger?.error(
        "❌ [ClassificationTool] Required vendor dependency failed",
        { error, assetId: asset.id },
      );
      throw error;
    }

    const msg = error instanceof Error ? error.message : String(error);
    logger?.error(
      "❌ [ClassificationTool] Error during content classification",
      { error, assetId: asset.id },
    );

    traceStep("error", {
      message: msg,
    });
    if (trace) {
      syncVendorTrace();
    }
    throw error;
  }
}

const tracedClassifyContent = makeLangSmithTraceable(classifyContentImpl, {
  name: "run_classification_pipeline",
  run_type: "chain",
  processInputs: (input) => ({
    assetId: input.asset.id,
    title: input.asset.title || "",
    slug: input.asset.slug || "",
    contentType: input.asset.contentType,
    textLength: input.asset.textContent.length,
    executionMode: input.executionMode || "default",
    skipCache: Boolean(input.skipCache),
    collectTrace: Boolean(input.collectTrace),
  }),
  processOutputs: (output: ClassificationResult & Record<string, unknown>) => ({
    overallConfidence: output.overallConfidence ?? 0,
    needsReview: output.needsReview ?? true,
    topic: output.topic?.value ?? [],
    funnelStage: output.funnelStage?.value ?? null,
    language: output.language?.value ?? null,
    vendorCalls:
      (output["debugTrace"] as { vendorCalls?: unknown[] } | undefined)
        ?.vendorCalls ?? [],
    wiring:
      (output["debugTrace"] as { wiring?: unknown[] } | undefined)?.wiring ??
      [],
  }),
});

export async function classifyContent(params: ClassifyContentParams) {
  return await tracedClassifyContent(params);
}

export async function batchClassifyContent(params: {
  assets: Array<{
    id: string;
    title?: string;
    contentType: string;
    textContent: string;
  }>;
  taxonomyVersion?: string;
  concurrency?: number;
  allowedLabels?: AllowedTaxonomyLabels;
  logger?: Logger;
}) {
  const {
    assets,
    taxonomyVersion = "v2",
    concurrency = 5,
    allowedLabels,
    logger,
  } = params;

  logger?.info(
    "🔧 [BatchClassificationTool] Starting batch content classification",
    {
      assetCount: assets.length,
      concurrency,
      taxonomyVersion,
    },
  );

  const results: (ClassificationResult & { assetId: string })[] = [];
  let successful = 0;
  let needingReview = 0;
  let totalConfidence = 0;

  // Process assets in batches to manage concurrency
  for (let i = 0; i < assets.length; i += concurrency) {
    const batch = assets.slice(i, i + concurrency);

    logger?.info(
      `📝 [BatchClassificationTool] Processing batch ${Math.floor(i / concurrency) + 1}`,
      {
        batchSize: batch.length,
        progress: `${i + batch.length}/${assets.length}`,
      },
    );

    const batchPromises = batch.map(async (asset) => {
      try {
        const classification = await classifyContent({
          asset,
          taxonomyVersion,
          allowedLabels,
          logger,
        });

        successful++;
        if (classification.needsReview) needingReview++;
        totalConfidence += classification.overallConfidence || 0;

        return { ...classification, assetId: asset.id };
      } catch (error) {
        logger?.error(
          `❌ [BatchClassificationTool] Error classifying asset ${asset.id}`,
          { error },
        );
        throw error;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const avgConfidence =
    totalConfidence > 0
      ? Math.round((totalConfidence / successful) * 100) / 100
      : 0;

  logger?.info("✅ [BatchClassificationTool] Batch classification completed", {
    total: assets.length,
    successful,
    needingReview,
    avgConfidence,
  });

  return {
    results,
    summary: {
      total: assets.length,
      successful,
      needingReview,
      avgConfidence,
    },
  };
}
