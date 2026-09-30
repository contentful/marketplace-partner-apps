/**
 * classificationTypes.ts
 *
 * Canonical shared types used across the classification pipeline and scripts.
 * Re-exported from their authoritative source files where possible.
 */

// ---------------------------------------------------------------------------
// Re-exports from authoritative modules
// ---------------------------------------------------------------------------
export type {
  HistoryEntry,
  HistoryFieldSnapshot,
  DriftReport,
} from "../utils/classificationHistory.js";

export type { Correction, FewShotExample } from "../utils/feedbackStore.js";

export type { ClassificationResult } from "../tools/classificationTool.js";

// ---------------------------------------------------------------------------
// CMA (Contentful Management API) entry shape used by scripts that read
// entries directly from the management API.
// ---------------------------------------------------------------------------
export type CmaEntry = {
  sys: { id: string; contentType: { sys: { id: string } } };
  fields: Record<string, Record<string, unknown>>;
};

// ---------------------------------------------------------------------------
// Extended classification result used by runtime policy, review routing,
// and observability layers.
// ---------------------------------------------------------------------------
export type ClassificationResultExtra = import("../tools/classificationTool.js").ClassificationResult & {
  debugTrace?: Record<string, unknown>;
  reviewReasons?: string[];
  confidenceCalibration?: Record<string, number | boolean | string | null>;
  lowContentWarning?: string;
  cached?: boolean;
  consistencyWarnings?: string[];
  openQuestionFlags?: string[];
};
