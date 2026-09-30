#!/usr/bin/env tsx
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { getArgValue } from "./_shared/scriptUtils.js";

type SyntheticFixtureFile = {
  fixtures: Array<{
    id: string;
    description: string;
    focusFields: string[];
    input: {
      title: string;
      contentType: string;
      slug: string;
      textSnippet: string;
    };
    expected: Record<string, unknown>;
  }>;
};

const inputPath =
  getArgValue("--in") || "tests/synthetic-research-fixtures.json";
const limit = Number(getArgValue("--limit") || 0);

function normalize(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).sort().join(" | ");
  return String(value ?? "").trim();
}

async function main() {
  const raw = JSON.parse(
    fs.readFileSync(path.resolve(inputPath), "utf-8"),
  ) as SyntheticFixtureFile;
  const failures: Array<{
    fixture: string;
    field: string;
    expected: string;
    actual: string;
    confidence: number;
  }> = [];
  let checks = 0;
  let passes = 0;

  const fixtures =
    limit > 0 ? (raw.fixtures || []).slice(0, limit) : raw.fixtures || [];

  for (const fixture of fixtures) {
    const result = await classifyContent({
      asset: {
        id: fixture.id,
        title: fixture.input.title,
        contentType: fixture.input.contentType,
        slug: fixture.input.slug,
        textContent: fixture.input.textSnippet,
      },
      skipCache: true,
    });

    for (const [field, expectedValue] of Object.entries(
      fixture.expected || {},
    )) {
      const actualField = (result as unknown as Record<string, { value?: unknown; confidence?: number } | null | undefined>)[field];
      if (!actualField || typeof actualField !== "object") continue;
      checks++;
      const expected = normalize(expectedValue);
      const actual = normalize(actualField.value);
      if (expected === actual) {
        passes++;
      } else {
        failures.push({
          fixture: fixture.id,
          field,
          expected,
          actual,
          confidence: Number(actualField.confidence || 0),
        });
      }
    }
  }

  const accuracy = checks > 0 ? passes / checks : 0;
  console.log(
    JSON.stringify(
      {
        dataset: path.resolve(inputPath),
        fixtures: fixtures.length,
        checks,
        passes,
        accuracy: Math.round(accuracy * 10000) / 10000,
        failures: failures.slice(0, 25),
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
