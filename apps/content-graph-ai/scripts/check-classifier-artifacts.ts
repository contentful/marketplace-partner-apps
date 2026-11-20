#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { CONFIDENCE_CALIBRATION_MINIMUMS } from "../api/_shared/config/classifierPolicy.js";
import { CLASSIFIER_CONFIDENCE_CALIBRATION_PATH } from "../api/_shared/config/classifierPipeline.js";

type Fixture = {
  id: string;
  description: string;
  expected?: Record<string, { value: unknown; confidence?: number }>;
  expectedSignals?: Record<string, unknown>;
  recordedAt?: string;
};

type CalibrationBand = {
  min: number;
  max: number;
  sampleSize: number;
  matches: number;
  smoothedAccuracy: number;
};

type FieldCalibrationProfile = {
  sampleSize: number;
  exactAccuracy: number;
  averageRawConfidence: number;
  bands: CalibrationBand[];
};

type CalibrationProfile = {
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

type CorrectionEntry = {
  entryId: string;
  correctedAt?: string;
  fields?: Record<string, unknown>;
};

const FIXTURE_FILE = path.resolve("tests/classifier-fixtures.json");
const CORRECTION_FILE = path.resolve("seeds/feedback-corrections.json");
const CALIBRATION_FILE = path.resolve(CLASSIFIER_CONFIDENCE_CALIBRATION_PATH);

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
}

function toTimestamp(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validateBands(
  label: string,
  bands: CalibrationBand[],
  failures: string[],
): void {
  for (let index = 0; index < bands.length; index++) {
    const band = bands[index];
    if (!(band.min >= 0 && band.max <= 1 && band.min <= band.max)) {
      failures.push(`${label}: invalid band range ${band.min}-${band.max}`);
    }
    if (
      band.sampleSize < 0 ||
      band.matches < 0 ||
      band.matches > band.sampleSize
    ) {
      failures.push(
        `${label}: invalid sample/match counts (${band.sampleSize}/${band.matches})`,
      );
    }
    if (
      index > 0 &&
      Number(bands[index - 1].smoothedAccuracy) > Number(band.smoothedAccuracy)
    ) {
      failures.push(`${label}: smoothedAccuracy is not monotonic`);
    }
  }
}

function main() {
  const failures: string[] = [];

  if (!fs.existsSync(FIXTURE_FILE)) {
    throw new Error(`Missing classifier fixture file: ${FIXTURE_FILE}`);
  }
  if (!fs.existsSync(CALIBRATION_FILE)) {
    throw new Error(`Missing calibration file: ${CALIBRATION_FILE}`);
  }

  const fixtures = readJson<Fixture[]>(FIXTURE_FILE);
  const calibration = readJson<CalibrationProfile>(CALIBRATION_FILE);
  const correctionRaw =
    readJson<Record<string, CorrectionEntry | string>>(CORRECTION_FILE);
  const corrections = Object.values(correctionRaw).filter(
    (entry): entry is CorrectionEntry =>
      typeof entry === "object" && entry !== null && "entryId" in entry,
  );

  if (!Array.isArray(fixtures) || fixtures.length === 0) {
    failures.push("classifier fixtures must be a non-empty array");
  }

  const fieldCoverage = new Map<string, number>();
  let signalFixtures = 0;
  let recordedFixtures = 0;
  for (const fixture of fixtures) {
    if (!fixture.id || !fixture.description) {
      failures.push("fixture missing id or description");
      continue;
    }
    if (!fixture.expected || Object.keys(fixture.expected).length === 0) {
      failures.push(`${fixture.id}: expected output block is empty`);
    }
    if (fixture.expectedSignals) signalFixtures++;
    if (fixture.recordedAt) {
      recordedFixtures++;
      if (toTimestamp(fixture.recordedAt) === null) {
        failures.push(`${fixture.id}: recordedAt is not a valid ISO timestamp`);
      }
    }
    for (const field of Object.keys(fixture.expected || {})) {
      fieldCoverage.set(field, (fieldCoverage.get(field) || 0) + 1);
    }
  }

  const generatedAt = toTimestamp(calibration.generatedAt);
  if (!calibration.version)
    failures.push("calibration profile missing version");
  if (generatedAt === null) {
    failures.push("calibration profile generatedAt is invalid");
  }
  if (!calibration.source) {
    failures.push("calibration profile missing source metadata");
  } else {
    if (calibration.source.bandCount <= 0) {
      failures.push("calibration source bandCount must be > 0");
    }
    if (calibration.source.overlapEntries <= 0) {
      failures.push("calibration source overlapEntries must be > 0");
    }
    if (
      calibration.source.overlapEntries > calibration.source.historyEntries ||
      calibration.source.overlapEntries > calibration.source.correctionEntries
    ) {
      failures.push("calibration overlapEntries exceeds source counts");
    }
  }

  if (!calibration.overall) {
    failures.push("calibration profile missing overall section");
  } else {
    validateBands("overall", calibration.overall.bands, failures);
  }

  for (const [field, profile] of Object.entries(calibration.fields || {})) {
    if (!Number.isFinite(profile.sampleSize) || profile.sampleSize < 0) {
      failures.push(`${field}: invalid sampleSize`);
    }
    if (
      !Number.isFinite(profile.exactAccuracy) ||
      profile.exactAccuracy < 0 ||
      profile.exactAccuracy > 1
    ) {
      failures.push(`${field}: invalid exactAccuracy`);
    }
    validateBands(`field:${field}`, profile.bands, failures);
  }

  const newestCorrection = corrections.reduce<number>(
    (latest, correction) =>
      Math.max(latest, toTimestamp(correction.correctedAt) || 0),
    0,
  );
  if (generatedAt !== null && newestCorrection > generatedAt) {
    failures.push(
      "calibration profile is stale relative to committed human corrections",
    );
  }

  const summary = {
    fixtures: {
      total: fixtures.length,
      withSignals: signalFixtures,
      withRecordedAt: recordedFixtures,
      fieldCoverage: Object.fromEntries(
        Array.from(fieldCoverage.entries()).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      ),
    },
    corrections: {
      total: corrections.length,
      newestCorrectedAt:
        newestCorrection > 0 ? new Date(newestCorrection).toISOString() : null,
    },
    calibration: {
      path: CALIBRATION_FILE,
      version: calibration.version,
      generatedAt: calibration.generatedAt,
      overlapEntries: calibration.source?.overlapEntries ?? 0,
      fieldCount: Object.keys(calibration.fields || {}).length,
      overallSampleSize: calibration.overall?.sampleSize ?? 0,
      minimums: CONFIDENCE_CALIBRATION_MINIMUMS,
    },
    failures,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

main();
