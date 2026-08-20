#!/usr/bin/env tsx
/**
 * Create Contentful Webhook
 *
 * This script creates a webhook that triggers when entries are published,
 * sending the data to your Vercel deployment for AI classification.
 */

import "dotenv/config";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const WEBHOOK_SECRET =
  process.env.CONTENTFUL_WEBHOOK_SECRET || "your-webhook-secret-here";
const VERCEL_URL =
  process.env.VERCEL_URL || "https://content-graph-main.vercel.app";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

async function createWebhook() {
  console.log("🔗 Creating Contentful webhook...\n");

  const contentful = await import("contentful-management");
  const client = contentful.createClient({ accessToken: MGMT_TOKEN });

  const space = await client.getSpace(SPACE_ID);

  try {
    // Check if webhook already exists
    const webhooks = await space.getWebhooks();
    const existing = webhooks.items.find(
      (w: { url: string; name: string; sys: { id: string } }) =>
        w.url === `${VERCEL_URL}/webhooks/contentful` ||
        w.url.includes("content-graph-main"),
    );

    if (existing) {
      console.log("ℹ️  Webhook already exists");
      console.log(`   Name: ${existing.name}`);
      console.log(`   URL: ${existing.url}`);
      console.log(`   ID: ${existing.sys.id}`);
      return existing;
    }

    // Create new webhook
    const webhook = await space.createWebhook({
      name: "Content Graph AI Classifier",
      url: `${VERCEL_URL}/webhooks/contentful`,
      topics: [
        "Entry.publish", // Trigger on entry publish
      ],
      headers: [
        {
          key: "X-Webhook-Secret",
          value: WEBHOOK_SECRET,
        },
      ],
      filters: [
        {
          equals: [
            { doc: "sys.contentType.sys.id" },
            "aiDemoAsset", // Only trigger for aiDemoAsset content type
          ],
        },
      ],
    });

    console.log("✅ Webhook created successfully!");
    console.log(`   Name: ${webhook.name}`);
    console.log(`   URL: ${webhook.url}`);
    console.log(`   ID: ${webhook.sys.id}`);
    console.log(`   Triggers: Entry.publish (aiDemoAsset only)`);

    return webhook;
  } catch (error: unknown) {
    throw new Error(`Failed to create webhook: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  console.log("🚀 Contentful Webhook Setup\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Webhook URL: ${VERCEL_URL}/webhooks/contentful`);
  console.log(`Secret: ${WEBHOOK_SECRET}\n`);

  try {
    await createWebhook();

    console.log("\n🎉 Webhook setup complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Go to Contentful → Content → aiDemoAsset");
    console.log("   2. Open any entry");
    console.log('   3. Click "Publish"');
    console.log("   4. Check Vercel logs to see the webhook trigger");
    console.log("   5. The AI will automatically classify the content!");

    console.log("\n💡 To view webhook activity:");
    console.log(
      "   - Contentful: Settings → Webhooks → Click your webhook → Activity log",
    );
    console.log(
      "   - Vercel: https://vercel.com/zuhurahmed-1552s-projects/content-graph-main/logs",
    );
  } catch (error: unknown) {
    console.error("\n❌ Webhook creation failed:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Manual setup:");
    console.log("   1. Go to Contentful → Settings → Webhooks");
    console.log('   2. Click "Add webhook"');
    console.log(`   3. URL: ${VERCEL_URL}/webhooks/contentful`);
    console.log("   4. Triggers: Entry → publish");
    console.log("   5. Headers: X-Webhook-Secret = your-secret");
    console.log("   6. Content type filter: aiDemoAsset");
    process.exit(1);
  }
}

main();
