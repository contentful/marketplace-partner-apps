#!/usr/bin/env tsx
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
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
const TAG_ID = process.env.CONTENTFUL_REVIEW_TAG_ID || "needs-human-review";
const TAG_NAME = process.env.CONTENTFUL_REVIEW_TAG_NAME || "Needs Human Review";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required env vars: CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

async function fetchJson(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  const res = await fetch(url, init);
  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    throw new Error(typeof json?.message === "string" ? json.message : `HTTP ${res.status}`);
  }
  return json;
}

async function main() {
  const baseUrl = `https://api.contentful.com/spaces/${SPACE_ID}/environments/${ENV_ID}/tags`;
  console.log(`🏷️ Ensuring review tag "${TAG_ID}" in ${SPACE_ID}/${ENV_ID}`);

  const existing = await fetchJson(baseUrl, {
    headers: {
      Authorization: `Bearer ${MGMT_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    },
  });

  const items = Array.isArray(existing?.items) ? existing.items as Array<{ sys?: { id?: string } }> : [];
  const found = items.find((item) => item?.sys?.id === TAG_ID);
  if (found) {
    console.log(`✅ Tag already exists: ${TAG_ID}`);
    return;
  }

  await fetchJson(`${baseUrl}/${TAG_ID}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${MGMT_TOKEN}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
      "X-Contentful-Version": "0",
    },
    body: JSON.stringify({
      name: TAG_NAME,
      sys: { id: TAG_ID },
    }),
  });

  console.log(`✅ Created tag: ${TAG_ID} (${TAG_NAME})`);
}

main().catch((error) => {
  console.error(`❌ ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
