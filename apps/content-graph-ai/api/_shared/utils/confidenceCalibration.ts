import * as fs from "fs";
import * as path from "path";
import {
  CLASSIFIER_CONFIDENCE_CALIBRATION_PATH,
  CLASSIFIER_ENABLE_CONFIDENCE_CALIBRATION,
  CLASSIFIER_REVIEW_OVERALL_THRESHOLD,
  CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD,
} from "../config/classifierPipeline.js";
import {
  CLASSIFIER_CONFIDENCE_SUMMARY_FIELDS,
  CLASSIFIER_SEMANTIC_CONFIDENCE_FIELDS,
} from "../config/classifierPolicy.js";

export type CalibrationBand = {
  min: number;
  max: number;
  sampleSize: number;
  matches: number;
  rawMean: number;
  empiricalAccuracy: number;
  smoothedAccuracy: number;
};

export type FieldCalibrationProfile = {
  sampleSize: number;
  exactAccuracy: number;
  averageRawConfidence: number;
  bands: CalibrationBand[];
};

export type ConfidenceCalibrationProfile = {
  version: string;
  generatedAt: string;
  source: {
    historyEntries: number;
    correctionEntries: number;
    overlapEntries: number;
    bandCount: number;
    priorWeight: number;
  };
  overall?: FieldCalibrationProfile;
  fields: Record<string, FieldCalibrationProfile>;
};

type FieldSnapshot = {
  value: unknown;
  confidence: number;
};

type ClassificationLike = Record<string, unknown>;

type CalibrationMetadata = {
  enabled: boolean;
  path: string;
  profileVersion?: string;
  appliedFields: string[];
  dataBacked: boolean;
  minimumSampleSize?: number;
  actualSampleSize?: number;
  uncalibratedSemanticFields?: string[];
  semanticFieldCoverage?: Array<{
    field: string;
    confidence: number;
    sampleSize: number;
    dataBacked: boolean;
  }>;
  overall?: {
    raw: number;
    calibrated: number;
    sampleSize: number;
    dataBacked: boolean;
  };
};

type SemanticCoverageEntry = {
  field: string;
  confidence: number;
  sampleSize: number;
  dataBacked: boolean;
};

let cachedProfile: ConfidenceCalibrationProfile | null | undefined;

