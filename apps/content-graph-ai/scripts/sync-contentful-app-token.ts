#!/usr/bin/env tsx

import "dotenv/config";
import fs from "node:fs";
import crypto from "node:crypto";
import contentfulManagement from "contentful-management";

const APP_ID = process.env.CONTENTFUL_APP_ID || "";
const SPACE_ID = process.env.CONTENTFUL_SPACE_ID || "";
const ENV_ID =
  process.env.CONTENTFUL_ENV_ID ||
  process.env.CONTENTFUL_ENVIRONMENT_ID ||
  "master";
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN || "";
const VERCEL_ENV_FILE = process.env.VERCEL_ENV_FILE || "";

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function readTokenFromEnvFile(path: string) {
  const text = fs.readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith("CONTENT_GRAPH_APP_TOKEN=")) continue;
    const raw = line.slice("CONTENT_GRAPH_APP_TOKEN=".length).trim();
    if (raw.startsWith('"') && raw.endsWith('"')) {
      return raw.slice(1, -1);
    }
    return raw;
  }
  return "";
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
  if (!APP_ID || !SPACE_ID || !ENV_ID || !MGMT_TOKEN || !VERCEL_ENV_FILE) {
    throw new Error(
      "Missing required env: CONTENTFUL_APP_ID, CONTENTFUL_SPACE_ID, CONTENTFUL_ENV_ID, CONTENTFUL_MANAGEMENT_TOKEN, VERCEL_ENV_FILE",
    );
  }

  const appToken = readTokenFromEnvFile(VERCEL_ENV_FILE);
  if (!appToken) {
    throw new Error(
      `CONTENT_GRAPH_APP_TOKEN not found in VERCEL_ENV_FILE=${VERCEL_ENV_FILE}`,
    );
  }

  const client = contentfulManagement.createClient({ accessToken: MGMT_TOKEN });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const installation = await environment.getAppInstallation(APP_ID);
  const currentParameters = getInstallationParameterObject(
    installation.parameters,
  );

  installation.parameters = {
    ...currentParameters,
    appToken,
  };

  await installation.update();

  const refreshed = await environment.getAppInstallation(APP_ID);
  const refreshedParameters = getInstallationParameterObject(
    refreshed.parameters,
  );
  const refreshedToken =
    typeof refreshedParameters.appToken === "string"
      ? refreshedParameters.appToken
      : "";

  console.log(
    JSON.stringify(
      {
        appId: APP_ID,
        environment: ENV_ID,
        expectedSha256: sha256(appToken),
        contentfulSha256: sha256(refreshedToken),
        contentfulUpdatedAt: refreshed.sys.updatedAt || null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
