import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Environment } from "contentful-management";
import { fetchContentfulAssets } from "../_shared/tools/contentfulTool.js";
import { classifyContent } from "../_shared/tools/classificationTool.js";
import { getStaticAllowedTaxonomyLabels } from "../_shared/config/taxonomyDefinition.js";
import { updateContentfulEntryWithClassification } from "../_shared/tools/contentfulAppTool.js";
import {
  RecursiveContentCrawler,
  crawlViaCda,
} from "../_shared/utils/recursiveCrawler.js";
import { sanitizeToken } from "../_shared/utils/sanitizeToken.js";
import {
  claimClassificationJobs,
  completeClassificationJob,
  failClassificationJob,
  queueHumanReview,
  retryClassificationJob,
  sendReviewAlert,
} from "../_shared/utils/reviewQueue.js";
import { CLASSIFICATION_QUEUE_BATCH_SIZE } from "../_shared/config/classifierPipeline.js";
import {
  linkAssetToLabels,
  upsertAssetNode,
  upsertTaxonomyNodes,
} from "../_shared/graph/pgGraph.js";
import {
  normalizeFunnel,
  normalizeIndustry,
  normalizePersona,
  normalizeTopic,
} from "../_shared/utils/taxonomyNormalize.js";
import { validateCronToken } from "../_shared/utils/appAuth.js";
import { createContentfulManagementClient } from "../_shared/utils/contentfulManagementClient.js";
import { logger } from "../_shared/utils/logger.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";

function isRetriableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("429") ||
    message.toLowerCase().includes("rate limit") ||
    message.toLowerCase().includes("timeout") ||
    message.toLowerCase().includes("temporarily unavailable") ||
    message.toLowerCase().includes("vendordependencyerror") ||
    message.toLowerCase().includes("vendor dependency") ||
    message.toLowerCase().includes("[chroma]") ||
    message.toLowerCase().includes("[langsmith]") ||
    message.toLowerCase().includes("[otel]") ||
    message.toLowerCase().includes("[nlp-sidecar]") ||
    message.toLowerCase().includes("[embedding]")
  );
}

async function getEnvironment() {
  const envKey = `CONTENTFUL_MANAGEMENT_TOKEN_${SPACE_ID}`;
  const spaceScopedToken =
    process.env[envKey] || process.env[`CONTENTFUL_ACCESS_TOKEN_${SPACE_ID}`];
  const defaultToken =
    process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
    process.env.CONTENTFUL_ACCESS_TOKEN;
  const mgmtToken = sanitizeToken(spaceScopedToken || defaultToken);

  if (!mgmtToken) {
    throw new Error(
      `Missing Contentful management token for space ${SPACE_ID}. Set ${envKey} or CONTENTFUL_MANAGEMENT_TOKEN.`,
    );
  }

  const client = await createContentfulManagementClient(mgmtToken) as unknown as {
    getSpace(id: string): Promise<{ getEnvironment(id: string): Promise<Environment> }>;
  };
  const space = await client.getSpace(SPACE_ID);
  return space.getEnvironment(ENV_ID);
}

type CronJsonResult = { status: number; body: unknown };