const MIN_FIELD_PROFILE_SAMPLE_SIZE = 15;
const MIN_FIELD_BAND_SAMPLE_SIZE = 5;
const MIN_OVERALL_PROFILE_SAMPLE_SIZE = 25;
const MIN_OVERALL_BAND_SAMPLE_SIZE = 10;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function normalizeConfidence(value: number | undefined): number {
  if (!Number.isFinite(Number(value))) return 0;
  const numeric = Number(value);
  return clamp01(numeric > 1 ? numeric / 100 : numeric);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function loadCalibrationProfile(): ConfidenceCalibrationProfile | null {
  if (cachedProfile !== undefined) return cachedProfile;

  if (!CLASSIFIER_ENABLE_CONFIDENCE_CALIBRATION) {
    cachedProfile = null;
    return cachedProfile;
  }

  const file = path.resolve(CLASSIFIER_CONFIDENCE_CALIBRATION_PATH);
  try {
    if (!fs.existsSync(file)) {
      cachedProfile = null;
      return cachedProfile;
    }
    cachedProfile = JSON.parse(
      fs.readFileSync(file, "utf-8"),
    ) as ConfidenceCalibrationProfile;
    return cachedProfile;
  } catch {
    cachedProfile = null;
    return cachedProfile;
  }
}

function calibrateFromProfile(
  rawConfidence: number,
  profile: FieldCalibrationProfile | undefined,
  thresholds?: {
    minProfileSampleSize?: number;
    minBandSampleSize?: number;
  },
): { value: number; sampleSize: number } {
  const raw = normalizeConfidence(rawConfidence);
  const minProfileSampleSize = thresholds?.minProfileSampleSize ?? 0;
  const minBandSampleSize = thresholds?.minBandSampleSize ?? 0;

  if (
    !profile ||
    profile.sampleSize === 0 ||
    profile.sampleSize < minProfileSampleSize
  ) {
    return { value: raw, sampleSize: 0 };
  }

  const matchingBand =
    profile.bands.find((band) => raw >= band.min && raw < band.max) ||
    profile.bands.find((band) => raw >= band.min && raw <= band.max) ||
    profile.bands[profile.bands.length - 1];

  if (!matchingBand) {
    return { value: raw, sampleSize: profile.sampleSize };
  }

  if (matchingBand.sampleSize < minBandSampleSize) {
    return { value: raw, sampleSize: matchingBand.sampleSize };
  }

  return {
    value: round2(clamp01(matchingBand.smoothedAccuracy)),
    sampleSize: matchingBand.sampleSize,
  };
}

function hasSufficientCalibrationData(
  profile: FieldCalibrationProfile | undefined,
  thresholds: {
    minProfileSampleSize: number;
    minBandSampleSize: number;
  },
  rawConfidence?: number,
): { ok: boolean; sampleSize: number } {
  if (!profile) {
    return { ok: false, sampleSize: 0 };
  }

  if (profile.sampleSize < thresholds.minProfileSampleSize) {
    return { ok: false, sampleSize: profile.sampleSize };
  }

  if (rawConfidence === undefined) {
    return { ok: true, sampleSize: profile.sampleSize };
  }

  const raw = normalizeConfidence(rawConfidence);
  const matchingBand =
    profile.bands.find((band) => raw >= band.min && raw < band.max) ||
    profile.bands.find((band) => raw >= band.min && raw <= band.max) ||
    profile.bands[profile.bands.length - 1];

  if (!matchingBand || matchingBand.sampleSize < thresholds.minBandSampleSize) {
    return {
      ok: false,
      sampleSize: matchingBand?.sampleSize ?? profile.sampleSize,
    };
  }

  return { ok: true, sampleSize: matchingBand.sampleSize };
}

export function applyConfidenceCalibration(
  classification: ClassificationLike,
  options?: { skipFields?: Iterable<string> },
): CalibrationMetadata {
  const profile = loadCalibrationProfile();
  const appliedFields: string[] = [];
  const skipFields = new Set(options?.skipFields || []);
  const metadata: CalibrationMetadata = {
    enabled: Boolean(profile),
    path: CLASSIFIER_CONFIDENCE_CALIBRATION_PATH,
    profileVersion: profile?.version,
    appliedFields,
    dataBacked: false,
  };

  if (!profile) {
    return metadata;
  }

  for (const [field, value] of Object.entries(classification)) {
    if (skipFields.has(field)) continue;
    if (!value || typeof value !== "object" || !("confidence" in value))
      continue;

    const snapshot = value as FieldSnapshot;
    if (!Number.isFinite(Number(snapshot.confidence))) continue;

    const calibrated = calibrateFromProfile(
      snapshot.confidence,
      profile.fields[field],
      {
        minProfileSampleSize: MIN_FIELD_PROFILE_SAMPLE_SIZE,
        minBandSampleSize: MIN_FIELD_BAND_SAMPLE_SIZE,
      },
    );
    if (calibrated.sampleSize > 0) {
      snapshot.confidence = calibrated.value;
      appliedFields.push(field);
    } else {
      snapshot.confidence = normalizeConfidence(snapshot.confidence);
    }
  }

  return metadata;
}

function collectConfidenceValues(
  classification: ClassificationLike,
  fieldNames: readonly string[],
): number[] {
  return fieldNames
    .map((field) => {
      const value = classification[field];
      if (!value || typeof value !== "object" || !("confidence" in value))
        return null;
      return normalizeConfidence((value as FieldSnapshot).confidence);
    })
    .filter((value): value is number => value !== null);
}

export function computeConfidenceSummary(
  classification: ClassificationLike,
  calibrationMetadata?: CalibrationMetadata,
): {
  overallConfidence: number;
  weakestSemantic: number;
  needsReview: boolean;
  reviewReasons: string[];
  calibrationMetadata: CalibrationMetadata;
} {
  const fieldConfidences = collectConfidenceValues(
    classification,
    CLASSIFIER_CONFIDENCE_SUMMARY_FIELDS,
  );
  const rawAverage =
    fieldConfidences.length > 0
      ? fieldConfidences.reduce((sum, value) => sum + value, 0) /
        fieldConfidences.length
      : 0;

  const profile = loadCalibrationProfile();
  const overallCalibration = calibrateFromProfile(
    rawAverage,
    profile?.overall,
    {
      minProfileSampleSize: MIN_OVERALL_PROFILE_SAMPLE_SIZE,
      minBandSampleSize: MIN_OVERALL_BAND_SAMPLE_SIZE,
    },
  );
  const overallDataBacking = hasSufficientCalibrationData(
    profile?.overall,
    {
      minProfileSampleSize: MIN_OVERALL_PROFILE_SAMPLE_SIZE,
      minBandSampleSize: MIN_OVERALL_BAND_SAMPLE_SIZE,
    },
    rawAverage,
  );
  const overallConfidence = round2(
    overallCalibration.sampleSize > 0 ? overallCalibration.value : rawAverage,
  );

  const semanticCoverage: SemanticCoverageEntry[] = [];
  for (const field of CLASSIFIER_SEMANTIC_CONFIDENCE_FIELDS) {
    const value = classification[field];
    if (!value || typeof value !== "object" || !("confidence" in value)) {
      continue;
    }
    const confidence = normalizeConfidence((value as FieldSnapshot).confidence);
    const coverage = hasSufficientCalibrationData(
      profile?.fields[field],
      {
        minProfileSampleSize: MIN_FIELD_PROFILE_SAMPLE_SIZE,
        minBandSampleSize: MIN_FIELD_BAND_SAMPLE_SIZE,
      },
      confidence,
    );
    semanticCoverage.push({
      field,
      confidence,
      sampleSize: coverage.sampleSize,
      dataBacked: coverage.ok,
    });
  }
  const semanticConfidences = semanticCoverage.map((item) => item.confidence);
  const weakestSemantic =
    semanticConfidences.length > 0 ? Math.min(...semanticConfidences) : 0;
  const uncalibratedSemanticFields = semanticCoverage
    .filter((item) => !item.dataBacked)
    .map((item) => item.field);

  const reviewReasons: string[] = [];
  if (overallConfidence < CLASSIFIER_REVIEW_OVERALL_THRESHOLD) {
    reviewReasons.push(
      `overallConfidence ${overallConfidence.toFixed(2)} below ${CLASSIFIER_REVIEW_OVERALL_THRESHOLD.toFixed(2)}`,
    );
  }
  if (weakestSemantic < CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD) {
    reviewReasons.push(
      `weakestSemantic ${weakestSemantic.toFixed(2)} below ${CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD.toFixed(2)}`,
    );
  }
  if (CLASSIFIER_ENABLE_CONFIDENCE_CALIBRATION && !overallDataBacking.ok) {
    const reviewed = overallDataBacking.sampleSize;
    const needed = MIN_OVERALL_PROFILE_SAMPLE_SIZE;
    reviewReasons.push(
      `[info] Confidence not calibrated — ${reviewed} of ${needed} human-reviewed entries completed. Approve ${needed - reviewed} more entries to enable data-backed calibration. Until then, scores are raw model confidence.`,
    );
  }
  if (uncalibratedSemanticFields.length > 0) {
    reviewReasons.push(
      `[info] Semantic calibration gaps — ${uncalibratedSemanticFields.join(", ")} still lack field-level data backing at this confidence band.`,
    );
  }

  return {
    overallConfidence,
    weakestSemantic,
    needsReview:
      overallConfidence < CLASSIFIER_REVIEW_OVERALL_THRESHOLD ||
      weakestSemantic < CLASSIFIER_REVIEW_SEMANTIC_THRESHOLD,
    reviewReasons,
    calibrationMetadata: {
      ...(calibrationMetadata || {
        enabled: Boolean(profile),
        path: CLASSIFIER_CONFIDENCE_CALIBRATION_PATH,
        profileVersion: profile?.version,
        appliedFields: [],
        dataBacked: false,
      }),
      dataBacked: overallDataBacking.ok,
      minimumSampleSize: MIN_OVERALL_PROFILE_SAMPLE_SIZE,
      actualSampleSize: overallDataBacking.sampleSize,
      uncalibratedSemanticFields,
      semanticFieldCoverage: semanticCoverage,
      overall: {
        raw: round2(rawAverage),
        calibrated: overallConfidence,
        sampleSize: overallCalibration.sampleSize,
        dataBacked: overallDataBacking.ok,
      },
    },
  };
}
