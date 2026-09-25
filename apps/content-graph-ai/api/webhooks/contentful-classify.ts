import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { Environment } from "contentful-management";
import { classifyContent } from "../_shared/tools/classificationTool.js";
import { updateContentfulEntryWithClassification } from "../_shared/tools/contentfulAppTool.js";
import { RecursiveContentCrawler } from "../_shared/utils/recursiveCrawler.js";
import { sanitizeToken } from "../_shared/utils/sanitizeToken.js";
import { enqueueClassificationJob } from "../_shared/utils/reviewQueue.js";
import { verifyContentfulWebhook } from "../_shared/utils/contentfulWebhookVerify.js";
import {
  requireEnvVars,
  sendSafeRouteError,
} from "../_shared/utils/runtimeConfig.js";
import { createContentfulManagementClient } from "../_shared/utils/contentfulManagementClient.js";
import { logger } from "../_shared/utils/logger.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";

// ---------------------------------------------------------------------------
// Infinite loop guard
// Contentful sets X-Contentful-Triggering-User-Id on webhooks triggered by
// API calls (including our own classification updates). We set a sentinel
// field in the entry update to detect our own writes.
// ---------------------------------------------------------------------------
const OUR_BOT_USER_ID = process.env.CONTENTFUL_BOT_USER_ID;

function isOurOwnUpdate(req: VercelRequest): boolean {
  const triggeringUser = req.headers["x-contentful-triggering-user-id"] as
    | string
    | undefined;
  return !!(OUR_BOT_USER_ID && triggeringUser === OUR_BOT_USER_ID);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Method guard
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!requireEnvVars(res, "Webhook auth", ["CONTENTFUL_WEBHOOK_SECRET"])) {
      logger.error("Webhook secret is not configured");
      return;
    }
    const WEBHOOK_SECRET = process.env.CONTENTFUL_WEBHOOK_SECRET!;

    if (WEBHOOK_SECRET.length !== 64) {
      logger.error(
        "CONTENTFUL_WEBHOOK_SECRET must be exactly 64 characters (Contentful webhook signing secret)",
      );
      return res.status(503).json({ error: "Webhook auth is not configured" });
    }

    // 2. Contentful request verification (signing secret + canonical request)
    if (!verifyContentfulWebhook(req, WEBHOOK_SECRET)) {
      logger.warn("Webhook signature verification failed — rejecting");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const { sys } = req.body ?? {};

    // 3. Entry type guard
    if (!sys || sys.type !== "Entry") {
      return res.status(200).json({ message: "Ignored (not an entry)" });
    }

    // 4. Infinite loop guard — skip if this update was triggered by our own bot
    if (isOurOwnUpdate(req)) {
      logger.info(
        "Skipping webhook — triggered by our own classification update",
      );
      return res.status(200).json({ message: "Ignored (self-triggered)" });
    }

    const entryId = sys.id;
    const contentType = sys.contentType.sys.id;

    console.log(`\n🔔 Webhook received for Entry: ${entryId} (${contentType})`);

    const queued = await enqueueClassificationJob({
      entryId,
      contentType,
      locale: "en-US",
      webhookBody: req.body,
    });

    if (queued) {
      logger.info("Queued classification job from webhook", {
        entryId,
        contentType,
        jobId: queued.id,
      });
      return res.status(202).json({
        message: "Classification queued",
        jobId: queued.id,
        entryId,
      });
    }

    // Fetch fresh content so resolved references are complete.
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
    const environment = await space.getEnvironment(ENV_ID);
    const entry = await environment.getEntry(entryId);

    const crawler = new RecursiveContentCrawler(environment);
    const textContent = await crawler.extractTextRecursive(entry);

    if (!textContent || textContent.length < 50) {
      console.log(`Skipping ${entryId} - Insufficient content`);
      return res
        .status(200)
        .json({ message: "Skipped (insufficient content)" });
    }

    const classification = await classifyContent({
      asset: {
        id: entryId,
        title: entry.fields.title?.["en-US"] || entryId,
        contentType: contentType,
        textContent,
      },
      logger,
    });

    await updateContentfulEntryWithClassification({
      entryId,
      classification,
      locale: "en-US",
      logger,
    });

    return res.status(200).json({
      message: "Classified and updated",
      classification,
    });
  } catch (error) {
    return sendSafeRouteError(
      res,
      "Webhook processing failed",
      error,
      "contentful-webhook-route",
    );
  }
}
