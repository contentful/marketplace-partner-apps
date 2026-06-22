#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();
import * as fs from "fs";
import * as path from "path";
import { loadJson, getArgValue } from "./_shared/scriptUtils.js";

type HistoryEntry = {
  entryId: string;
  title: string;
  url: string;
  classifiedAt: string;
  overallConfidence: number;
  needsReview: boolean;
  fields: Record<string, { value: unknown; confidence: number }>;
};

type Correction = {
  entryId: string;
  title: string;
  url: string;
  correctedAt: string;
  fields: Record<string, unknown>;
};

type CalibrationBand = {
  min: number;
  max: number;
  sampleSize: number;
  matches: number;
  rawMean: number;
  empiricalAccuracy: number;
  smoothedAccuracy: number;
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
  overall: {
    sampleSize: number;
    exactAccuracy: number;
    averageRawConfidence: number;
    bands: CalibrationBand[];
  };
  fields: Record<
    string,
    {
      sampleSize: number;
      exactAccuracy: number;
      averageRawConfidence: number;
      bands: CalibrationBand[];
    }
  >;
};

const outputPath = getArgValue("--out") || "seeds/confidence-calibration.json";
const bandCount = Number(getArgValue("--bands") || 5);
const priorWeight = Number(getArgValue("--prior-weight") || 3);

const HISTORY_FILE = path.resolve(".cache/classification-history.json");
const CACHE_FB_FILE = path.resolve(".cache/feedback-corrections.json");
const SEED_FB_FILE = path.resolve("seeds/feedback-corrections.json");

function normalizeConfidence(value: number | undefined): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  if (numeric > 1) return Math.max(0, Math.min(1, numeric / 100));
  return Math.max(0, Math.min(1, numeric));
}

function normalizeValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).sort().join(" | ");
  return String(value ?? "").trim();
}

function exactMatch(ai: unknown, human: unknown): boolean {
  return normalizeValue(ai) === normalizeValue(human);
}

function loadCorrections(): Record<string, Correction> {
  const seed = loadJson<Record<string, Correction>>(SEED_FB_FILE) ?? {};
  const cache = loadJson<Record<string, Correction>>(CACHE_FB_FILE) ?? {};
  const merged: Record<string, Correction> = {};
  for (const [key, value] of Object.entries({ ...seed, ...cache })) {
    if (value && typeof value === "object" && "entryId" in value) {
      merged[key] = value;
    }
  }
  return merged;
}

function buildBands(
  samples: Array<{ rawConfidence: number; correct: boolean }>,
): CalibrationBand[] {
  if (samples.length === 0) return [];
  const width = 1 / bandCount;
  const overallExact =
    samples.filter((sample) => sample.correct).length / samples.length;
  const bands: CalibrationBand[] = [];

  for (let index = 0; index < bandCount; index++) {
    const min = Number((index * width).toFixed(6));
    const max = Number(
      (index === bandCount - 1 ? 1 : (index + 1) * width).toFixed(6),
    );
    const inBand = samples.filter((sample) =>
      index === bandCount - 1
        ? sample.rawConfidence >= min && sample.rawConfidence <= max
        : sample.rawConfidence >= min && sample.rawConfidence < max,
    );

    const sampleSize = inBand.length;
    const matches = inBand.filter((sample) => sample.correct).length;
    const rawMean =
      sampleSize > 0
        ? inBand.reduce((sum, sample) => sum + sample.rawConfidence, 0) /
          sampleSize
        : (min + max) / 2;
    const empiricalAccuracy =
      sampleSize > 0 ? matches / sampleSize : overallExact;
    const smoothedAccuracy =
      sampleSize > 0
        ? (matches + priorWeight * overallExact) / (sampleSize + priorWeight)
        : overallExact;

    bands.push({
      min,
      max,
      sampleSize,
      matches,
      rawMean: Math.round(rawMean * 10000) / 10000,
      empiricalAccuracy: Math.round(empiricalAccuracy * 10000) / 10000,
      smoothedAccuracy: Math.round(smoothedAccuracy * 10000) / 10000,
    });
  }

  // Enforce monotonicity so higher raw confidence never calibrates downward below a lower band.
  for (let index = 1; index < bands.length; index++) {
    bands[index].smoothedAccuracy = Math.max(
      bands[index - 1].smoothedAccuracy,
      bands[index].smoothedAccuracy,
    );
  }

  return bands;
}