async function runProcessClassificationQueue(
  limit: number,
): Promise<CronJsonResult> {
  try {
    const jobs = await claimClassificationJobs(limit);

    if (jobs.length === 0) {
      return {
        status: 200,
        body: { processed: 0, message: "No queued jobs" },
      };
    }

    // environment + crawler are lazily created only if the CDA path fails for any job
    let environment: Awaited<ReturnType<typeof getEnvironment>> | null = null;
    let crawler: RecursiveContentCrawler | null = null;
    async function getCmaFallback() {
      if (!environment) environment = await getEnvironment();
      if (!crawler) crawler = new RecursiveContentCrawler(environment);
      return { environment, crawler };
    }
    const allowedLabels = getStaticAllowedTaxonomyLabels();
    const summary = {
      processed: 0,
      completed: 0,
      needsReview: 0,
      retried: 0,
      failed: 0,
    };

    for (const queueJob of jobs) {
      try {
        let textContent = "";
        let crawlZones:
          | import("../_shared/utils/recursiveCrawler.js").ContentZone[]
          | undefined;
        // CDA fields (locale-flat) used for metadata and title extraction.
        // Falls back to a CMA fetch only if the CDA crawl itself fails.
        let entryFields: Record<string, unknown> = {};
        let entryContentTypeId: string = "";
        try {
          const crawlResult = await crawlViaCda(queueJob.entryId);
          textContent = crawlResult.text;
          crawlZones =
            crawlResult.zones.length > 0 ? crawlResult.zones : undefined;
          entryFields = crawlResult.entryFields;
          entryContentTypeId = crawlResult.entrySys.contentType.sys.id;
        } catch {
          // CDA unavailable — fall back to CMA
          const { environment: env, crawler: cmaFallback } = await getCmaFallback();
          const entry = await env.getEntry(queueJob.entryId);
          textContent = await cmaFallback.extractTextRecursive(entry);
          // Unwrap CMA locale wrappers into flat values for uniform access below
          for (const [k, v] of Object.entries(entry.fields as Record<string, Record<string, unknown> | unknown>)) {
            const wrapped = v as Record<string, unknown>;
            entryFields[k] =
              wrapped && typeof wrapped === "object" && !Array.isArray(wrapped) && "en-US" in wrapped
                ? wrapped["en-US"]
                : v;
          }
          entryContentTypeId = entry.sys.contentType.sys.id;
        }
        const metaFieldNames = [
          "companySize",
          "company_size",
          "headquarters",
          "region",
          "industries",
          "industry",
          "useCase",
          "useCases",
          "use_cases",
          "topic",
          "topics",
          "audience",
          "jobLevel",
          "jobFunction",
          "product",
          "products",
          "funnelStage",
          "funnel_stage",
        ];
        const metaParts: string[] = [];
        for (const fn of metaFieldNames) {
          const val = entryFields[fn];
          if (!val) continue;
          const display = Array.isArray(val) ? val.join(", ") : String(val);
          if (display.trim()) metaParts.push(`${fn}: ${display}`);
        }
        if (metaParts.length > 0) {
          textContent =
            `\n--- EXISTING ENTRY METADATA (author-set, treat as ground truth) ---\n${metaParts.join("\n")}\n---\n\n` +
            textContent;
        }

        if (!textContent || textContent.length < 50) {
          await completeClassificationJob(queueJob.id, "completed");
          summary.processed++;
          summary.completed++;
          continue;
        }

        // CDA fields are flat strings; title precedence: nameInternal > title > entryId
        const entryTitle =
          (entryFields.nameInternal as string | undefined) ||
          (entryFields.title as string | undefined) ||
          queueJob.entryId;
        const entrySlug =
          (entryFields.slug as string | undefined) ||
          (entryFields.url as string | undefined) ||
          "";

        const classification = await classifyContent({
          asset: {
            id: queueJob.entryId,
            title: entryTitle,
            contentType: entryContentTypeId,
            textContent,
            slug: entrySlug,
          },
          contentZones: crawlZones,
          allowedLabels,
          logger,
        });

        if (classification.needsReview) {
          const weakestSemantic = Math.min(
            classification.topic?.confidence ?? 1,
            classification.jobLevel?.confidence ?? 1,
            classification.jobFunction?.confidence ?? 1,
            classification.useCases?.confidence ?? 1,
            classification.funnelStage?.confidence ?? 1,
          );
          const classificationExtra = classification as typeof classification & { reviewReasons?: string[] };
          const reasons = Array.isArray(classificationExtra.reviewReasons)
            ? classificationExtra.reviewReasons
            : ["Confidence below human-review threshold"];

          await queueHumanReview({
            jobId: queueJob.id,
            entryId: queueJob.entryId,
            title: entryTitle,
            url: entrySlug,
            overallConfidence: classification.overallConfidence ?? 0,
            weakestSemantic,
            reasons,
            classification,
          });
          await sendReviewAlert({
            jobId: queueJob.id,
            entryId: queueJob.entryId,
            title: entryTitle,
            url: entrySlug,
            overallConfidence: classification.overallConfidence ?? 0,
            weakestSemantic,
            reasons,
            classification,
          });
          await updateContentfulEntryWithClassification({
            entryId: queueJob.entryId,
            classification,
            locale: queueJob.locale,
            logger,
            writeFields: false,
            applyConcepts: false,
          });
          await completeClassificationJob(
            queueJob.id,
            "needs_review",
            classification,
          );
          summary.processed++;
          summary.needsReview++;
          continue;
        }

        await updateContentfulEntryWithClassification({
          entryId: queueJob.entryId,
          classification,
          locale: queueJob.locale,
          logger,
          applyConcepts: true,
        });
        await completeClassificationJob(
          queueJob.id,
          "completed",
          classification,
        );
        summary.processed++;
        summary.completed++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (
          isRetriableError(error) &&
          queueJob.attemptCount < queueJob.maxAttempts
        ) {
          await retryClassificationJob(
            queueJob.id,
            message,
            queueJob.attemptCount,
          );
          summary.processed++;
          summary.retried++;
          continue;
        }

        await failClassificationJob(queueJob.id, message);
        summary.processed++;
        summary.failed++;
        logger.error("[QueueWorker] Job failed", {
          jobId: queueJob.id,
          entryId: queueJob.entryId,
          error: message,
        });
      }
    }

    return { status: 200, body: summary };
  } catch (error) {
    logger.error("[QueueWorker] Request failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: 500, body: { error: "Cron job failed" } };
  }
}

async function withConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p: Promise<void> = fn(item).then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= limit) await Promise.race(executing);
  }
  await Promise.all(executing);
}

