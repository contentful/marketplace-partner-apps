#!/usr/bin/env tsx
import { config } from "dotenv";
import { resolve } from "path";

config({
  path: resolve(process.cwd(), ".env.production.local"),
  override: false,
});
config({
  path: resolve(process.cwd(), ".vercel/.env.production.local"),
  override: true,
});
config({ path: resolve(process.cwd(), ".env.local"), override: false });

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
  process.env.CONTENTFUL_ACCESS_TOKEN;

import contentfulManagement from "contentful-management";

async function checkContentType() {
  const client = contentfulManagement.createClient({
    accessToken: MGMT_TOKEN!,
  });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);
  const contentType = await environment.getContentType("aiDemoAsset");

  console.log("\n📋 Current fields in aiDemoAsset:");
  contentType.fields.forEach((field: { id: string; name: string }) => {
    console.log(`  - ${field.id} (${field.name})`);
  });
}

checkContentType().catch(console.error);
