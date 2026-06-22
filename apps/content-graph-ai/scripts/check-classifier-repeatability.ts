#!/usr/bin/env tsx
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
dotenvConfig({ path: ".env.production.local", override: false });

import * as fs from "fs";
import * as path from "path";
import { CLASSIFIER_PROMPT_VERSION } from "../api/_shared/config/classifierPipeline.js";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { extractContentSignals } from "../api/_shared/utils/contentSignals.js";

type ClassifierFixture = {
  id: string;
  description: string;
  input: {
    entryId: string;
    title: string;
    contentType: string;
    slug: string;
    textSnippet: string;
  };
};

type FieldName = (typeof FIELD_NAMES)[number];
type FieldSnapshot = Record<string, unknown>;
type FieldStats = Record<
  FieldName,
  {
    uniqueValues: number;
    variants: Array<{ count: number; value: unknown }>;
  }
>;

const FIXTURE_FILE = path.resolve("tests/classifier-fixtures.json");
const FIELD_NAMES = [
  "assetType",
  "assetSubType",
  "schemaType",
  "product",
  "jobLevel",
  "jobFunction",
  "audience",
  "topic",
  "useCases",
  "funnelStage",
  "industry",
  "companySize",
  "region",
  "language",
  "usageRights",
  "yearPublished",
  "competitivePositioning",
  "needsReview",
] as const;

function getArgValue(flag: string): string | undefined {
  const argv = process.argv.slice(2);
  const index = argv.indexOf(flag);
  return index >= 0 ? argv[index + 1] : undefined;
}

function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

function hasLiveModelCredentials(): boolean {
  return Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GOOGLE_VERTEX_PROJECT,
  );
}

function parseArgs() {
  const runs = Number(getArgValue("--runs") || 3);
  if (!Number.isFinite(runs) || runs < 2) {
    throw new Error("--runs must be an integer >= 2");
  }

  return {
    runs,
    fixtureFilter: getArgValue("--fixture"),
    allowUnstable: hasFlag("--allow-unstable"),
  };
}

function loadFixtures(): ClassifierFixture[] {
  const raw = JSON.parse(fs.readFileSync(FIXTURE_FILE, "utf-8"));
  if (!Array.isArray(raw)) {
    throw new Error(`Expected ${FIXTURE_FILE} to contain a JSON array.`);
  }
  return raw as ClassifierFixture[];
}

function sortUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return [...value]
      .map(sortUnknown)
      .sort((left, right) =>
        JSON.stringify(left).localeCompare(JSON.stringify(right)),
      );
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );
    return Object.fromEntries(
      entries.map(([key, inner]) => [key, sortUnknown(inner)]),
    );
  }
  return value;
}

function snapshotClassification(
  result: Awaited<ReturnType<typeof classifyContent>>,
): FieldSnapshot {
  return Object.fromEntries(
    FIELD_NAMES.map((field) => {
      if (field === "competitivePositioning") {
        return [field, sortUnknown(result.competitivePositioning)];
      }
      if (field === "needsReview") {
        return [field, Boolean(result.needsReview)];
      }
      const entry = result[field];
      if (entry && typeof entry === "object" && "value" in entry) {
        return [field, sortUnknown(entry.value)];
      }
      return [field, null];
    }),
  );
}

function buildFieldStats(runSnapshots: FieldSnapshot[]): FieldStats {
  return Object.fromEntries(
    FIELD_NAMES.map((field) => {
      const counts = new Map<string, number>();
      for (const snapshot of runSnapshots) {
        const key = JSON.stringify(snapshot[field]);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
      return [
        field,
        {
          uniqueValues: counts.size,
          variants: Array.from(counts.entries()).map(([value, count]) => ({
            count,
            value: JSON.parse(value),
          })),
        },
      ];
    }),
  ) as FieldStats;
}

async function runFixtureRepeatability(
  fixture: ClassifierFixture,
  runs: number,
) {
  const runSnapshots: FieldSnapshot[] = [];
  for (let runIndex = 0; runIndex < runs; runIndex += 1) {
    const signals = extractContentSignals(
      fixture.input.slug,
      fixture.input.title,
      fixture.input.textSnippet,
    );
    const result = await classifyContent({
      asset: {
        id: `${fixture.input.entryId}-repeatability`,
        title: fixture.input.title,
        contentType: fixture.input.contentType,
        textContent: fixture.input.textSnippet,
        slug: fixture.input.slug,
      },
      signals,
      executionMode: "interactive",
      disableDynamicFewShot: true,
      skipCache: true,
    });
    runSnapshots.push(snapshotClassification(result));
  }

  const fieldStats = buildFieldStats(runSnapshots);
  const unstableFields = FIELD_NAMES.filter(
    (field) => fieldStats[field].uniqueValues > 1,
  );

  return {
    fixtureId: fixture.id,
    description: fixture.description,
    runs,
    unstableFields,
    fieldStats,
  };
}

function printSkipped(reason: string) {
  console.log(
    JSON.stringify(
      {
        skipped: true,
        reason,
        promptVersion: CLASSIFIER_PROMPT_VERSION,
      },
      null,
      2,
    ),
  );
}

async function main() {
  const { runs, fixtureFilter, allowUnstable } = parseArgs();

  if (!hasLiveModelCredentials()) {
    printSkipped(
      "No Gemini or Vertex credentials found. Set GOOGLE_GENERATIVE_AI_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY, or GOOGLE_VERTEX_PROJECT to run repeatability checks.",
    );
    return;
  }

  const fixtures = loadFixtures().filter(
    (fixture) => !fixtureFilter || fixture.id === fixtureFilter,
  );
  if (fixtures.length === 0) {
    throw new Error(
      fixtureFilter
        ? `No fixture found for --fixture=${fixtureFilter}`
        : "No fixtures found.",
    );
  }

  const summary = [];
  let unstableFixtureCount = 0;

  for (const fixture of fixtures) {
    const fixtureSummary = await runFixtureRepeatability(fixture, runs);
    if (fixtureSummary.unstableFields.length > 0) unstableFixtureCount += 1;
    summary.push(fixtureSummary);
  }

  console.log(
    JSON.stringify(
      {
        promptVersion: CLASSIFIER_PROMPT_VERSION,
        runs,
        fixtures: summary,
        unstableFixtureCount,
        passed: unstableFixtureCount === 0,
      },
      null,
      2,
    ),
  );

  if (!allowUnstable && unstableFixtureCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
