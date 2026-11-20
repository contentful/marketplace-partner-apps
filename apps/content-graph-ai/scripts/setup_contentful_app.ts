#!/usr/bin/env tsx
/*
  Configure Contentful App and assign Sidebar to a content type via CLI.

  Env required:
    - CONTENTFUL_SPACE_ID
    - CONTENTFUL_MANAGEMENT_TOKEN
    - CONTENTFUL_ENVIRONMENT_ID (optional, default: master)
    - CONTENTFUL_APP_ID (App Definition ID)
    - DEMO_BASE_URL (e.g., https://your-ngrok-domain.ngrok-free.app)

  Usage examples:
    - npx tsx scripts/setup_contentful_app.ts
    - npx tsx scripts/setup_contentful_app.ts --content-type aiDemoAsset
*/

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

type ContentTypeItem = { sys: { id: string } };

function parseArgs() {
  const args = process.argv.slice(2);
  const out: Record<string, string> = {};
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
    else if (a === "--help" || a === "-h") out.help = "1";
    else if (a === "--all-content-types") out["all-content-types"] = "1";
  }
  return out;
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

async function main() {
  const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "";
  const TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN || "";
  const ENV_ID =
    process.env.CONTENTFUL_ENVIRONMENT_ID ||
    process.env.CONTENTFUL_ENV_ID ||
    "master";
  const APP_ID = process.env.CONTENTFUL_APP_ID || "";
  const APP_TOKEN = process.env.CONTENT_GRAPH_APP_TOKEN?.trim() || "";
  const BASE_URL =
    process.env.DEMO_BASE_URL ||
    process.env.VERCEL_URL ||
    "https://content-graph-main.vercel.app";

  const args = parseArgs();
  const help = args.help;
  const CT_ID = args["content-type"] || "aiDemoAsset";
  const ALL_CTS = !!args["all-content-types"];

  if (help) {
    console.log(
      "Usage: npx tsx scripts/setup_contentful_app.ts [--content-type aiDemoAsset] [--all-content-types]",
    );
    process.exit(0);
  }

  if (!SPACE_ID || !TOKEN) {
    throw new Error("Set CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN");
  }
  if (!APP_ID) {
    throw new Error("Set CONTENTFUL_APP_ID to your App Definition ID");
  }
  if (!BASE_URL) {
    throw new Error("Set DEMO_BASE_URL to your externally reachable base URL");
  }

  const client = contentfulManagement.createClient({ accessToken: TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const typedSpace = space as unknown as CmaSpace;
  const typedClient = client as unknown as CmaClient;
  const SPACE_ORG_ID = typedSpace?.sys?.organization?.sys?.id || "";

  // 1) Ensure AppDefinition locations include Entry Sidebar pointing to /app/sidebar.html
  let appDef: AppDef;
  let appDefSource: "space" | "org" | "client" = "space";
  const base = BASE_URL.replace(/\/$/, "");

  if (typeof typedSpace.getAppDefinition === "function") {
    appDef = await typedSpace.getAppDefinition(APP_ID);
  } else {
    const ORG_ID = process.env.CONTENTFUL_ORG_ID || SPACE_ORG_ID;
    let org: CmaOrg | undefined;
    try {
      if (ORG_ID && typeof typedClient.getOrganization === "function") {
        org = await typedClient.getOrganization(ORG_ID);
      } else if (typeof typedClient.getOrganizations === "function") {
        const orgs = await typedClient.getOrganizations();
        if (!orgs?.items?.length)
          throw new Error("No organizations accessible to token");
        org = orgs.items[0];
      }
    } catch {
      // ignore, fallback to client-level if available
    }

    if (org && typeof org.getAppDefinition === "function") {
      appDefSource = "org";
      appDef = await org.getAppDefinition(APP_ID);
    } else if (typeof typedClient.getAppDefinition === "function") {
      appDefSource = "client";
      appDef = await typedClient.getAppDefinition(APP_ID);
    } else {
      throw new Error(
        "Unable to access App Definition via Space or Organization; set CONTENTFUL_ORG_ID or ensure token has org access.",
      );
    }
  }

  // Use the sidebar HTML as the app src so Entry Sidebar renders the correct UI
  appDef.src = `${base}/app/sidebar.html`;

  // Only define valid location objects (no per-location URLs)
  appDef.locations = [{ location: "entry-sidebar" }];
  appDef.parameters = getAppDefinitionParameters();
  await appDef.update();
  console.log(
    `✅ AppDefinition (${appDefSource}) updated → entry-sidebar (src=${base}/app/sidebar.html)`,
  );

  // 2) Ensure App is installed in the environment
  const environment = await space.getEnvironment(ENV_ID);
  let installExists = true;
  try {
    const installation = await environment.getAppInstallation(APP_ID);
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
        appToken: APP_TOKEN,
      };
      await installation.update();
      console.log(`✅ App installation parameters updated in '${ENV_ID}'`);
    } else {
      if (!APP_TOKEN && !currentToken) {
        console.log(
          "⚠️ CONTENT_GRAPH_APP_TOKEN is not set; sidebar API calls will fail in production until appToken is configured on the installation.",
        );
      }
      console.log(`ℹ️ App already installed in environment '${ENV_ID}'`);
    }
  } catch {
    installExists = false;
  }
  if (!installExists) {
    await environment.createAppInstallation(APP_ID, {
      parameters: APP_TOKEN ? { appToken: APP_TOKEN } : {},
    });
    console.log(`✅ App installed in environment '${ENV_ID}'`);
    if (!APP_TOKEN) {
      console.log(
        "⚠️ CONTENT_GRAPH_APP_TOKEN is not set; sidebar API calls will fail in production until appToken is configured on the installation.",
      );
    }
  }

  // 3) Assign app to the Entry Sidebar for target content type(s)
  async function assignToContentType(ctId: string) {
    try {
      // Validate CT exists (for clearer errors)
      await environment.getContentType(ctId);
    } catch (e: unknown) {
      console.error(
        `❌ Content type '${ctId}' not found in environment '${ENV_ID}'.`,
      );
      // List available CT IDs to help the user
      try {
        const list = await environment.getContentTypes({ limit: 1000 } as Parameters<typeof environment.getContentTypes>[0]);
        const ids = ((list as { items?: ContentTypeItem[] }).items || []).map((x) => x.sys.id).join(", ");
        console.log(`Available content types: ${ids}`);
      } catch {
        /* ignore */
      }
      throw e;
    }

    const ei = await environment.getEditorInterfaceForContentType(ctId) as unknown as EditorInterface;
    const sidebar: SidebarWidget[] = Array.isArray(ei.sidebar) ? ei.sidebar : [];
    const nextSidebar = normalizeSidebarApps(sidebar, APP_ID);
    const changed = JSON.stringify(sidebar) !== JSON.stringify(nextSidebar);
    if (changed) {
      ei.sidebar = nextSidebar;
      await ei.update();
      console.log(
        `✅ Sidebar updated: App '${APP_ID}' assigned to content type '${ctId}'`,
      );
    } else {
      console.log(
        `ℹ️ Sidebar already contains App '${APP_ID}' for content type '${ctId}'`,
      );
    }
  }

  const ENTRY_ID = args["entry-id"];
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
      `ℹ️ Assignment complete. Updated: ${updated}, skipped: ${skipped}`,
    );
  } else {
    let targetCT = CT_ID;
    if (ENTRY_ID) {
      try {
        const ent = await environment.getEntry(ENTRY_ID);
        const derived = (ent as unknown as { sys?: { contentType?: { sys?: { id?: string } } } })?.sys?.contentType?.sys?.id;
        if (derived) {
          targetCT = derived;
          console.log(
            `ℹ️ Resolved content type from entry '${ENTRY_ID}': ${targetCT}`,
          );
        }
      } catch (e: unknown) {
        console.log(
          `⚠️ Could not resolve content type from entry '${ENTRY_ID}': ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
    await assignToContentType(targetCT);
  }

  console.log(
    "🎉 Done. Open an entry of that content type and you should see the app in the Entry Sidebar.",
  );
  if (!APP_TOKEN) {
    console.log(
      "⚠️ Before sharing with testers, set CONTENT_GRAPH_APP_TOKEN in Vercel and rerun this script so the Contentful app installation gets the same appToken.",
    );
  }
}

main().catch((err) => {
  console.error("❌ Setup failed:", err?.message || err);
  process.exit(1);
});