async function main() {
  const corrections = loadCorrections();
  const history = loadJson<Record<string, HistoryEntry>>(HISTORY_FILE) ?? {};
  const overlap = Object.entries(corrections)
    .filter(([entryId]) => history[entryId])
    .map(([entryId, correction]) => ({
      entryId,
      correction,
      history: history[entryId],
    }));

  if (overlap.length === 0) {
    throw new Error(
      "No overlap between classification history and human corrections.",
    );
  }

  const fieldSamples = new Map<
    string,
    Array<{ rawConfidence: number; correct: boolean }>
  >();
  const overallSamples: Array<{ rawConfidence: number; correct: boolean }> = [];

  for (const { correction, history: hist } of overlap) {
    let fieldsCompared = 0;
    let fieldsCorrect = 0;

    for (const [field, humanValue] of Object.entries(correction.fields)) {
      const snapshot = hist.fields[field];
      if (!snapshot) continue;

      const rawConfidence = normalizeConfidence(snapshot.confidence);
      const correct = exactMatch(snapshot.value, humanValue);
      const samples = fieldSamples.get(field) ?? [];
      samples.push({ rawConfidence, correct });
      fieldSamples.set(field, samples);

      fieldsCompared++;
      if (correct) fieldsCorrect++;
    }

    if (fieldsCompared > 0) {
      overallSamples.push({
        rawConfidence: normalizeConfidence(hist.overallConfidence),
        correct: fieldsCorrect === fieldsCompared,
      });
    }
  }

  const fields = Object.fromEntries(
    Array.from(fieldSamples.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([field, samples]) => {
        const sampleSize = samples.length;
        const exactAccuracy =
          sampleSize > 0
            ? samples.filter((sample) => sample.correct).length / sampleSize
            : 0;
        const averageRawConfidence =
          sampleSize > 0
            ? samples.reduce((sum, sample) => sum + sample.rawConfidence, 0) /
              sampleSize
            : 0;
        return [
          field,
          {
            sampleSize,
            exactAccuracy: Math.round(exactAccuracy * 10000) / 10000,
            averageRawConfidence:
              Math.round(averageRawConfidence * 10000) / 10000,
            bands: buildBands(samples),
          },
        ];
      }),
  );

  const overallExactAccuracy =
    overallSamples.length > 0
      ? overallSamples.filter((sample) => sample.correct).length /
        overallSamples.length
      : 0;
  const overallAverageRawConfidence =
    overallSamples.length > 0
      ? overallSamples.reduce((sum, sample) => sum + sample.rawConfidence, 0) /
        overallSamples.length
      : 0;

  const profile: CalibrationProfile = {
    version: "2026-03-16-calibration-v1",
    generatedAt: new Date().toISOString(),
    source: {
      historyEntries: Object.keys(history).length,
      correctionEntries: Object.keys(corrections).length,
      overlapEntries: overlap.length,
      bandCount,
      priorWeight,
    },
    overall: {
      sampleSize: overallSamples.length,
      exactAccuracy: Math.round(overallExactAccuracy * 10000) / 10000,
      averageRawConfidence:
        Math.round(overallAverageRawConfidence * 10000) / 10000,
      bands: buildBands(overallSamples),
    },
    fields,
  };

  const outFile = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(profile, null, 2), "utf-8");

  console.log(
    JSON.stringify(
      {
        output: outFile,
        generatedAt: profile.generatedAt,
        overlapEntries: overlap.length,
        fields: Object.keys(fields).length,
        overallExactAccuracy: profile.overall.exactAccuracy,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
