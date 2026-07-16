#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();
import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { loadJson, getArgValue } from "./_shared/scriptUtils.js";

const fixtureCount = Number(getArgValue("--count") || 12);
const outputPath =
  getArgValue("--out") || "tests/synthetic-research-fixtures.json";
const modelName =
  getArgValue("--model") ||
  process.env.GEMINI_SUBJECTIVE_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-3.1-pro-preview";

type HistoryEntry = {
  title: string;
  url: string;
  fields: Record<string, { value: unknown; confidence: number }>;
};

type Correction = {
  entryId: string;
  title: string;
  url: string;
  notes?: string;
  contentType?: string;
  fields: Record<string, unknown>;
};

const FixtureSchema = z.object({
  fixtures: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      focusFields: z.array(z.string()),
      rationale: z.string(),
      input: z.object({
        title: z.string(),
        contentType: z.string(),
        slug: z.string(),
        textSnippet: z.string(),
      }),
      expected: z.object({
        topic: z.array(z.string()).optional(),
        audience: z.array(z.string()).optional(),
        jobLevel: z.array(z.string()).optional(),
        jobFunction: z.array(z.string()).optional(),
        useCases: z.array(z.string()).optional(),
        funnelStage: z.string().optional(),
        industry: z.array(z.string()).optional(),
        product: z.array(z.string()).optional(),
        assetSubType: z.array(z.string()).optional(),
        schemaType: z.string().optional(),
      }),
    }),
  ),
});

type HardestField = {
  field: string;
  exactAccuracy: number;
  sampleSize: number;
};

function loadCorrections(): Record<string, Correction> {
  const seed =
    loadJson<Record<string, Correction>>("seeds/feedback-corrections.json") ??
    {};
  const cache =
    loadJson<Record<string, Correction>>(".cache/feedback-corrections.json") ??
    {};
  const merged: Record<string, Correction> = {};
  for (const [key, value] of Object.entries({ ...seed, ...cache })) {
    if (value && typeof value === "object" && "entryId" in value) {
      merged[key] = value;
    }
  }
  return merged;
}

function summarizeSeenLabels(
  corrections: Record<string, Correction>,
  history: Record<string, HistoryEntry>,
): Record<string, string[]> {
  const out = new Map<string, Set<string>>();
  const push = (field: string, rawValue: unknown) => {
    const set = out.get(field) ?? new Set<string>();
    for (const value of Array.isArray(rawValue) ? rawValue : [rawValue]) {
      const stringValue = String(value ?? "").trim();
      if (stringValue) set.add(stringValue);
    }
    out.set(field, set);
  };

  for (const correction of Object.values(corrections)) {
    for (const [field, value] of Object.entries(correction.fields)) {
      push(field, value);
    }
  }
  for (const historyEntry of Object.values(history)) {
    for (const [field, value] of Object.entries(historyEntry.fields || {})) {
      push(field, value?.value);
    }
  }

  return Object.fromEntries(
    Array.from(out.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([field, values]) => [field, Array.from(values).sort()]),
  );
}

function fallbackValues(
  seenLabels: Record<string, string[]>,
  field: string,
  fallback: string[],
): string[] {
  return seenLabels[field]?.length ? seenLabels[field] : fallback;
}

