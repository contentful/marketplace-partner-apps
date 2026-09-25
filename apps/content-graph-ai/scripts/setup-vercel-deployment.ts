#!/usr/bin/env tsx
/**
 * Complete Vercel Deployment Setup
 *
 * This script sets up everything needed for the Contentful app deployment:
 * 1. Creates/updates the Contentful App Definition
 * 2. Installs the app in the environment
 * 3. Assigns the app to content types
 * 4. Creates/updates the webhook
 *
 * Usage:
 *   npx tsx scripts/setup-vercel-deployment.ts
 *   npx tsx scripts/setup-vercel-deployment.ts --content-type aiDemoAsset
 *   npx tsx scripts/setup-vercel-deployment.ts --all-content-types
 */

import "dotenv/config";
import contentfulManagement from "contentful-management";
import type {
  AppDef,
  CmaOrg,
  CmaClient,
  CmaSpace,
  SidebarWidget,
  EditorInterface,
} from "./_shared/contentfulSetupTypes.js";
import {
  normalizeSidebarApps,
  getAppDefinitionParameters,
} from "./_shared/contentfulSetupTypes.js";

const VERCEL_URL =
  process.env.VERCEL_URL || "https://content-graph-main.vercel.app";
const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";
const APP_ID = process.env.CONTENTFUL_APP_ID || "";
const APP_TOKEN = process.env.CONTENT_GRAPH_APP_TOKEN?.trim() || "";
const WEBHOOK_SECRET =
  process.env.CONTENTFUL_WEBHOOK_SECRET || "content-graph-webhook-secret";

type ContentTypeItem = { sys: { id: string } };

function getInstallationParameters() {
  return APP_TOKEN ? ({ appToken: APP_TOKEN } as Record<string, string>) : {};
}

function getInstallationParameterObject(parameters: unknown) {
  if (
    parameters &&
    typeof parameters === "object" &&
    !Array.isArray(parameters)
  ) {
    return parameters as Record<string, unknown>;
  }
  return {};
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a === "--help" || a === "-h") out.help = "1";
    else if (a === "--all-content-types") out["all-content-types"] = "1";
    else if (a === "--skip-webhook") out["skip-webhook"] = "1";
  }
  return out;
}

