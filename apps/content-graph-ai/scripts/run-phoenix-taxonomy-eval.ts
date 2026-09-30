#!/usr/bin/env tsx

import { setupEnv } from "./_shared/env.js";
setupEnv();
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@arizeai/phoenix-client";
import { createOrGetDataset } from "@arizeai/phoenix-client/datasets";
import {
  asExperimentEvaluator,
  runExperiment,
} from "@arizeai/phoenix-client/experiments";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { getStaticAllowedTaxonomyLabels } from "../api/_shared/config/taxonomyDefinition.js";
import { CHILD_TO_PAGE_MAP } from "../api/_shared/config/contentTypeProfiles.js";
import {
  RecursiveContentCrawler,
  crawlViaCda,
} from "../api/_shared/utils/recursiveCrawler.js";
import { sanitizeToken } from "../api/_shared/utils/sanitizeToken.js";
import { createContentfulManagementClient } from "../api/_shared/utils/contentfulManagementClient.js";
import { getArgValue, hasFlag, requireEnv } from "./_shared/scriptUtils.js";

type CorrectionRecord = {
  entryId: string;
  title: string;
  url: string;
  correctedAt: string;
  correctedBy?: string;
  notes?: string;
  contentType?: string;
  fields: Record<string, unknown>;
};

