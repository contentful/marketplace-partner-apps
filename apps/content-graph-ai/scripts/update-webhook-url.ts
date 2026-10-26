#!/usr/bin/env tsx
/**
 * Update Webhook URL
 *
 * Updates the webhook to use the latest working deployment URL
 */

import "dotenv/config";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const VERCEL_URL =
  process.env.VERCEL_URL || "https://content-graph-main.vercel.app";

async function updateWebhook() {
  console.log("🔗 Updating webhook URL...\n");

  const contentful = await import("contentful-management");
  const client = contentful.createClient({ accessToken: MGMT_TOKEN });
  const space = await client.getSpace(SPACE_ID);

  const webhooks = await space.getWebhooks();
  const webhook = webhooks.items.find(
    (w: { name: string; url: string; update(): Promise<{ url: string }> }) => w.name === "Content Graph AI Classifier",
  );

  if (!webhook) {
    console.log("❌ Webhook not found");
    return;
  }

  webhook.url = `${VERCEL_URL}/webhooks/contentful`;
  const updated = await webhook.update();

  console.log("✅ Webhook updated!");
  console.log(`   New URL: ${updated.url}`);
}

async function main() {
  console.log("🚀 Updating Webhook\n");
  console.log(`New URL: ${VERCEL_URL}\n`);

  try {
    await updateWebhook();

    console.log("\n✅ Update complete!");
    console.log("\n📝 Working URLs:");
    console.log(`   Homepage: ${VERCEL_URL}/`);
    console.log(`   Sidebar App: ${VERCEL_URL}/app`);
    console.log(`   Webhook: ${VERCEL_URL}/webhooks/contentful`);
  } catch (error: unknown) {
    console.error("\n❌ Update failed:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