async function runUpdateGraph(): Promise<CronJsonResult> {
  try {
    logger.info("Starting content graph update process");
    const fetchResult = await fetchContentfulAssets({
      limit: 50,
      skip: 0,
      logger,
    });
    const assets = fetchResult.assets;
    let processed = 0;
    let updated = 0;

    const space = process.env.CONTENTFUL_SPACE_ID;
    const envId =
      process.env.CONTENTFUL_ENV_ID ||
      process.env.CONTENTFUL_ENVIRONMENT_ID ||
      "master";

    await withConcurrency(assets, 4, async (asset) => {
      try {
        const classification = await classifyContent({
          asset,
          allowedLabels: getStaticAllowedTaxonomyLabels(),
          logger,
        });
        const firstOf = <T>(value: T | T[]): T =>
          Array.isArray(value) ? value[0] : value;
        const mapped = {
          topic: {
            value:
              normalizeTopic(firstOf(classification.topic?.value)) ||
              firstOf(classification.topic?.value),
            confidence: classification.topic?.confidence ?? 0,
          },
          funnelStage: {
            value:
              normalizeFunnel(classification.funnelStage?.value) ||
              classification.funnelStage?.value,
            confidence: classification.funnelStage?.confidence ?? 0,
          },
          industry: {
            value:
              normalizeIndustry(firstOf(classification.industry?.value)) ||
              firstOf(classification.industry?.value),
            confidence: classification.industry?.confidence ?? 0,
          },
          persona: {
            value:
              normalizePersona(firstOf(classification.audience?.value)) ||
              firstOf(classification.audience?.value),
            confidence: classification.audience?.confidence ?? 0,
          },
        };

        await updateContentfulEntryWithClassification({
          entryId: asset.id,
          classification: mapped,
          logger,
        });

        const entryUrl = space
          ? `https://app.contentful.com/spaces/${space}/environments/${envId}/entries/${asset.id}`
          : undefined;

        await upsertAssetNode(asset.id, {
          title: asset.title,
          url: entryUrl,
        });
        await upsertTaxonomyNodes({
          topic: mapped.topic.value,
          persona: mapped.persona.value,
          industry: mapped.industry.value,
          funnelStage: mapped.funnelStage.value,
        });
        await linkAssetToLabels(
          asset.id,
          {
            topic: mapped.topic.value,
            persona: mapped.persona.value,
            industry: mapped.industry.value,
            funnelStage: mapped.funnelStage.value,
          },
          {
            topic: mapped.topic.confidence,
            persona: mapped.persona.confidence,
            industry: mapped.industry.confidence,
            funnelStage: mapped.funnelStage.confidence,
          },
        );

        updated++;
      } catch (error) {
        logger.error(`Failed to process asset ${asset.id}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
      processed++;
    });

    return { status: 200, body: { success: true, processed, updated } };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Failed to update content graph", { error: msg });
    return {
      status: 500,
      body: { success: false, message: "Graph update failed" },
    };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const job = Array.isArray(req.query.job) ? req.query.job[0] : req.query.job;

  if (!job) {
    return res.status(400).json({ error: "Missing cron job" });
  }

  // Vercel scheduled crons invoke with GET + Bearer CRON_SECRET; manual runs use POST.
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateCronToken(req, res)) return;

  if (job === "daily-maintenance") {
    const queue = await runProcessClassificationQueue(
      CLASSIFICATION_QUEUE_BATCH_SIZE,
    );
    const graph = await runUpdateGraph();
    const ok = queue.status < 400 && graph.status < 400;
    return res.status(ok ? 200 : 500).json({
      step: "daily-maintenance",
      processClassificationQueue: {
        status: queue.status,
        body: queue.body,
      },
      updateGraph: { status: graph.status, body: graph.body },
    });
  }

  if (job === "process-classification-queue") {
    const requestedLimit = Number(
      req.query.limit || CLASSIFICATION_QUEUE_BATCH_SIZE,
    );
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(
          Math.max(1, Math.floor(requestedLimit)),
          CLASSIFICATION_QUEUE_BATCH_SIZE,
        )
      : CLASSIFICATION_QUEUE_BATCH_SIZE;
    const result = await runProcessClassificationQueue(limit);
    return res.status(result.status).json(result.body);
  }

  if (job === "update-graph") {
    const result = await runUpdateGraph();
    return res.status(result.status).json(result.body);
  }

  return res.status(404).json({ error: `Unknown cron job: ${job}` });
}
