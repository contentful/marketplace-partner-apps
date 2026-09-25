import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Environment } from "contentful-management";
import { z } from "zod";
import { classifyContent } from "../../_shared/tools/classificationTool.js";
import { getStaticAllowedTaxonomyLabels } from "../../_shared/config/taxonomyDefinition.js";
import {
  RecursiveContentCrawler,
  crawlViaCda,
} from "../../_shared/utils/recursiveCrawler.js";
import { sanitizeToken } from "../../_shared/utils/sanitizeToken.js";
import { validateAppToken } from "../../_shared/utils/appAuth.js";
import { createContentfulManagementClient } from "../../_shared/utils/contentfulManagementClient.js";
import { logger } from "../../_shared/utils/logger.js";
import { CHILD_TO_PAGE_MAP } from "../../_shared/config/contentTypeProfiles.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const DEBUG_TRACE_ENABLED =
  process.env.CONTENT_GRAPH_ENABLE_DEBUG_TRACE === "true";

const ExecuteRequestSchema = z.object({
  data: z
    .object({
      entryId: z.string().trim().min(1),
      debugTrace: z.boolean().optional(),
      skipCache: z.boolean().optional(),
      spaceId: z.string().trim().min(1).optional(),
      environmentId: z.string().trim().min(1).optional(),
    })
    .passthrough(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const tool = Array.isArray(req.query.tool)
    ? req.query.tool[0]
    : req.query.tool;

  if (!tool) {
    return res.status(400).json({ error: "Missing tool" });
  }

  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  if (!validateAppToken(req, res)) return;

  if (tool === "classify-content") {
    try {
      const requestStartedAt = Date.now();
      const parsed = ExecuteRequestSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid request body",
          issues: parsed.error.flatten(),
        });
      }

      const { data } = parsed.data;
      const entryId = data.entryId;
      const debugTraceRequested = Boolean(data.debugTrace);
      if (debugTraceRequested && !DEBUG_TRACE_ENABLED) {
        return res.status(403).json({ error: "Debug trace is disabled" });
      }
      const debugTrace = DEBUG_TRACE_ENABLED && debugTraceRequested;
      const skipCache = Boolean(data.skipCache);
      const stageTimings: Record<string, number | string> = {};
      const executionTrace: Array<Record<string, unknown>> = [];
      const traceStep = (step: string, output: Record<string, unknown>) => {
        if (!debugTrace) return;
        const event = {
          step,
          at: new Date().toISOString(),
          output,
        };
        executionTrace.push(event);
        logger.info("🧭 [App] Trace step", {
          entryId,
          step,
          output,
        });
      };
      const truncateText = (input: string, limit = 1500) =>
        input.length > limit ? `${input.slice(0, limit)}...` : input;

      type FinalAsset = {
        id: string;
        title: string;
        slug: string;
        contentType: string;
        textContent: string;
      };
      let finalAsset: FinalAsset | null = null;
      const entryMetadata: Record<string, string[]> = {};
      const targetSpaceId = data.spaceId || SPACE_ID;
      if (targetSpaceId !== SPACE_ID) {
        return res.status(400).json({
          error: `spaceId override is not allowed. This API is pinned to ${SPACE_ID}. Remove spaceId from the request.`,
        });
      }

      const targetEnvId = data.environmentId || ENV_ID;
      const envKey = `CONTENTFUL_MANAGEMENT_TOKEN_${targetSpaceId}`;
      const spaceScopedToken =
        process.env[envKey] ||
        process.env[`CONTENTFUL_ACCESS_TOKEN_${targetSpaceId}`];
      const defaultToken =
        process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
        process.env.CONTENTFUL_ACCESS_TOKEN;
      const mgmtTokenCandidate =
        spaceScopedToken ||
        (targetSpaceId === SPACE_ID ? defaultToken : undefined);
      const mgmtToken = sanitizeToken(mgmtTokenCandidate);

      if (!mgmtToken) {
        const msg =
          spaceScopedToken || targetSpaceId === SPACE_ID
            ? `Missing Contentful management token for space ${targetSpaceId}. Set ${envKey} or CONTENTFUL_MANAGEMENT_TOKEN.`
            : `Space ${targetSpaceId} is not configured. Add ${envKey} or remove the override so we use the default space ${SPACE_ID}.`;
        return res.status(400).json({ error: msg });
      }

      const contentfulStartedAt = Date.now();
      type CmaEntry = { sys: { id: string; contentType: { sys: { id: string } } }; fields: Record<string, Record<string, unknown>> };
      const client = await createContentfulManagementClient(mgmtToken) as unknown as {
        getSpace(id: string): Promise<{ getEnvironment(id: string): Promise<Environment> }>;
      };
      const space = await client.getSpace(targetSpaceId);
      const environment = await space.getEnvironment(targetEnvId);
      stageTimings.contentfulInitMs = Date.now() - contentfulStartedAt;
      traceStep("contentful-init", {
        spaceId: targetSpaceId,
        environmentId: targetEnvId,
        contentfulInitMs: stageTimings.contentfulInitMs,
      });

      const allowedLabels = getStaticAllowedTaxonomyLabels();
      stageTimings.allowedLabelsMs = 0;

      const crawlStartedAt = Date.now();

      // Get entry metadata first so we know the content type
      const entry = await environment.getEntry(entryId);
      const contentTypeId = entry.sys.contentType.sys.id;

      // If this is a child content type (e.g. caseStudy), find the parent page
      // entry (e.g. pageCaseStudy) which has all the body components.
      let crawlEntryId = entryId;
      let parentEntry: CmaEntry | null = null;
      const pageContentType = CHILD_TO_PAGE_MAP[contentTypeId];
      if (pageContentType) {
        try {
          // Search for the page entry that references this child entry
          const parents = await environment.getEntries({
            content_type: pageContentType,
            links_to_entry: entryId,
            limit: 1,
          });
          if (parents.items.length > 0) {
            parentEntry = parents.items[0];
            crawlEntryId = parentEntry.sys.id;
            logger.info(
              `🔗 [App] Found parent ${pageContentType} (${crawlEntryId}) for ${contentTypeId} (${entryId})`,
            );
          }
        } catch (err) {
          logger.warn(`[App] Parent lookup failed for ${contentTypeId}`, {
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Try CDA first (resolves all references in one call), fall back to Management API
      let textContent = "";
      let crawlZones:
        | import("../../_shared/utils/recursiveCrawler.js").ContentZone[]
        | undefined;
      let crawlSource = "cda";
      try {
        const crawlResult = await crawlViaCda(crawlEntryId);
        textContent = crawlResult.text;
        crawlZones =
          crawlResult.zones.length > 0 ? crawlResult.zones : undefined;
      } catch (cdaErr) {
        crawlSource = "management-api";
        logger.warn("CDA crawl failed, falling back to Management API", {
          error: cdaErr instanceof Error ? cdaErr.message : String(cdaErr),
        });
        const crawler = new RecursiveContentCrawler(environment);
        const crawlEntry = parentEntry || entry;
        textContent = await crawler.extractTextRecursive(crawlEntry, 0, 4);
      }
      // Use parent entry for title/slug if available (page entries have the real slug)
      const primaryEntry = parentEntry || entry;
      const primaryFields = primaryEntry.fields as Record<string, Record<string, unknown>>;
      const entryFields = entry.fields as Record<string, Record<string, unknown>>;
      const title =
        String(primaryFields.nameInternal?.["en-US"] ?? "") ||
        String(primaryFields.title?.["en-US"] ?? "") ||
        String(primaryFields.name?.["en-US"] ?? "") ||
        String(entryFields.nameInternal?.["en-US"] ?? "") ||
        String(entryFields.title?.["en-US"] ?? "") ||
        entryId;
      const slug =
        String(primaryFields.slug?.["en-US"] ?? "") ||
        String(primaryFields.url?.["en-US"] ?? "") ||
        String(entryFields.slug?.["en-US"] ?? "") ||
        String(entryFields.url?.["en-US"] ?? "") ||
        "";

      // Extract existing metadata fields from BOTH entries — these are author-set
      // values that override AI inference in post-processing.
      const metadataLines: string[] = [];
      const META_FIELD_MAP: Record<string, string> = {
        companySize: "companySize",
        company_size: "companySize",
        industries: "industry",
        industry: "industry",
        useCase: "useCases",
        useCases: "useCases",
        use_cases: "useCases",
        topic: "topic",
        topics: "topic",
        audience: "audience",
        jobLevel: "jobLevel",
        jobFunction: "jobFunction",
        product: "product",
        products: "product",
        funnelStage: "funnelStage",
        funnel_stage: "funnelStage",
        headquarters: "region",
        region: "region",
      };
      // Resolve a field value to string(s) — handles plain strings, string arrays,
      // and Contentful reference links (taxonomy concepts with a name/title field).
      type CdaRef = { fields?: { name?: string; title?: string; label?: string; displayName?: string }; sys?: { type?: string } };
      function resolveFieldValue(val: string | string[] | CdaRef | CdaRef[] | null | undefined): string[] {
        if (!val) return [];
        if (typeof val === "string") return val.trim() ? [val.trim()] : [];
        if (Array.isArray(val)) {
          return val.flatMap((item) => {
            if (typeof item === "string")
              return item.trim() ? [item.trim()] : [];
            // Resolved CDA reference with fields
            if (item?.fields) {
              const name =
                item.fields.name ||
                item.fields.title ||
                item.fields.label ||
                item.fields.displayName;
              return name ? [String(name).trim()] : [];
            }
            // Unresolved Management API link — skip (can't resolve without another API call)
            if (item?.sys?.type === "Link") return [];
            return String(item).trim() ? [String(item).trim()] : [];
          });
        }
        // Single resolved reference
        if (val?.fields) {
          const name =
            val.fields.name ||
            val.fields.title ||
            val.fields.label ||
            val.fields.displayName;
          return name ? [String(name).trim()] : [];
        }
        // Unresolved link
        if (val?.sys?.type === "Link") return [];
        return String(val).trim() ? [String(val).trim()] : [];
      }

      const entriesToCheck = parentEntry ? [parentEntry, entry] : [entry];
      const seenFields = new Set<string>();
      for (const e of entriesToCheck) {
        for (const [fieldName, classifierField] of Object.entries(
          META_FIELD_MAP,
        )) {
          if (seenFields.has(classifierField)) continue;
          const eFields = e.fields as Record<string, Record<string, unknown>>;
          const raw = eFields[fieldName];
          const val = raw?.["en-US"] as string | string[] | CdaRef | CdaRef[] | null | undefined;
          if (!val) continue;
          const values = resolveFieldValue(val);
          if (values.length > 0) {
            seenFields.add(classifierField);
            entryMetadata[classifierField] = values;
            metadataLines.push(`${classifierField}: ${values.join(", ")}`);
          }
        }
      }
      const metadataBlock =
        metadataLines.length > 0
          ? `\n--- EXISTING ENTRY METADATA (author-set, treat as ground truth) ---\n${metadataLines.join("\n")}\n---\n\n`
          : "";

      finalAsset = {
        id: entryId,
        title: String(title),
        slug,
        contentType: parentEntry
          ? parentEntry.sys.contentType.sys.id
          : entry.sys.contentType.sys.id,
        textContent:
          metadataBlock + (textContent || "No content found after deep crawl"),
      };
      stageTimings.deepCrawlMs = Date.now() - crawlStartedAt;
      stageTimings.crawlSource = crawlSource;
      traceStep("deep-crawl", {
        entryId,
        requestedContentType: contentTypeId,
        crawlEntryId,
        parentEntryId: parentEntry?.sys?.id || null,
        finalContentType: finalAsset.contentType,
        title: finalAsset.title,
        slug: finalAsset.slug,
        crawlSource,
        deepCrawlMs: stageTimings.deepCrawlMs,
        textLength: finalAsset.textContent.length,
        textPreview: truncateText(finalAsset.textContent),
        metadataOverrides: entryMetadata,
      });

      if (!finalAsset) {
        return res
          .status(400)
          .json({ error: "Unable to build a deep-crawled asset for entryId" });
      }

      const classifyStartedAt = Date.now();
      const result = await classifyContent({
        asset: finalAsset,
        contentZones: crawlZones,
        allowedLabels,
        logger,
        executionMode: "default",
        collectTrace: debugTrace,
        skipCache,
      });
      stageTimings.classifyMs = Date.now() - classifyStartedAt;

      // Apply entry metadata as hard overrides — author-set values always win.
      if (entryMetadata && Object.keys(entryMetadata).length > 0) {
        const r = result as unknown as Record<string, { value?: string | string[]; confidence?: number } | null | undefined>;
        for (const [field, values] of Object.entries(entryMetadata)) {
          if (!r[field]) continue;
          // Multi-select fields: override value array
          if (Array.isArray(r[field]?.value)) {
            r[field]!.value = values;
            r[field]!.confidence = Math.max(r[field]?.confidence || 0, 0.99);
          }
          // Single-select fields: override with first value
          else if (typeof r[field]?.value === "string") {
            r[field]!.value = values[0];
            r[field]!.confidence = Math.max(r[field]?.confidence || 0, 0.99);
          }
        }
        logger.info("📌 [App] Applied entry metadata overrides", {
          fields: Object.keys(entryMetadata),
        });
        traceStep("metadata-overrides", {
          fields: Object.keys(entryMetadata),
          values: entryMetadata,
        });
      }

      logger.info("✅ [App] Execution classification completed", {
        assetId: finalAsset.id,
        deepCrawl: true,
        stageTimings: {
          ...stageTimings,
          totalMs: Date.now() - requestStartedAt,
        },
      });

      if (debugTrace) {
        const resultWithTrace = result as typeof result & { debugTrace?: Record<string, unknown> };
        return res.status(200).json({
          ...resultWithTrace,
          debugTrace: {
            route: executionTrace,
            classifier: resultWithTrace.debugTrace || null,
          },
        });
      }

      return res.status(200).json(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("Classification error:", msg);
      return res.status(500).json({ error: "Classification failed" });
    }
  }

  return res.status(404).json({ error: `Unknown tool: ${tool}` });
}
