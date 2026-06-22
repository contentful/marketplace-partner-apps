#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();

import * as fs from "fs";
import * as path from "path";
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { getStaticAllowedTaxonomyLabels } from "../api/_shared/config/taxonomyDefinition.js";
import { CHILD_TO_PAGE_MAP } from "../api/_shared/config/contentTypeProfiles.js";
import {
  RecursiveContentCrawler,
  crawlViaCda,
} from "../api/_shared/utils/recursiveCrawler.js";
import { sanitizeToken } from "../api/_shared/utils/sanitizeToken.js";
import { createContentfulManagementClient } from "../api/_shared/utils/contentfulManagementClient.js";
import {
  createVendorTraceCollector,
  truncateTraceText,
} from "../api/_shared/utils/vendorTrace.js";
import { getArgValue, requireEnv } from "./_shared/scriptUtils.js";

type LogRecord = {
  level: "info" | "warn" | "error";
  msg: string;
  meta?: Record<string, unknown>;
  at: string;
};

function truncateText(input: string, limit = 1500): string {
  return input.length > limit ? `${input.slice(0, limit)}...` : input;
}

async function main() {
  const entryId = process.argv[2];
  if (!entryId || entryId.startsWith("--")) {
    throw new Error(
      "Usage: tsx scripts/capture-live-classification-trace.ts <entryId> [--out path]",
    );
  }

  const outPath =
    getArgValue("--out") ||
    `docs/evidence/LIVE_CLASSIFY_TRACE_${new Date().toISOString().slice(0, 10)}.json`;

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

  const logs: LogRecord[] = [];
  const vendorTrace = createVendorTraceCollector([
    {
      from: "contentful-management",
      to: "contentful-cda",
      description:
        "management API resolves the crawl root before CDA deep crawl",
    },
    {
      from: "contentful-cda",
      to: "signal-extraction",
      description: "deep-crawled Contentful text becomes classifier input",
    },
  ]);
  const logger = {
    info: (msg: string, meta?: Record<string, unknown>) => {
      logs.push({ level: "info", msg, meta, at: new Date().toISOString() });
    },
    warn: (msg: string, meta?: Record<string, unknown>) => {
      logs.push({ level: "warn", msg, meta, at: new Date().toISOString() });
    },
    error: (msg: string, meta?: Record<string, unknown>) => {
      logs.push({ level: "error", msg, meta, at: new Date().toISOString() });
    },
  };

  const routeTrace: Array<Record<string, unknown>> = [];
  const routeStep = (step: string, output: Record<string, unknown>) => {
    routeTrace.push({
      step,
      at: new Date().toISOString(),
      output,
    });
  };

  type CmaEntryLike = { sys: { id: string; contentType: { sys: { id: string } } }; fields: Record<string, Record<string, unknown>> };
  type CmaClient = {
    getSpace(spaceId: string): Promise<{
      getEnvironment(envId: string): Promise<{
        getEntry(id: string): Promise<CmaEntryLike>;
        getEntries(query: Record<string, unknown>): Promise<{ items: CmaEntryLike[] }>;
      }>;
    }>;
  };
  const clientStartedAt = Date.now();
  const client = (await createContentfulManagementClient(MGMT_TOKEN)) as CmaClient;
  vendorTrace.recordCall({
    vendor: "contentful-management",
    service: "management-client",
    category: "content-source",
    operation: "create-client",
    purpose: "initialize Contentful management client for live trace capture",
    status: "ok",
    durationMs: Date.now() - clientStartedAt,
    input: { spaceId: SPACE_ID, environmentId: ENV_ID },
    output: { tokenConfigured: true },
  });
  const space = await vendorTrace.trace(
    {
      vendor: "contentful-management",
      service: "space",
      category: "content-source",
      operation: "get-space",
      purpose: "resolve Contentful space before fetching the entry",
      input: { spaceId: SPACE_ID },
      mapResult: () => ({ spaceId: SPACE_ID }),
    },
    async () => await client.getSpace(SPACE_ID),
  );
  const environment = await vendorTrace.trace(
    {
      vendor: "contentful-management",
      service: "environment",
      category: "content-source",
      operation: "get-environment",
      purpose: "resolve Contentful environment before fetching the entry",
      input: { environmentId: ENV_ID },
      mapResult: () => ({ environmentId: ENV_ID }),
    },
    async () => await space.getEnvironment(ENV_ID),
  );

  routeStep("contentful-init", {
    spaceId: SPACE_ID,
    environmentId: ENV_ID,
  });

  const entry = await vendorTrace.trace(
    {
      vendor: "contentful-management",
      service: "entry",
      category: "content-source",
      operation: "get-entry",
      purpose: "fetch the requested Contentful entry",
      input: { entryId },
      mapResult: (resolvedEntry) => ({
        entryId: resolvedEntry?.sys?.id || entryId,
        contentType: resolvedEntry?.sys?.contentType?.sys?.id || null,
      }),
    },
    async () => await environment.getEntry(entryId),
  );
  const contentTypeId = entry.sys.contentType.sys.id;

  let crawlEntryId = entryId;
  let parentEntry: CmaEntryLike | null = null;
  const pageContentType = CHILD_TO_PAGE_MAP[contentTypeId];
  if (pageContentType) {
    try {
      const parents = await vendorTrace.trace(
        {
          vendor: "contentful-management",
          service: "entries",
          category: "content-source",
          operation: "find-parent-page",
          purpose: "resolve the page entry that owns the requested child entry",
          input: {
            contentType: pageContentType,
            linksToEntry: entryId,
          },
          mapResult: (result) => ({
            resultCount: result?.items?.length || 0,
            parentEntryId: result?.items?.[0]?.sys?.id || null,
          }),
        },
        async () =>
          await environment.getEntries({
            content_type: pageContentType,
            links_to_entry: entryId,
            limit: 1,
          }),
      );
      if (parents.items.length > 0) {
        parentEntry = parents.items[0] ?? null;
        crawlEntryId = parentEntry?.sys.id ?? crawlEntryId;
      }
    } catch (error) {
      routeStep("parent-lookup-error", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // eslint-disable-next-line no-useless-assignment
  let textContent = "";
  let crawlSource = "cda";
  try {
    const crawlResult = await vendorTrace.trace(
      {
        vendor: "contentful-cda",
        service: "recursive-crawl",
        category: "content-source",
        operation: "deep-crawl-entry",
        purpose:
          "fetch the full page body through the Contentful delivery APIs",
        input: { crawlEntryId },
        mapResult: (result) => ({
          textLength: result.text.length,
          textPreview: truncateTraceText(result.text, 220),
        }),
      },
      async () => await crawlViaCda(crawlEntryId),
    );
    textContent = crawlResult.text;
  } catch (error) {
    crawlSource = "management-api";
    const crawler = new RecursiveContentCrawler(environment as unknown as import("contentful-management").Environment);
    textContent = await vendorTrace.trace(
      {
        vendor: "contentful-management",
        service: "recursive-crawl",
        category: "content-source",
        operation: "deep-crawl-entry-fallback",
        purpose: "fallback crawl when CDA extraction fails",
        input: { crawlEntryId },
        mapResult: (result) => ({
          textLength: result.length,
          textPreview: truncateTraceText(result, 220),
        }),
      },
      async () =>
        await crawler.extractTextRecursive(parentEntry || entry, 0, 4),
    );
    routeStep("cda-fallback", {
      message: error instanceof Error ? error.message : String(error),
    });
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

  const finalAsset = {
    id: entryId,
    title: String(title),
    slug: String(slug || ""),
    contentType: parentEntry
      ? parentEntry.sys.contentType.sys.id
      : entry.sys.contentType.sys.id,
    textContent: textContent || "No content found after deep crawl",
  };

  routeStep("deep-crawl", {
    entryId,
    requestedContentType: contentTypeId,
    crawlEntryId,
    parentEntryId: parentEntry?.sys?.id || null,
    finalContentType: finalAsset.contentType,
    title: finalAsset.title,
    slug: finalAsset.slug,
    crawlSource,
    textLength: finalAsset.textContent.length,
    textPreview: truncateText(finalAsset.textContent),
  });

  const result = await classifyContent({
    asset: finalAsset,
    allowedLabels: getStaticAllowedTaxonomyLabels(),
    logger,
    executionMode: "default",
    collectTrace: true,
    skipCache: true,
    vendorTrace,
  });

  const output = {
    capturedAt: new Date().toISOString(),
    entryId,
    routeTrace,
    vendorTrace: vendorTrace.snapshot(),
    logs,
    result,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), "utf8");
  console.log(JSON.stringify({ ok: true, outPath, entryId }, null, 2));
  process.exit(0);
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
