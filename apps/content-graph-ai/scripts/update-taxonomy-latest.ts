#!/usr/bin/env tsx
import { setupEnv } from "./_shared/env.js";
setupEnv();
import contentfulManagement from "contentful-management";
import {
  batchClassifyContent,
  type AllowedTaxonomyLabels,
} from "../api/_shared/tools/classificationTool.js";
import { updateContentfulEntryWithClassification } from "../api/_shared/tools/contentfulAppTool.js";
import { RecursiveContentCrawler } from "../api/_shared/utils/recursiveCrawler.js";
import { loadOrganizationTaxonomy } from "../api/_shared/tools/contentfulTaxonomyTool.js";
import { logger } from "./_shared/logger.js";

const argv = process.argv.slice(2);
const argValue = (name: string): string | undefined => {
  const idx = argv.indexOf(name);
  if (idx === -1) return undefined;
  return argv[idx + 1];
};
const hasFlag = (name: string) => argv.includes(name);

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

const limit = Number(argValue("--limit") || process.env.LIMIT || 15);
const concurrency = Number(
  argValue("--concurrency") || process.env.CONCURRENCY || 5,
);
const publish =
  hasFlag("--publish") ||
  String(process.env.PUBLISH || "").toLowerCase() === "true";
const dryRun =
  hasFlag("--dry-run") ||
  String(process.env.DRY_RUN || "").toLowerCase() === "true";
const taxonomyOnly =
  hasFlag("--taxonomy-only") ||
  String(process.env.TAXONOMY_ONLY || "").toLowerCase() === "true";

const minChars = Number(
  argValue("--min-chars") || process.env.MIN_CHARS || 300,
);
const minWords = Number(argValue("--min-words") || process.env.MIN_WORDS || 60);
const minNonTitleWords = Number(
  argValue("--min-non-title-words") || process.env.MIN_NON_TITLE_WORDS || 40,
);

const contentTypesArg =
  argValue("--content-types") || process.env.CONTENT_TYPES;
const contentTypeArg = argValue("--content-type") || process.env.CONTENT_TYPE;
const contentTypes = (contentTypesArg || contentTypeArg || "page")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

const order = argValue("--order") || process.env.ORDER || "-sys.updatedAt";
const locale = argValue("--locale") || process.env.LOCALE || "en-US";

