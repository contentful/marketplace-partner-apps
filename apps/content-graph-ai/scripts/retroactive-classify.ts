#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();
import contentfulManagement from "contentful-management";
const { createClient } = contentfulManagement;
import { batchClassifyContent } from "../api/_shared/tools/classificationTool.js";
import { updateContentfulEntryWithClassification } from "../api/_shared/tools/contentfulAppTool.js";
import { RecursiveContentCrawler } from "../api/_shared/utils/recursiveCrawler.js";
import { logger } from "./_shared/logger.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN! ||
  process.env.CONTENTFUL_ACCESS_TOKEN!;
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";
const CONTENT_TYPE = process.env.CONTENT_TYPE || "aiDemoAsset"; // Default to aiDemoAsset, can be overridden

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required environment variables: CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

async function main() {
  console.log("🚀 Retroactive Classification Script\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}`);
  console.log(`Content Type: ${CONTENT_TYPE}\n`);

  const client = createClient({ accessToken: MGMT_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  console.log("🔍 Fetching entries...");
  // Fetch entries
  // Note: Pagination handled simply here (limit 100). For production, valid pagination is needed.
  const entries = await environment.getEntries({
    content_type: CONTENT_TYPE,
    limit: 50, // Process in batches of 50
  });

  console.log(`found ${entries.items.length} entries.`);

  // Recursive Content Walker
  const crawler = new RecursiveContentCrawler(environment);

  const assetsToProcess = [];

  for (const entry of entries.items) {
    const title =
      entry.fields.title?.["en-US"] ||
      entry.fields.name?.["en-US"] ||
      entry.sys.id;

    // Use the new recursive extractor
    console.log(`   Scanning nested content for: ${title}`);
    const textContent = await crawler.extractTextRecursive(entry);

    if (!textContent || textContent.length < 50) {
      // arbitrary small limit
      console.log(`   Skipping ${entry.sys.id} (insufficient content)`);
      continue;
    }

    assetsToProcess.push({
      id: entry.sys.id,
      title,
      contentType: entry.sys.contentType.sys.id,
      textContent,
    });
  }

  console.log(
    `\nProcessing ${assetsToProcess.length} assets with batch classification...`,
  );

  // Run batch classification
  const classificationResults = await batchClassifyContent({
    assets: assetsToProcess,
    concurrency: 5,
    logger,
  });

  console.log("\n💾 Updating Contentful entries...");

  let updated = 0;
  let failed = 0;

  for (const result of classificationResults.results) {
    try {
      await updateContentfulEntryWithClassification({
        entryId: result.assetId,
        classification: {
          ...result,
          // Map back to format expected by update tool if strictly needed,
          // but updateContentfulEntryWithClassification expects ClassificationResult-like shape now.
          // The schema match should be close enough.
        } as unknown as Record<string, { value?: unknown; confidence?: number } | null | undefined>,
        locale: "en-US", // Default
        logger,
      });
      updated++;
      console.log(`   ✓ Updated: ${result.assetId}`);
    } catch (e: unknown) {
      console.error(`   ✗ Failed to update ${result.assetId}: ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }

  console.log("\n🎉 Retroactive Classification Complete!");
  console.log(`   Scanned: ${entries.items.length}`);
  console.log(`   Processed: ${assetsToProcess.length}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
}

main().catch(console.error);