async function main() {
  const args = parseArgs();

  if (args.help) {
    console.log(`
Complete Vercel Deployment Setup for Contentful

Usage:
  npx tsx scripts/setup-vercel-deployment.ts [options]

Options:
  --content-type <id>     Assign app to specific content type (default: aiDemoAsset)
  --all-content-types     Assign app to all content types
  --skip-webhook          Skip webhook creation/update
  --help                  Show this help

Required Environment Variables:
  CONTENTFUL_SPACE_ID              Your Contentful space ID
  CONTENTFUL_MANAGEMENT_TOKEN     Contentful Management API token
  VERCEL_URL                      Your Vercel deployment URL (default: https://content-graph-main.vercel.app)
  
Optional Environment Variables:
  CONTENTFUL_ENV_ID               Environment ID (default: master)
  CONTENTFUL_APP_ID              Existing App Definition ID (if updating)
  CONTENTFUL_WEBHOOK_SECRET       Webhook secret (default: content-graph-webhook-secret)

Examples:
  # Setup for aiDemoAsset content type
  npx tsx scripts/setup-vercel-deployment.ts --content-type aiDemoAsset
  
  # Setup for all content types
  npx tsx scripts/setup-vercel-deployment.ts --all-content-types
  
  # Setup without webhook
  npx tsx scripts/setup-vercel-deployment.ts --skip-webhook
`);
    process.exit(0);
  }

  if (!SPACE_ID || !MGMT_TOKEN) {
    console.error("❌ Missing required environment variables:");
    console.error("   CONTENTFUL_SPACE_ID:", SPACE_ID ? "✅" : "❌");
    console.error("   CONTENTFUL_MANAGEMENT_TOKEN:", MGMT_TOKEN ? "✅" : "❌");
    console.error("\n💡 Set these in your .env file or export them:");
    console.error("   export CONTENTFUL_SPACE_ID=your-space-id");
    console.error("   export CONTENTFUL_MANAGEMENT_TOKEN=your-token");
    process.exit(1);
  }

  console.log("🚀 Complete Vercel Deployment Setup\n");
  console.log(`Vercel URL: ${VERCEL_URL}`);
  console.log(`Space ID: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}\n`);

  const client = contentfulManagement.createClient({ accessToken: MGMT_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const typedSpace = space as unknown as CmaSpace;
  const typedClient = client as unknown as CmaClient;
  const SPACE_ORG_ID = typedSpace?.sys?.organization?.sys?.id || "";

  let appDef: AppDef | undefined;
  let appId: string | undefined;

  // Step 1: Create or update App Definition
  console.log("📱 Step 1: Setting up App Definition...\n");

  if (APP_ID) {
    // Update existing app
    try {
      if (typeof typedSpace.getAppDefinition === "function") {
        appDef = await typedSpace.getAppDefinition(APP_ID);
      } else {
        const ORG_ID = process.env.CONTENTFUL_ORG_ID || SPACE_ORG_ID;
        let org: CmaOrg | undefined;
        if (ORG_ID && typeof typedClient.getOrganization === "function") {
          org = await typedClient.getOrganization(ORG_ID);
        } else if (typeof typedClient.getOrganizations === "function") {
          const orgs = await typedClient.getOrganizations();
          if (orgs?.items?.length) org = orgs.items[0];
        }

        if (org && typeof org.getAppDefinition === "function") {
          appDef = await org.getAppDefinition(APP_ID);
        } else if (typeof typedClient.getAppDefinition === "function") {
          appDef = await typedClient.getAppDefinition(APP_ID);
        } else {
          throw new Error("Cannot access App Definition");
        }
      }

      appDef!.src = `${VERCEL_URL}/app/sidebar.html`;
      appDef!.locations = [{ location: "entry-sidebar" }];
      appDef!.parameters = getAppDefinitionParameters();
      await appDef!.update();
      appId = APP_ID;
      console.log(`✅ Updated existing App Definition: ${appId}`);
    } catch (error: unknown) {
      console.error(`❌ Failed to update app: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  } else {
    // Create new app - try organization level first
    try {
      // Try to get organization
      const ORG_ID = process.env.CONTENTFUL_ORG_ID || SPACE_ORG_ID;
      let org: CmaOrg | undefined;

      if (ORG_ID && typeof typedClient.getOrganization === "function") {
        org = await typedClient.getOrganization(ORG_ID);
      } else if (typeof typedClient.getOrganizations === "function") {
        const orgs = await typedClient.getOrganizations();
        if (orgs?.items?.length) {
          org = orgs.items[0];
          console.log(`ℹ️  Using organization: ${org.name || org.sys.id}`);
        }
      }

      // Try creating at organization level (preferred)
      if (org && typeof org.createAppDefinition === "function") {
        appDef = await org.createAppDefinition({
          name: "Content Graph Classifier",
          src: `${VERCEL_URL}/app/sidebar.html`,
          locations: [{ location: "entry-sidebar" }],
          parameters: getAppDefinitionParameters(),
        });
        appId = appDef.sys.id;
        console.log(
          `✅ Created new App Definition at organization level: ${appId}`,
        );
        console.log(`   💡 Save this ID: CONTENTFUL_APP_ID=${appId}`);
      }
      // Fallback: try space level (some API versions support this)
      else if (typeof typedSpace.createAppDefinition === "function") {
        appDef = await typedSpace.createAppDefinition({
          name: "Content Graph Classifier",
          src: `${VERCEL_URL}/app/sidebar.html`,
          locations: [{ location: "entry-sidebar" }],
          parameters: getAppDefinitionParameters(),
        });
        appId = appDef.sys.id;
        console.log(`✅ Created new App Definition at space level: ${appId}`);
        console.log(`   💡 Save this ID: CONTENTFUL_APP_ID=${appId}`);
      }
      // Fallback: try client level
      else if (typeof typedClient.createAppDefinition === "function") {
        appDef = await typedClient.createAppDefinition({
          name: "Content Graph Classifier",
          src: `${VERCEL_URL}/app/sidebar.html`,
          locations: [{ location: "entry-sidebar" }],
          parameters: getAppDefinitionParameters(),
        });
        appId = appDef.sys.id;
        console.log(`✅ Created new App Definition at client level: ${appId}`);
        console.log(`   💡 Save this ID: CONTENTFUL_APP_ID=${appId}`);
      } else {
        throw new Error(
          "Cannot create App Definition. App definitions must be created via Contentful UI or organization-level API.",
        );
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (
        errMsg.includes("already exists") ||
        errMsg.includes("duplicate")
      ) {
        console.log("ℹ️  App may already exist, trying to find it...");
        // Try to find existing app by name
        let found = false;

        // Try organization level
        const ORG_ID = process.env.CONTENTFUL_ORG_ID || SPACE_ORG_ID;
        let org: CmaOrg | undefined;
        if (ORG_ID && typeof typedClient.getOrganization === "function") {
          org = await typedClient.getOrganization(ORG_ID);
        } else if (typeof typedClient.getOrganizations === "function") {
          const orgs = await typedClient.getOrganizations();
          if (orgs?.items?.length) org = orgs.items[0];
        }

        if (org && typeof org.getAppDefinitions === "function") {
          const apps = await org.getAppDefinitions();
          const existing = apps.items.find(
            (a: AppDef) => a.sys.id === APP_ID,
          );
          if (existing) {
            appDef = existing;
            appId = existing.sys.id;
            found = true;
          }
        }

        // Try space level
        if (!found && typeof typedSpace.getAppDefinitions === "function") {
          const apps = await typedSpace.getAppDefinitions();
          const existing = apps.items.find(
            (a: AppDef) => a.sys.id === APP_ID,
          );
          if (existing) {
            appDef = existing;
            appId = existing.sys.id;
            found = true;
          }
        }

        if (found && appId) {
          appDef!.src = `${VERCEL_URL}/app/sidebar.html`;
          appDef!.locations = [{ location: "entry-sidebar" }];
          await appDef!.update();
          console.log(`✅ Found and updated existing App Definition: ${appId}`);
        } else {
          console.error("❌ App may exist but could not be found via API.");
          console.error("💡 Please create the app manually in Contentful UI:");
          console.error("   1. Go to Contentful → Settings → Apps");
          console.error('   2. Click "Create App"');
          console.error(`   3. Set App URL to: ${VERCEL_URL}/app/sidebar.html`);
          console.error('   4. Enable "Entry sidebar" location');
          console.error("   5. Copy the App ID and set CONTENTFUL_APP_ID");
          console.error(
            "   6. Run this script again with CONTENTFUL_APP_ID set",
          );
          throw new Error(
            "App definition not found. Please create manually or set CONTENTFUL_APP_ID if it exists.",
          );
        }
      } else {
        console.error("❌ Failed to create app definition:", errMsg);
        console.error(
          "\n💡 Alternative: Create the app manually in Contentful UI",
        );
        console.error("   1. Go to Contentful → Settings → Apps → Create App");
        console.error(`   2. App URL: ${VERCEL_URL}/app/sidebar.html`);
        console.error("   3. Location: Entry sidebar");
        console.error("   4. Copy the App ID and set CONTENTFUL_APP_ID");
        console.error("   5. Run this script again");
        throw error;
      }
    }
  }

  if (!appId) {
    throw new Error(
      "Failed to create or find App Definition. Please set CONTENTFUL_APP_ID manually or create the app in Contentful UI.",
    );
  }
  const resolvedAppId = appId;

  // Step 2: Install app in environment
  console.log("\n📦 Step 2: Installing app in environment...\n");
  try {
    const installation = await environment.getAppInstallation(resolvedAppId);
    const currentParameters = getInstallationParameterObject(
      installation.parameters,
    );
    const currentToken =
      typeof currentParameters.appToken === "string"
        ? currentParameters.appToken
        : "";
    if (APP_TOKEN && currentToken !== APP_TOKEN) {
      installation.parameters = {
        ...currentParameters,
        ...getInstallationParameters(),
      };
      await installation.update();
      console.log(
        `✅ App installation parameters updated in environment '${ENV_ID}'`,
      );
    } else {
      if (!APP_TOKEN && !currentToken) {
        console.log(
          "⚠️  CONTENT_GRAPH_APP_TOKEN is not set; sidebar API calls will fail in production until appToken is configured on the installation.",
        );
      }
      console.log(`✅ App already installed in environment '${ENV_ID}'`);
    }
  } catch {
    await environment.createAppInstallation(resolvedAppId, {
      parameters: getInstallationParameters(),
    });
    console.log(`✅ App installed in environment '${ENV_ID}'`);
    if (!APP_TOKEN) {
      console.log(
        "⚠️  CONTENT_GRAPH_APP_TOKEN is not set; sidebar API calls will fail in production until appToken is configured on the installation.",
      );
    }
  }

  // Step 3: Assign app to content types
  console.log("\n📋 Step 3: Assigning app to content types...\n");
  const CT_ID = args["content-type"] || "aiDemoAsset";
  const ALL_CTS = !!args["all-content-types"];

  async function assignToContentType(ctId: string) {
    try {
      await environment.getContentType(ctId);
    } catch (e: unknown) {
      console.error(`❌ Content type '${ctId}' not found.`);
      try {
        const list = await environment.getContentTypes({ limit: 1000 } as Parameters<typeof environment.getContentTypes>[0]);
        const ids = ((list as { items?: ContentTypeItem[] }).items || []).map((x) => x.sys.id).join(", ");
        console.log(`Available content types: ${ids}`);
      } catch {
        /* intentional — best-effort diagnostic */
      }
      throw e;
    }

    const ei = await environment.getEditorInterfaceForContentType(ctId) as unknown as EditorInterface;
    const sidebar: SidebarWidget[] = Array.isArray(ei.sidebar) ? ei.sidebar : [];
    const nextSidebar = normalizeSidebarApps(sidebar, resolvedAppId);
    const changed = JSON.stringify(sidebar) !== JSON.stringify(nextSidebar);

    if (changed) {
      ei.sidebar = nextSidebar;
      await ei.update();
      console.log(`✅ App assigned to content type '${ctId}'`);
    } else {
      console.log(`ℹ️  App already assigned to content type '${ctId}'`);
    }
  }

  if (ALL_CTS) {
    const list = await environment.getContentTypes({ limit: 1000 } as Parameters<typeof environment.getContentTypes>[0]);
    const listTyped = list as { items?: ContentTypeItem[] };
    let updated = 0,
      skipped = 0;
    for (const ct of listTyped.items || []) {
      try {
        await assignToContentType(ct.sys.id);
        updated++;
      } catch {
        skipped++;
      }
    }
    console.log(
      `\n✅ Assignment complete. Updated: ${updated}, skipped: ${skipped}`,
    );
  } else {
    await assignToContentType(CT_ID);
  }

  // Step 4: Create/update webhook
  if (!args["skip-webhook"]) {
    console.log("\n🔗 Step 4: Setting up webhook...\n");
    try {
      const webhooks = await space.getWebhooks();
      type WebhookHeader = { key: string; value: string };
      type Webhook = { name: string; url: string; headers?: WebhookHeader[]; sys: { id: string }; update(): Promise<void> };
      const existing = (webhooks.items as unknown as Webhook[]).find(
        (w) =>
          w.name === "Content Graph AI Classifier" ||
          w.url.includes("content-graph-main"),
      );

      if (existing) {
        existing.url = `${VERCEL_URL}/webhooks/contentful`;
        if (existing.headers) {
          const secretHeader = existing.headers.find(
            (h: WebhookHeader) => h.key === "X-Webhook-Secret",
          );
          if (secretHeader) {
            secretHeader.value = WEBHOOK_SECRET;
          } else {
            existing.headers.push({
              key: "X-Webhook-Secret",
              value: WEBHOOK_SECRET,
            });
          }
        } else {
          existing.headers = [
            { key: "X-Webhook-Secret", value: WEBHOOK_SECRET },
          ];
        }
        await existing.update();
        console.log(`✅ Updated existing webhook: ${existing.sys.id}`);
        console.log(`   URL: ${existing.url}`);
      } else {
        const webhook = await space.createWebhook({
          name: "Content Graph AI Classifier",
          url: `${VERCEL_URL}/webhooks/contentful`,
          topics: ["Entry.publish"],
          headers: [{ key: "X-Webhook-Secret", value: WEBHOOK_SECRET }],
          filters: [
            {
              equals: [{ doc: "sys.contentType.sys.id" }, CT_ID],
            },
          ],
        });
        console.log(`✅ Created webhook: ${webhook.sys.id}`);
        console.log(`   URL: ${webhook.url}`);
        console.log(`   Triggers: Entry.publish (${CT_ID} only)`);
      }
    } catch (error: unknown) {
      console.error(`⚠️  Webhook setup failed: ${error instanceof Error ? error.message : String(error)}`);
      console.log(
        "   You can set it up manually later or run: npx tsx scripts/create-webhook.ts",
      );
    }
  }

  // Summary
  console.log("\n🎉 Setup Complete!\n");
  console.log("📝 Summary:");
  console.log(`   App ID: ${appId}`);
  console.log(`   App URL: ${VERCEL_URL}/app/sidebar.html`);
  console.log(`   Webhook: ${VERCEL_URL}/webhooks/contentful`);
  console.log(`   Content Type: ${ALL_CTS ? "All" : CT_ID}`);
  console.log("\n✅ Next Steps:");
  console.log("   1. Go to Contentful → Content → Open any entry");
  console.log('   2. Look for "Content Graph Classifier" in the sidebar');
  console.log('   3. Click "Classify with AI" to test');
  console.log("\n💡 Environment Variables to set in Vercel:");
  console.log(`   CONTENTFUL_APP_ID=${appId}`);
  console.log(`   CONTENTFUL_WEBHOOK_SECRET=${WEBHOOK_SECRET}`);
  if (APP_TOKEN) {
    console.log(
      "   CONTENT_GRAPH_APP_TOKEN=<already synced to app installation>",
    );
  } else {
    console.log(
      "   CONTENT_GRAPH_APP_TOKEN=<set this, then rerun to sync app installation auth>",
    );
  }
  console.log(
    "   (Plus your existing CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN, etc.)",
  );
}

main().catch((err) => {
  console.error("\n❌ Setup failed:", err?.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