type DatasetExample = {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

function normalizeScalar(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeComparable(value: unknown): string | string[] {
  if (Array.isArray(value)) {
    return value.map(normalizeScalar).filter(Boolean).sort();
  }
  return normalizeScalar(value);
}

function valuesEqual(left: unknown, right: unknown): boolean {
  const l = normalizeComparable(left);
  const r = normalizeComparable(right);
  return JSON.stringify(l) === JSON.stringify(r);
}

function readJsonIfExists(filePath: string): Record<string, unknown> {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch {
    // ignore corrupt local overlays for now
  }
  return {};
}

function loadMergedCorrections(): CorrectionRecord[] {
  const seedPath = path.resolve("seeds/feedback-corrections.json");
  const cachePath = path.resolve(".cache/feedback-corrections.json");
  const seed = readJsonIfExists(seedPath);
  const overlay = readJsonIfExists(cachePath);
  const merged = { ...seed, ...overlay };
  return Object.values(merged).filter(
    (value): value is CorrectionRecord =>
      typeof value === "object" && value !== null && "entryId" in value,
  );
}

function buildDatasetExamples(
  corrections: CorrectionRecord[],
  limit: number,
): DatasetExample[] {
  const selected = limit > 0 ? corrections.slice(0, limit) : corrections;
  return selected.map((correction) => ({
    input: {
      entryId: correction.entryId,
      title: correction.title,
      url: correction.url,
      contentType: correction.contentType || null,
    },
    output: correction.fields,
    metadata: {
      correctedAt: correction.correctedAt,
      correctedBy: correction.correctedBy || null,
      notes: correction.notes || null,
      fieldCount: Object.keys(correction.fields || {}).length,
    },
  }));
}

async function fetchLiveAsset(entryId: string) {
  const SPACE_ID = requireEnv("CONTENTFUL_SPACE_ID");
  const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
  const MGMT_TOKEN = sanitizeToken(
    process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
      process.env.CONTENTFUL_ACCESS_TOKEN,
  );
  if (!MGMT_TOKEN) {
    throw new Error(
      "Missing Contentful management token. Set CONTENTFUL_MANAGEMENT_TOKEN or CONTENTFUL_ACCESS_TOKEN.",
    );
  }

  const client = (await createContentfulManagementClient(MGMT_TOKEN)) as import("contentful-management").ClientAPI;
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const entry = await environment.getEntry(entryId);
  const contentTypeId = entry.sys.contentType.sys.id;

  type CmaEntryLike = { sys: { id: string; contentType: { sys: { id: string } } }; fields: Record<string, Record<string, unknown>> };
  let crawlEntryId = entryId;
  let parentEntry: CmaEntryLike | null = null;
  const pageContentType = CHILD_TO_PAGE_MAP[contentTypeId];
  if (pageContentType) {
    try {
      const parents = await environment.getEntries({
        content_type: pageContentType,
        links_to_entry: entryId,
        limit: 1,
      });
      if (parents.items.length > 0) {
        parentEntry = parents.items[0] as CmaEntryLike;
        crawlEntryId = parentEntry.sys.id;
      }
    } catch {
      // fall back to the child entry
    }
  }

  // eslint-disable-next-line no-useless-assignment
  let textContent = "";
  try {
    const crawlResult = await crawlViaCda(crawlEntryId);
    textContent = crawlResult.text;
  } catch {
    const crawler = new RecursiveContentCrawler(environment);
    textContent = await crawler.extractTextRecursive(
      parentEntry || entry,
      0,
      4,
    );
  }

  const primaryEntry = parentEntry || entry;
  const title =
    primaryEntry.fields.nameInternal?.["en-US"] ||
    primaryEntry.fields.title?.["en-US"] ||
    primaryEntry.fields.name?.["en-US"] ||
    entry.fields.nameInternal?.["en-US"] ||
    entry.fields.title?.["en-US"] ||
    entryId;
  const slug =
    primaryEntry.fields.slug?.["en-US"] ||
    primaryEntry.fields.url?.["en-US"] ||
    entry.fields.slug?.["en-US"] ||
    entry.fields.url?.["en-US"] ||
    "";

  return {
    id: entryId,
    title: String(title),
    slug,
    contentType: parentEntry
      ? parentEntry.sys.contentType.sys.id
      : entry.sys.contentType.sys.id,
    textContent: textContent || "No content found after deep crawl",
  };
}

function summarizeClassification(result: Record<string, { value?: unknown; confidence?: number } | null | undefined> & { id?: string; overallConfidence?: number; needsReview?: boolean }) {
  const fieldNames = [
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
    "season",
    "yearPublished",
  ] as const;

  const fields: Record<string, unknown> = {};
  const confidences: Record<string, number> = {};
  for (const field of fieldNames) {
    const payload = result?.[field];
    if (!payload || typeof payload !== "object") continue;
    fields[field] = payload.value ?? null;
    if (typeof payload.confidence === "number") {
      confidences[field] = payload.confidence;
    }
  }

  return {
    entryId: result?.id || null,
    overallConfidence: result?.overallConfidence ?? null,
    needsReview: result?.needsReview ?? null,
    fields,
    confidences,
  };
}

function resolvePhoenixBaseUrl(): string {
  if (process.env.PHOENIX_HOST) return process.env.PHOENIX_HOST;
  const collector = process.env.PHOENIX_COLLECTOR_ENDPOINT;
  if (collector) return collector.replace(/\/v1\/traces$/, "");
  return "http://127.0.0.1:6006";
}

async function main() {
  const limit = Number(getArgValue("--limit") || 0);
  const dryRun = hasFlag("--dry-run")
    ? Number(getArgValue("--dry-run") || 2)
    : false;
  const datasetName =
    getArgValue("--dataset-name") || "content-taxonomy-human-corrections";
  const experimentName =
    getArgValue("--experiment-name") ||
    `content-taxonomy-eval-${new Date().toISOString().slice(0, 19)}`;

  const corrections = loadMergedCorrections().sort(
    (a, b) =>
      new Date(b.correctedAt).getTime() - new Date(a.correctedAt).getTime(),
  );
  if (corrections.length === 0) {
    throw new Error(
      "No human corrections found in seeds/.cache feedback store.",
    );
  }

  const examples = buildDatasetExamples(corrections, limit);
  const phoenixBaseUrl = resolvePhoenixBaseUrl();
  const client = createClient({
    options: {
      baseUrl: phoenixBaseUrl,
      headers: process.env.PHOENIX_API_KEY
        ? { Authorization: `Bearer ${process.env.PHOENIX_API_KEY}` }
        : undefined,
    },
  });

  const { datasetId } = await createOrGetDataset({
    client,
    name: datasetName,
    description:
      "Human-corrected Contentful taxonomy examples used for real Phoenix experiment runs.",
    examples,
  });

  const evaluators = [
    asExperimentEvaluator({
      name: "corrected-field-exact-match",
      kind: "CODE",
      evaluate: async ({ output, expected }) => {
        const predictedFields = (output as Record<string, unknown>)?.fields as Record<string, unknown> || {};
        const expectedFields = (expected as Record<string, unknown>) || {};
        const fieldResults = Object.entries(expectedFields).map(
          ([field, expectedValue]) => {
            const actualValue = predictedFields[field];
            const matched = valuesEqual(actualValue, expectedValue);
            return {
              field,
              matched,
              expected: expectedValue,
              actual: actualValue ?? null,
            };
          },
        );
        const passed = fieldResults.filter((item) => item.matched).length;
        const total = fieldResults.length || 1;
        return {
          score: passed / total,
          label: passed === total ? "pass" : "fail",
          passed,
          total,
          fieldResults,
        };
      },
    }),
    asExperimentEvaluator({
      name: "critical-field-gate",
      kind: "CODE",
      evaluate: async ({ output, expected }) => {
        const predictedFields = (output as Record<string, unknown>)?.fields as Record<string, unknown> || {};
        const expectedFields = (expected as Record<string, unknown>) || {};
        const criticalFields = ["topic", "useCases", "funnelStage", "industry"];
        const checks = criticalFields
          .filter((field) => field in expectedFields)
          .map((field) => ({
            field,
            matched: valuesEqual(predictedFields[field], expectedFields[field]),
          }));
        const failed = checks
          .filter((item) => !item.matched)
          .map((item) => item.field);
        return {
          score: failed.length === 0 ? 1 : 0,
          label: failed.length === 0 ? "pass" : "fail",
          failedCriticalFields: failed,
        };
      },
    }),
    asExperimentEvaluator({
      name: "review-routing-sanity",
      kind: "CODE",
      evaluate: async ({ input, output, expected }) => {
        const outputTyped = output as Record<string, unknown>;
        const outputFields = outputTyped?.fields as Record<string, unknown> || {};
        const expectedTyped = expected as Record<string, unknown>;
        const hasLeadGenSubtype = ["Webinar", "Ebook", "Case Study"].some(
          (value) =>
            Array.isArray(outputFields.assetSubType) &&
            (outputFields.assetSubType as string[]).includes(value),
        );
        const expectedLeadGenSubtype = ["Webinar", "Ebook", "Case Study"].some(
          (value) =>
            Array.isArray(expectedTyped?.assetSubType) &&
            (expectedTyped.assetSubType as string[]).includes(value),
        );
        const shouldReview = hasLeadGenSubtype || expectedLeadGenSubtype;
        const matched = shouldReview
          ? outputTyped?.needsReview === true
          : true;
        return {
          score: matched ? 1 : 0,
          label: matched ? "pass" : "fail",
          entryId: (input as Record<string, unknown>)?.entryId ?? null,
          expectedNeedsReview: shouldReview,
          actualNeedsReview: outputTyped?.needsReview ?? null,
        };
      },
    }),
  ];

  const experiment = await runExperiment({
    client,
    dataset: { datasetId },
    experimentName,
    experimentDescription:
      "Run the live classifier against human-corrected Contentful entries and score exact-match taxonomy behavior.",
    task: async ({ input }) => {
      const entryId = String((input as Record<string, unknown>)?.entryId || "");
      if (!entryId) {
        throw new Error("Dataset example is missing entryId");
      }
      const asset = await fetchLiveAsset(entryId);
      const classification = await classifyContent({
        asset,
        allowedLabels: getStaticAllowedTaxonomyLabels(),
        skipCache: true,
        executionMode: "default",
      });
      return summarizeClassification(classification);
    },
    evaluators,
    dryRun,
    concurrency: Number(getArgValue("--concurrency") || 2),
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        phoenixBaseUrl,
        datasetId,
        datasetName,
        experimentId: experiment.id,
        experimentName: experiment.projectName,
        dryRun,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
