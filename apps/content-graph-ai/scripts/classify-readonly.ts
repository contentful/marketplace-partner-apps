import { setupEnv } from "./_shared/env.js";
setupEnv();
import { classifyContent } from "../api/_shared/tools/classificationTool.js";
import { RecursiveContentCrawler } from "../api/_shared/utils/recursiveCrawler.js";
import { logger } from "./_shared/logger.js";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";
const ACCESS_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN;

if (!SPACE_ID || !ACCESS_TOKEN) {
  console.error(
    "❌ Missing CONTENTFUL_SPACE_ID or CONTENTFUL_MANAGEMENT_TOKEN in .env",
  );
  process.exit(1);
}

async function runReadOnlyClassification() {
  console.log(
    `🚀 Starting Read-Only Classification (using CMA + Deep Crawl)...`,
  );
  console.log(`   Space: ${SPACE_ID}`);
  console.log(`   Env: ${ENV_ID}`);

  try {
    // Initialize Contentful Management Client
    const contentful = await import("contentful-management");
    const client = contentful.createClient({ accessToken: ACCESS_TOKEN! });
    const space = await client.getSpace(SPACE_ID!);
    const environment = await space.getEnvironment(ENV_ID);

    console.log(`✅ Connected to Contentful`);

    // Initialize the recursive crawler
    const crawler = new RecursiveContentCrawler(environment);

    // Fetch recent entries
    const contentTypes = [
      "componentArticle",
      "componentBlogEntry",
      "page",
      "componentCaseStudy",
    ];
    console.log(
      `\n📥 Fetching recent entries for types: ${contentTypes.join(",")}...`,
    );

    const entriesCollection = await environment.getEntries({
      limit: 5,
      "sys.contentType.sys.id[in]": contentTypes.join(","),
      order: "-sys.updatedAt",
    });

    let entries = entriesCollection.items;
    console.log(`✅ Fetched ${entries.length} entries.`);

    if (entries.length === 0) {
      console.log("⚠️ No entries found. Trying to fetch ANY entry...");
      const anyEntries = await environment.getEntries({
        limit: 3,
        order: "-sys.updatedAt",
      });
      if (anyEntries.items.length > 0) {
        console.log(
          `ℹ️ Found ${anyEntries.items.length} generic entries. Using those.`,
        );
        entries = anyEntries.items;
      } else {
        console.log("❌ No content found in this space.");
        return;
      }
    }

    // Classify each entry with DEEP CRAWLING
    for (const entry of entries) {
      const entryId = entry.sys.id;
      const contentTypeId = entry.sys.contentType.sys.id;

      console.log(`\n---------------------------------------------------`);
      console.log(`📝 Processing Entry: ${entryId} (${contentTypeId})`);

      // DEEP CRAWL: Extract text from entry AND all nested references
      console.log(`   🔍 Deep crawling nested content (max depth: 4)...`);
      const textContent = await crawler.extractTextRecursive(entry, 0, 4);

      // Get title safely
      const titleField = entry.fields.title as Record<string, unknown> | undefined;
      const nameField = entry.fields.name as Record<string, unknown> | undefined;
      const title = titleField?.["en-US"] || nameField?.["en-US"] || entryId;

      // Debug: Log if text is short
      if (!textContent || textContent.length < 10) {
        console.log("⚠️ Content very short after deep crawl.");
        console.log(
          "   Available Fields:",
          Object.keys(entry.fields).join(", "),
        );
        continue;
      }

      console.log(`   Title: ${title}`);
      console.log(
        `   Text Length: ${textContent.length} chars (after deep crawl)`,
      );

      // Classify
      const start = Date.now();
      const classification = await classifyContent({
        asset: {
          id: entryId,
          title: String(title),
          contentType: contentTypeId,
          textContent,
        },
        taxonomyVersion: "v1",
        logger,
      });
      const duration = Date.now() - start;

      console.log(`\n🧠 AI Classification Results (${duration}ms):`);
      console.log(JSON.stringify(classification, null, 2));
    }

    console.log(`\n✅ Done!`);
  } catch (error: unknown) {
    console.error("❌ Error:", error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) console.error(error.stack);
  }
}

runReadOnlyClassification();
