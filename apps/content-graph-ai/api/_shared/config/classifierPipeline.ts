function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

export const CLASSIFIER_PROMPT_VERSION =
  process.env.CLASSIFIER_PROMPT_VERSION || "2026-04-02-evidence-v10";

export const CLASSIFIER_FACT_MODEL =
  process.env.GEMINI_FACT_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-3.1-pro-preview";

export const CLASSIFIER_SUBJECTIVE_MODEL =
  process.env.GEMINI_SUBJECTIVE_MODEL || "gemini-2.5-flash-lite";

export const CLASSIFIER_REVIEW_OVERALL_THRESHOLD = parseNumber(
  process.env.CLASSIFIER_REVIEW_OVERALL_THRESHOLD,
  0.75,
);

export const CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD = parseNumber(
  process.env.CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD,
  0.6,
);

export const CLASSIFIER_ENABLE_CONFIDENCE_CALIBRATION = parseBoolean(
  process.env.CLASSIFIER_ENABLE_CONFIDENCE_CALIBRATION,
  true,
);

export const CLASSIFIER_CONFIDENCE_CALIBRATION_PATH =
  process.env.CLASSIFIER_CONFIDENCE_CALIBRATION_PATH ||
  "seeds/confidence-calibration.json";

export const CLASSIFICATION_QUEUE_BATCH_SIZE = parseNumber(
  process.env.CLASSIFICATION_QUEUE_BATCH_SIZE,
  10,
);

export const CLASSIFICATION_QUEUE_MAX_ATTEMPTS = parseNumber(
  process.env.CLASSIFICATION_QUEUE_MAX_ATTEMPTS,
  5,
);

export const CONTENTFUL_REVIEW_TAG_ID =
  process.env.CONTENTFUL_REVIEW_TAG_ID || "";

export const CLASSIFIER_NLP_ENDPOINT =
  process.env.CLASSIFIER_NLP_ENDPOINT || "";

export const CLASSIFIER_NLP_PROVIDER =
  process.env.CLASSIFIER_NLP_PROVIDER ||
  (CLASSIFIER_NLP_ENDPOINT ? "sidecar" : "heuristic");

export const CLASSIFIER_STRICT_VENDOR_MODE = parseBoolean(
  process.env.CLASSIFIER_STRICT_VENDOR_MODE,
  true,
);

export const CLASSIFIER_REQUIRE_NLP = parseBoolean(
  process.env.CLASSIFIER_REQUIRE_NLP,
  CLASSIFIER_STRICT_VENDOR_MODE && Boolean(CLASSIFIER_NLP_ENDPOINT),
);

export const CLASSIFIER_REQUIRE_CHROMA = parseBoolean(
  process.env.CLASSIFIER_REQUIRE_CHROMA,
  CLASSIFIER_STRICT_VENDOR_MODE && Boolean(process.env.CHROMA_URL),
);

export const CLASSIFIER_REQUIRE_LANGSMITH = parseBoolean(
  process.env.CLASSIFIER_REQUIRE_LANGSMITH,
  CLASSIFIER_STRICT_VENDOR_MODE &&
    Boolean(process.env.LANGSMITH_API_KEY) &&
    process.env.LANGSMITH_TRACING !== "false",
);

export const CLASSIFIER_REQUIRE_OTEL = parseBoolean(
  process.env.CLASSIFIER_REQUIRE_OTEL,
  CLASSIFIER_STRICT_VENDOR_MODE &&
    Boolean(
      process.env.PHOENIX_COLLECTOR_ENDPOINT ||
        process.env.DATADOG_OTLP_ENDPOINT,
    ),
);

export const GOLDEN_DATASET_PATH =
  process.env.GOLDEN_DATASET_PATH || "tests/golden-signal-fixtures.json";

// v38: structured provenance (fieldProvenance record on ClassificationResult)
// and automated feedback loop (auto-save confirmed correction on editor approval).
export const CLASSIFIER_AUTO_FEEDBACK_ON_APPROVE = parseBoolean(
  process.env.CLASSIFIER_AUTO_FEEDBACK_ON_APPROVE,
  true,
);

// v39: adversarial hardening constants.
// Minimum non-empty evidence fields before falling back to flat text.
// If all fields in the EvidenceMap are empty (all zones = unknown), the map
// is discarded and the prompt uses flat textContent instead.
// v40: EVIDENCE_MAP_MIN_NONEMPTY_FIELDS is now imported and used in classificationTool.ts
// (was previously hardcoded to === 0 in the unknown-zone fallback guard).
// v40.2: HistoryEntry now persists reasoning and competitivePositioning for cache-hit fidelity.
// v40.3: HistoryEntry now persists promptVersion. section_heading added to ZONE_CT_PATTERNS.
// v41: factReasoning added to fact stage — explains where product/topic/industry/companySize etc.
//      come from. assetType profiles corrected — "Document" replaced with valid taxonomy values
//      (Webpage, Blog, Case Study, Event, etc.). Hardcoded "Document" fallback fixed to "Webpage".
export const EVIDENCE_MAP_MIN_NONEMPTY_FIELDS = parseNumber(
  process.env.EVIDENCE_MAP_MIN_NONEMPTY_FIELDS,
  1,
);