function buildFallbackFixtures(
  count: number,
  hardestFields: HardestField[],
  seenLabels: Record<string, string[]>,
) {
  const topicPool = fallbackValues(seenLabels, "topic", ["Headless CMS"]);
  const audiencePool = fallbackValues(seenLabels, "audience", ["Prospect"]);
  const funnelPool = fallbackValues(seenLabels, "funnelStage", [
    "Awareness (TOFU)",
    "Consideration (MOFU)",
  ]);
  const industryPool = fallbackValues(seenLabels, "industry", [
    "General business",
  ]);
  const productPool = fallbackValues(seenLabels, "product", [
    "Contentful Platform",
  ]);
  const jobFunctionPool = fallbackValues(seenLabels, "jobFunction", [
    "Marketing",
  ]);
  const jobLevelPool = fallbackValues(seenLabels, "jobLevel", ["Manager"]);
  const useCasePool = fallbackValues(seenLabels, "useCases", [
    "Personalization",
  ]);

  const templates = [
    () => ({
      description: "Broad educational guide with cross-industry examples",
      focusFields: hardestFields.slice(0, 3).map((field) => field.field),
      rationale:
        "Tests whether broad educational content stays general instead of being overfit to one vertical or buyer persona.",
      input: {
        title: `What is ${topicPool[0]}? A practical guide for modern teams`,
        contentType: "pageLongFormSeo",
        slug: "/guides/what-is-modern-content-operations",
        textSnippet: `Modern teams use ${topicPool[0]} patterns to ship content across websites, apps, and campaigns. This guide explains the underlying concepts, architectural tradeoffs, and governance decisions without assuming one specific industry or buyer segment. It references examples from retail, media, and SaaS, but stays focused on broad educational advice for teams building digital experiences.`,
      },
      expected: {
        topic: [topicPool[0]],
        audience: [audiencePool[0]],
        funnelStage: funnelPool.includes("Awareness (TOFU)")
          ? "Awareness (TOFU)"
          : funnelPool[0],
        industry: [industryPool[0]],
      },
    }),
    () => ({
      description:
        "Developer-adjacent educational page with product temptation",
      focusFields: hardestFields.slice(0, 3).map((field) => field.field),
      rationale:
        "Tests whether the classifier keeps a page TOFU and engineering-oriented even when the product is mentioned.",
      input: {
        title: "API-first content modeling patterns for frontend teams",
        contentType: "pageLongFormSeo",
        slug: "/guides/api-first-content-modeling",
        textSnippet: `Frontend and platform teams often adopt API-first content modeling to support reusable content structures across channels. This article explains schema design, governance, and collaboration patterns. It mentions ${productPool[0]} as one example platform, but the page is primarily an educational guide for engineering teams evaluating architectural patterns rather than a sales page.`,
      },
      expected: {
        topic: [topicPool[0]],
        audience: [audiencePool[0]],
        jobFunction: [jobFunctionPool[0]],
        jobLevel: [jobLevelPool[0]],
        funnelStage: funnelPool.includes("Awareness (TOFU)")
          ? "Awareness (TOFU)"
          : funnelPool[0],
      },
    }),
    () => ({
      description: "Cross-functional playbook with mild commercial intent",
      focusFields: hardestFields.slice(0, 3).map((field) => field.field),
      rationale:
        "Tests the boundary between awareness and consideration for a practical playbook page.",
      input: {
        title:
          "How enterprise teams operationalize personalization across channels",
        contentType: "pageLongFormSeo",
        slug: "/guides/operationalizing-personalization",
        textSnippet: `Enterprise teams rolling out personalization need audience governance, experimentation workflows, and reusable content models. This playbook covers process design, measurement, and collaboration across marketing, product, and engineering. It includes implementation checkpoints and a short CTA inviting readers to explore platform options if they want to operationalize ${useCasePool[0].toLowerCase()} faster.`,
      },
      expected: {
        useCases: [useCasePool[0]],
        audience: [audiencePool[0]],
        funnelStage: funnelPool.includes("Consideration (MOFU)")
          ? "Consideration (MOFU)"
          : funnelPool[0],
        industry: [industryPool[0]],
      },
    }),
    () => ({
      description: "Generic business case page with no specialist vertical",
      focusFields: ["industry", "audience", "funnelStage"],
      rationale:
        "Tests whether intentionally broad business content stays in the general bucket instead of being forced into a vertical.",
      input: {
        title:
          "Building a business case for composable digital experience platforms",
        contentType: "pageLongFormSeo",
        slug: "/guides/business-case-composable-dxp",
        textSnippet: `This guide helps digital leaders build the internal business case for composable architecture. It covers governance, ROI framing, team workflows, and rollout sequencing. The page is aimed at broad cross-industry decision-makers and does not anchor itself in retail, financial services, healthcare, or another specific vertical.`,
      },
      expected: {
        audience: [audiencePool[0]],
        industry: [industryPool[0]],
        funnelStage: funnelPool.includes("Awareness (TOFU)")
          ? "Awareness (TOFU)"
          : funnelPool[0],
      },
    }),
  ];

  return Array.from({ length: count }, (_, index) => {
    const template = templates[index % templates.length]();
    return {
      id: `synthetic-${String(index + 1).padStart(3, "0")}`,
      ...template,
    };
  });
}

