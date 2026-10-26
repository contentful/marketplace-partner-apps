#!/usr/bin/env tsx
/**
 * Setup Taxonomy Concepts
 *
 * Creates all required taxonomy concept schemes and concepts in the Contentful organization
 * if they don't already exist. Uses the organization-level Taxonomy API.
 *
 * Usage:
 *   npx tsx scripts/setup-taxonomy.ts [--dry-run]
 *
 * Environment variables:
 *   CONTENTFUL_SPACE_ID - Space ID (used to find organization ID)
 *   CONTENTFUL_MANAGEMENT_TOKEN or CONTENTFUL_ACCESS_TOKEN - Management API token
 */
import "dotenv/config";
import { config as dotenvConfig } from "dotenv";
import contentfulManagement from "contentful-management";
import {
  FULL_TAXONOMY_DEFINITION,
  normalizeTaxonomyLabel,
} from "../api/_shared/config/taxonomyDefinition.js";

dotenvConfig({ path: ".env.production.local", override: false });
dotenvConfig({ path: ".vercel/.env.production.local", override: true });

const argv = process.argv.slice(2);
const hasFlag = (name: string) => argv.includes(name);
const dryRun = hasFlag("--dry-run");
const MAX_CONTENTFUL_RETRIES = 5;

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN =
  process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
  process.env.CONTENTFUL_ACCESS_TOKEN;

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error(
    "❌ Missing required env vars: CONTENTFUL_SPACE_ID and CONTENTFUL_MANAGEMENT_TOKEN",
  );
  process.exit(1);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(
  params: { url: string; token: string; method?: string; body?: Record<string, unknown> },
  attempt = 0,
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${params.token}`,
    "Content-Type": "application/vnd.contentful.management.v1+json",
  };

  const res = await fetch(params.url, {
    method: params.method || "GET",
    headers,
    body: params.body ? JSON.stringify(params.body) : undefined,
  });

  const text = await res.text();
  let json: Record<string, unknown>;
  try {
    json = JSON.parse(text) as Record<string, unknown>;
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    if (res.status === 429 && attempt < MAX_CONTENTFUL_RETRIES) {
      const resetHeader = Number(
        res.headers.get("x-contentful-ratelimit-reset") || "1",
      );
      const waitMs = Math.max(resetHeader, 1) * 1000 + attempt * 750;
      console.warn(`⏳ Contentful rate limit hit. Retrying in ${waitMs}ms...`);
      await sleep(waitMs);
      return fetchJson(params, attempt + 1);
    }
    const msg =
      typeof json?.message === "string" ? json.message : `HTTP ${res.status}`;
    throw new Error(`Contentful API error: ${msg} (${res.status})`);
  }

  return json;
}

async function fetchAllPages(params: {
  url: string;
  token: string;
}): Promise<Record<string, unknown>[]> {
  const limit = 200;
  let skip = 0;
  const items: Record<string, unknown>[] = [];
  while (true) {
    const pageUrl = new URL(params.url);
    pageUrl.searchParams.set("limit", String(limit));
    pageUrl.searchParams.set("skip", String(skip));
    const page = await fetchJson({
      url: pageUrl.toString(),
      token: params.token,
    });
    const batch: Record<string, unknown>[] = Array.isArray(page?.items) ? page.items as Record<string, unknown>[] : [];
    items.push(...batch);
    if (batch.length < limit) break;
    skip += batch.length;
  }
  return items;
}

async function main() {
  console.log("🏷️  Contentful Taxonomy Setup\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Dry run: ${dryRun}\n`);

  // Get organization ID from space
  const client = contentfulManagement.createClient({
    accessToken: MGMT_TOKEN!,
  });
  const space = await client.getSpace(SPACE_ID);
  const orgId = (space as unknown as { sys?: { organization?: { sys?: { id?: string } } } })?.sys?.organization?.sys?.id;

  if (!orgId) {
    console.error("❌ Could not find organization ID for space");
    process.exit(1);
  }
  console.log(`Organization: ${orgId}\n`);

  const baseUrl = `https://api.contentful.com/organizations/${orgId}/taxonomy`;

  // Fetch existing schemes and concepts
  console.log("📥 Fetching existing taxonomy...");
  const existingSchemes = await fetchAllPages({
    url: `${baseUrl}/concept-schemes`,
    token: MGMT_TOKEN!,
  });
  const existingConcepts = await fetchAllPages({
    url: `${baseUrl}/concepts`,
    token: MGMT_TOKEN!,
  });

  type SchemeItem = { sys: { id: string }; prefLabel?: Record<string, string> };
  type ConceptItem = { sys: { id: string }; prefLabel?: Record<string, string>; conceptSchemes?: Array<{ sys?: { id?: string } }> };
  const schemeIds = new Set(existingSchemes.map((s) => (s as SchemeItem).sys.id));
  const schemeLabels = new Map(
    existingSchemes.map((scheme) => {
      const s = scheme as SchemeItem;
      return [
        normalizeTaxonomyLabel(
          s?.prefLabel?.["en-US"] || s?.prefLabel?.["en"] || "",
        ),
        s.sys.id,
      ];
    }),
  );
  const conceptIds = new Set(existingConcepts.map((c) => (c as ConceptItem).sys.id));
  const conceptsBySchemeAndLabel = new Set(
    existingConcepts.flatMap((concept) => {
      const c = concept as ConceptItem;
      const label = normalizeTaxonomyLabel(
        c?.prefLabel?.["en-US"] || c?.prefLabel?.["en"] || "",
      );
      const schemes = Array.isArray(c?.conceptSchemes)
        ? c.conceptSchemes
        : [];
      return schemes.map(
        (schemeLink) => `${schemeLink?.sys?.id || ""}:${label}`,
      );
    }),
  );

  console.log(
    `  Found ${existingSchemes.length} schemes, ${existingConcepts.length} concepts\n`,
  );

  let schemesCreated = 0;
  let conceptsCreated = 0;
  let schemesSkipped = 0;
  let conceptsSkipped = 0;

  // Process each scheme
  for (const schemeDef of FULL_TAXONOMY_DEFINITION) {
    console.log(`\n📂 ${schemeDef.schemeLabel} (${schemeDef.schemeId})`);
    const existingSchemeId = schemeIds.has(schemeDef.schemeId)
      ? schemeDef.schemeId
      : schemeLabels.get(normalizeTaxonomyLabel(schemeDef.schemeLabel));
    const targetSchemeId = existingSchemeId || schemeDef.schemeId;

    // Check if scheme exists
    if (existingSchemeId) {
      console.log(`  ✅ Scheme exists`);
      schemesSkipped++;
    } else {
      console.log(`  ⚡ Creating scheme...`);
      if (!dryRun) {
        try {
          await fetchJson({
            url: `${baseUrl}/concept-schemes`,
            token: MGMT_TOKEN!,
            method: "PUT",
            body: {
              sys: { id: schemeDef.schemeId },
              prefLabel: { "en-US": schemeDef.schemeLabel },
            },
          });
          console.log(`  ✅ Created scheme`);
          schemesCreated++;
          schemeIds.add(targetSchemeId);
          schemeLabels.set(
            normalizeTaxonomyLabel(schemeDef.schemeLabel),
            targetSchemeId,
          );
        } catch {
          // Try POST if PUT fails
          try {
            await fetchJson({
              url: `${baseUrl}/concept-schemes`,
              token: MGMT_TOKEN!,
              method: "POST",
              body: {
                sys: { id: schemeDef.schemeId },
                prefLabel: { "en-US": schemeDef.schemeLabel },
              },
            });
            console.log(`  ✅ Created scheme (POST)`);
            schemesCreated++;
            schemeIds.add(targetSchemeId);
            schemeLabels.set(
              normalizeTaxonomyLabel(schemeDef.schemeLabel),
              targetSchemeId,
            );
          } catch (e2: unknown) {
            console.log(`  ⚠️ Failed to create scheme: ${e2 instanceof Error ? e2.message : String(e2)}`);
          }
        }
      } else {
        console.log(`  [DRY RUN] Would create scheme`);
        schemesCreated++;
      }
    }

    // Process concepts within the scheme
    for (const conceptDef of schemeDef.concepts) {
      const conceptKey = `${targetSchemeId}:${normalizeTaxonomyLabel(conceptDef.label)}`;
      if (
        conceptIds.has(conceptDef.id) ||
        conceptsBySchemeAndLabel.has(conceptKey)
      ) {
        console.log(`    ✅ "${conceptDef.label}" exists`);
        conceptsSkipped++;
      } else {
        console.log(`    ⚡ Creating "${conceptDef.label}"...`);
        if (!dryRun) {
          try {
            await fetchJson({
              url: `${baseUrl}/concepts`,
              token: MGMT_TOKEN!,
              method: "PUT",
              body: {
                sys: { id: conceptDef.id },
                prefLabel: { "en-US": conceptDef.label },
                conceptSchemes: [
                  {
                    sys: {
                      type: "Link",
                      linkType: "TaxonomyConceptScheme",
                      id: targetSchemeId,
                    },
                  },
                ],
              },
            });
            console.log(`    ✅ Created`);
            conceptsCreated++;
            conceptIds.add(conceptDef.id);
            conceptsBySchemeAndLabel.add(conceptKey);
          } catch {
            // Try POST if PUT fails
            try {
              await fetchJson({
                url: `${baseUrl}/concepts`,
                token: MGMT_TOKEN!,
                method: "POST",
                body: {
                  sys: { id: conceptDef.id },
                  prefLabel: { "en-US": conceptDef.label },
                  conceptSchemes: [
                    {
                      sys: {
                        type: "Link",
                        linkType: "TaxonomyConceptScheme",
                        id: targetSchemeId,
                      },
                    },
                  ],
                },
              });
              console.log(`    ✅ Created (POST)`);
              conceptsCreated++;
              conceptIds.add(conceptDef.id);
              conceptsBySchemeAndLabel.add(conceptKey);
            } catch (e2: unknown) {
              console.log(`    ⚠️ Failed: ${e2 instanceof Error ? e2.message : String(e2)}`);
            }
          }
        } else {
          console.log(`    [DRY RUN] Would create concept`);
          conceptsCreated++;
        }
      }
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Summary");
  console.log("=".repeat(50));
  console.log(
    `Schemes: ${schemesCreated} created, ${schemesSkipped} already existed`,
  );
  console.log(
    `Concepts: ${conceptsCreated} created, ${conceptsSkipped} already existed`,
  );

  if (dryRun) {
    console.log("\n⚠️ This was a dry run. No changes were made.");
    console.log("Run without --dry-run to actually create the taxonomy.");
  } else {
    console.log("\n✅ Taxonomy setup complete!");
  }
}

main().catch((e) => {
  console.error("❌ Fatal error:", e?.message || e);
  process.exit(1);
});
