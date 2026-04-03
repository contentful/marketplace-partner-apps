#!/usr/bin/env tsx
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
import contentfulManagement from "contentful-management";
import { ensureContentTypeWritebackFields } from "../api/_shared/utils/contentfulProvisioning.js";

dotenvConfig({ path: ".env.production.local", override: false });
dotenvConfig({ path: ".vercel/.env.production.local", override: true });

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
  process.env.CONTENTFUL_ACCESS_TOKEN;

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required env vars: CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN (or CONTENTFUL_ACCESS_TOKEN)",
  );
  process.exit(1);
}

async function main() {
  const client = contentfulManagement.createClient({
    accessToken: MGMT_TOKEN!,
  });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const requestedContentTypeIds = process.argv.slice(2).filter(Boolean);
  const allContentTypes = await environment.getContentTypes();
  const contentTypes =
    requestedContentTypeIds.length > 0
      ? allContentTypes.items.filter((contentType) =>
          requestedContentTypeIds.includes(contentType.sys.id),
        )
      : allContentTypes.items;

  console.log("🧱 Provisioning writeback fields");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}`);
  console.log(`Content types: ${contentTypes.length}`);

  let touched = 0;
  const created: Array<{ id: string; fields: string[] }> = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const contentType of contentTypes) {
    try {
      const result = await ensureContentTypeWritebackFields({
        environment,
        contentTypeId: contentType.sys.id,
        logger: console,
      });

      if (result.createdFieldIds.length > 0) {
        touched += 1;
        created.push({
          id: contentType.sys.id,
          fields: result.createdFieldIds,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      skipped.push({ id: contentType.sys.id, reason: message });
      console.warn(`⚠️ Skipping ${contentType.sys.id}: ${message}`);
    }
  }

  console.log("\n📊 Summary");
  console.log(`Updated content types: ${touched}`);
  for (const item of created) {
    console.log(`- ${item.id}: ${item.fields.join(", ")}`);
  }
  console.log(`Skipped content types: ${skipped.length}`);
  for (const item of skipped) {
    console.log(`- ${item.id}: ${item.reason}`);
  }
}

main().catch((error) => {
  console.error("❌ Failed to provision writeback fields");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