async function main() {
  const corrections = loadCorrections();
  const history =
    loadJson<Record<string, HistoryEntry>>(
      ".cache/classification-history.json",
    ) ?? {};
  const calibration = loadJson<Record<string, unknown>>("seeds/confidence-calibration.json");

  const hardestFields = Object.entries((calibration?.fields ?? {}) as Record<string, Record<string, unknown>>)
    .map(([field, stats]) => ({
      field,
      exactAccuracy: Number(stats?.exactAccuracy || 0),
      sampleSize: Number(stats?.sampleSize || 0),
    }))
    .filter((field) => field.sampleSize > 0)
    .sort((left, right) => left.exactAccuracy - right.exactAccuracy)
    .slice(0, 6);

  const correctionExamples = Object.values(corrections)
    .slice(0, 8)
    .map((correction) => ({
      title: correction.title,
      url: correction.url,
      contentType: correction.contentType || "page",
      notes: correction.notes || "",
      fields: correction.fields,
    }));

  const seenLabels = summarizeSeenLabels(corrections, history);

  const prompt = `
You are generating synthetic but realistic edge-case fixtures for a Contentful taxonomy classifier.

Purpose:
- create hard evaluation cases for taxonomy research
- stress ambiguous boundaries in the labeling system
- do NOT invent impossible product marketing pages
- do NOT generate nonsense filler
- these fixtures are secondary research assets, not runtime truth

Requirements:
- generate exactly ${fixtureCount} fixtures
- each fixture must feel like a plausible B2B SaaS content page
- prioritize ambiguity in these fields:
${hardestFields.map((field) => `  - ${field.field} (observed exact accuracy ${(field.exactAccuracy * 100).toFixed(1)}%)`).join("\n") || "  - topic\n  - audience\n  - funnelStage"}
- make snippets realistic enough that a human content strategist would recognize them
- include a mix of:
  - broad educational pages
  - cross-industry pages
  - persona-targeted pages
  - product-adjacent but still top-of-funnel pages
  - edge cases where multiple labels look tempting
- expected labels must only use labels already seen in this system
- keep the expected object partial; only include fields that are central to the ambiguity

Seen labels by field:
${JSON.stringify(seenLabels, null, 2)}

Representative human-corrected examples:
${JSON.stringify(correctionExamples, null, 2)}
`;

  let method = "synthetic-research-v1";
  // eslint-disable-next-line no-useless-assignment
  let fixtures: Array<z.infer<typeof FixtureSchema>["fixtures"][number]> = [];

  try {
    const result = await generateObject({
      model: google(modelName),
      schema: FixtureSchema,
      prompt,
    });
    fixtures = result.object.fixtures;
  } catch (error) {
    method = "synthetic-research-v1-fallback";
    fixtures = buildFallbackFixtures(fixtureCount, hardestFields, seenLabels);
    console.warn(
      `[SyntheticResearch] Falling back to template generation: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const outFile = path.resolve(outputPath);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        model: modelName,
        method,
        note: "Synthetic fixtures support edge-case research and evaluation only. They do not replace human-corrected ground truth.",
        hardestFields,
        fixtures,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(
    JSON.stringify(
      {
        output: outFile,
        fixtures: fixtures.length,
        model: modelName,
        method,
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