async function main() {
  console.log("🧭 Update taxonomy for latest entries\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}`);
  console.log(`Content types: ${contentTypes.join(", ")}`);
  console.log(`Limit: ${limit}`);
  console.log(`Order: ${order}`);
  console.log(`Publish: ${publish}`);
  console.log(`Dry run: ${dryRun}`);
  console.log(`Taxonomy only: ${taxonomyOnly}`);
  console.log(`Min chars: ${minChars}`);
  console.log(`Min words: ${minWords}`);
  console.log(`Min non-title words: ${minNonTitleWords}`);

  const client = contentfulManagement.createClient({
    accessToken: MGMT_TOKEN!,
  });
  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  const orgId = (space as unknown as { sys?: { organization?: { sys?: { id?: string } } } })?.sys?.organization?.sys?.id;
  const allowedLabels: AllowedTaxonomyLabels | undefined = orgId
    ? await (async () => {
        const taxonomy = await loadOrganizationTaxonomy({
          orgId,
          token: MGMT_TOKEN!,
        });
        const labelFor = (c: { prefLabel?: Record<string, string | undefined> }) =>
          c?.prefLabel?.["en-US"] || c?.prefLabel?.["en"] || "";
        const labelsByScheme = (schemeId: string) =>
          (taxonomy.conceptsBySchemeId.get(schemeId) || [])
            .map((c) => labelFor(c))
            .filter(Boolean)
            .sort();
        return {
          assetSubType: labelsByScheme("6iTmYSodF3GoSjR8RsizS0"),
          topic: labelsByScheme("topic"),
          product: labelsByScheme("productName"),
          jobLevel: labelsByScheme("jobLevel"),
          jobFunction: labelsByScheme("jobFunction"),
          useCases: labelsByScheme("useCase"),
          funnelStage: labelsByScheme("funnelStage"),
          industry: labelsByScheme("industry"),
          companySize: labelsByScheme("companySize"),
          region: labelsByScheme("region"),
          language: labelsByScheme("language"),
          audience: labelsByScheme("persona"),
        };
      })()
    : undefined;

  const query: Record<string, string | number | boolean> = {
    limit,
    order,
    "sys.publishedAt[exists]": true,
  };
  if (contentTypes.length === 1) query.content_type = contentTypes[0];
  else query["sys.contentType.sys.id[in]"] = contentTypes.join(",");

  console.log("\n🔎 Fetching latest entries...");
  const entriesCollection = await environment.getEntries(query);
  const entries = entriesCollection.items;
  console.log(`✅ Fetched ${entries.length} entries.`);
  if (entries.length === 0) return;

  const crawler = new RecursiveContentCrawler(environment as import("contentful-management").Environment);
  const assetsToProcess: Array<{
    id: string;
    title?: string;
    contentType: string;
    textContent: string;
  }> = [];

  for (const entry of entries) {
    const title =
      entry.fields?.title?.[locale] ||
      entry.fields?.nameInternal?.[locale] ||
      entry.fields?.name?.[locale] ||
      entry.sys.id;
    const contentTypeId = entry.sys.contentType?.sys?.id || "unknown";
    const rawText = await crawler.extractTextRecursive(entry, 0, 4);
    const fullText = rawText.replace(/\s+/g, " ").trim();

    const normalizedTitle = String(title || "").trim();
    const nonTitleText = normalizedTitle
      ? fullText.split(normalizedTitle).join(" ").replace(/\s+/g, " ").trim()
      : fullText;
    const wordCount = fullText.split(/\s+/).filter(Boolean).length;
    const nonTitleWords = nonTitleText.split(/\s+/).filter(Boolean).length;

    if (
      !fullText ||
      fullText.length < minChars ||
      wordCount < minWords ||
      nonTitleWords < minNonTitleWords
    ) {
      logger.warn("Skipping entry (insufficient content beyond title)", {
        entryId: entry.sys.id,
        contentTypeId,
        chars: fullText.length,
        words: wordCount,
        nonTitleWords,
      });
      continue;
    }

    assetsToProcess.push({
      id: entry.sys.id,
      title: String(title),
      contentType: contentTypeId,
      textContent: fullText,
    });
  }

  console.log(`\n🧠 Classifying ${assetsToProcess.length} entries...`);
  const classificationResults = await batchClassifyContent({
    assets: assetsToProcess,
    concurrency,
    allowedLabels,
    logger,
  });

  if (dryRun) {
    console.log("\n🧪 Dry run only (no Contentful updates performed).");
    console.log(`Classified: ${classificationResults.summary.total}`);
    console.log(
      `Needing review: ${classificationResults.summary.needingReview}`,
    );
    console.log(
      `Avg confidence: ${classificationResults.summary.avgConfidence}`,
    );
    return;
  }

  console.log("\n💾 Updating Contentful entries (metadata.concepts)...");
  let updated = 0;
  let published = 0;
  let failed = 0;

  for (const result of classificationResults.results) {
    try {
      const resp = await updateContentfulEntryWithClassification({
        entryId: result.assetId,
        classification: result,
        locale,
        publish,
        writeFields: !taxonomyOnly,
        logger,
      });
      updated++;
      const respTyped = resp as { published?: boolean } | undefined;
      if (respTyped?.published) published++;
      logger.info("Updated entry", {
        entryId: result.assetId,
        published: !!respTyped?.published,
      });
    } catch (e: unknown) {
      failed++;
      logger.error("Failed to update entry", {
        entryId: result.assetId,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  console.log("\n✅ Done");
  console.log(`Updated: ${updated}`);
  console.log(`Published: ${published}`);
  console.log(`Failed: ${failed}`);
}

main().catch((e) => {
  console.error("❌ Fatal error:", e?.message || e);
  process.exit(1);
});
