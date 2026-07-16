#!/usr/bin/env tsx
/**
 * Install Contentful Sidebar App
 *
 * This script programmatically installs the Content Graph Classifier app
 * in your Contentful space using the Management API.
 */

import "dotenv/config";
import type { AppDef, CmaOrg, CmaClient, CmaSpace } from "./_shared/contentfulSetupTypes.js";
import { getAppDefinitionParameters } from "./_shared/contentfulSetupTypes.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const APP_TOKEN = process.env.CONTENT_GRAPH_APP_TOKEN?.trim() || "";
const VERCEL_URL =
  process.env.VERCEL_URL || "https://content-graph-main.vercel.app";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

async function installApp() {
  console.log("📱 Installing Contentful Sidebar App...\n");

  const contentful = await import("contentful-management");
  const client = contentful.createClient({ accessToken: MGMT_TOKEN });

  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const typedSpace = space as unknown as CmaSpace;
  const typedClient = client as unknown as CmaClient;
  const SPACE_ORG_ID = typedSpace?.sys?.organization?.sys?.id || "";

  try {
    // Try to get organization first (app definitions are typically at org level)
    let org: CmaOrg | undefined;
    const ORG_ID = process.env.CONTENTFUL_ORG_ID || SPACE_ORG_ID;

    if (ORG_ID && typeof typedClient.getOrganization === "function") {
      org = await typedClient.getOrganization(ORG_ID);
    } else if (typeof typedClient.getOrganizations === "function") {
      const orgs = await typedClient.getOrganizations();
      if (orgs?.items?.length) org = orgs.items[0];
    }

    // Create app definition - try organization level first
    let appDefinition: AppDef;
    if (org && typeof org.createAppDefinition === "function") {
      appDefinition = await org.createAppDefinition({
        name: "Content Graph Classifier",
        src: `${VERCEL_URL}/app/sidebar.html`,
        locations: [{ location: "entry-sidebar" }],
        parameters: getAppDefinitionParameters(),
      });
    } else if (typeof typedSpace.createAppDefinition === "function") {
      appDefinition = await typedSpace.createAppDefinition({
        name: "Content Graph Classifier",
        src: `${VERCEL_URL}/app/sidebar.html`,
        locations: [{ location: "entry-sidebar" }],
        parameters: getAppDefinitionParameters(),
      });
    } else {
      throw new Error(
        "Cannot create App Definition. Please create it manually in Contentful UI (Settings → Apps → Create App) or ensure your token has organization access.",
      );
    }

    console.log("✅ App definition created");
    console.log(`   App ID: ${appDefinition.sys.id}`);

    // Install the app in the environment
    await environment.createAppInstallation(appDefinition.sys.id, {
      parameters: APP_TOKEN ? { appToken: APP_TOKEN } : {},
    });

    console.log("✅ App installed in environment");
    if (!APP_TOKEN) {
      console.log(
        "⚠️  CONTENT_GRAPH_APP_TOKEN is not set; sidebar API calls will fail in production until appToken is configured on the installation.",
      );
    }

    // Assign app to aiDemoAsset content type
    type ContentTypeWithMeta = { metadata?: { annotations?: { ContentType?: object[] } }; update(): Promise<void>; publish(): Promise<void> };
    const contentType = await environment.getContentType("aiDemoAsset") as unknown as ContentTypeWithMeta;

    if (!contentType.metadata) {
      contentType.metadata = { annotations: {} };
    }
    if (!contentType.metadata.annotations) {
      contentType.metadata.annotations = {};
    }
    if (!contentType.metadata.annotations.ContentType) {
      contentType.metadata.annotations.ContentType = [];
    }

    // Add app to sidebar
    const sidebarAnnotation = {
      sys: {
        id: "Contentful:AggregateRoot",
        type: "Link",
        linkType: "Annotation",
      },
    } as const;

    contentType.metadata.annotations.ContentType.push(sidebarAnnotation);

    await contentType.update();
    await contentType.publish();

    console.log("✅ App assigned to aiDemoAsset content type");

    return appDefinition;
  } catch (error: unknown) {
    if (error instanceof Error && error.message?.includes("already exists")) {
      console.log("ℹ️  App already installed");
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log("🚀 Contentful App Installer\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}`);
  console.log(`App URL: ${VERCEL_URL}/app\n`);

  try {
    await installApp();

    console.log("\n🎉 Installation complete!");
    console.log("\n📝 Next steps:");
    console.log("   1. Go to Contentful → Content → aiDemoAsset");
    console.log("   2. Open any entry");
    console.log('   3. Look for the "Content Graph Classifier" in the sidebar');
    console.log('   4. Click "Classify with AI" to test it!');
    if (!APP_TOKEN) {
      console.log(
        "   5. Set CONTENT_GRAPH_APP_TOKEN and reinstall/update the app before sharing it with other testers.",
      );
    }
  } catch (error: unknown) {
    console.error("\n❌ Installation failed:", error instanceof Error ? error.message : String(error));
    console.log("\n💡 Manual installation:");
    console.log("   1. Go to Contentful → Settings → Apps");
    console.log('   2. Click "Create App"');
    console.log(`   3. Set App URL to: ${VERCEL_URL}/app`);
    console.log('   4. Enable "Entry sidebar" location');
    console.log("   5. Assign to aiDemoAsset content type");
    process.exit(1);
  }
}

main();
