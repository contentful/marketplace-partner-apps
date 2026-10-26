#!/usr/bin/env tsx
/**
 * Scrape Contentful Website and Import Content
 *
 * This script scrapes blog posts from Contentful's website
 * and imports them into your Contentful space.
 */

import "dotenv/config";
import * as cheerio from "cheerio";

const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
const MGMT_TOKEN = process.env.CONTENTFUL_MANAGEMENT_TOKEN!;
const ENV_ID = process.env.CONTENTFUL_ENV_ID || "master";

if (!SPACE_ID || !MGMT_TOKEN) {
  console.error("❌ Missing required environment variables");
  process.exit(1);
}

async function scrapeBlogPosts(limit = 10) {
  console.log("🔍 Scraping Contentful blog...\n");

  const blogUrl = "https://www.contentful.com/blog/";
  const response = await fetch(blogUrl);
  const html = await response.text();
  const $ = cheerio.load(html);

  const posts: Array<{ title: string; url: string; summary: string }> = [];

  // Find blog post links
  $('a[href*="/blog/"]').each((i, elem) => {
    if (posts.length >= limit) return false;

    const href = $(elem).attr("href");
    if (!href || href === "/blog/" || href.includes("#")) return;

    const fullUrl = href.startsWith("http")
      ? href
      : `https://www.contentful.com${href}`;
    const title = $(elem).text().trim();

    if (title && title.length > 10 && !posts.find((p) => p.url === fullUrl)) {
      posts.push({
        title: title.substring(0, 200),
        url: fullUrl,
        summary: `Blog post from Contentful: ${title.substring(0, 100)}`,
      });
    }
  });

  console.log(`✅ Found ${posts.length} blog posts\n`);
  return posts.slice(0, limit);
}

async function importToContentful(
  posts: Array<{ title: string; url: string; summary: string }>,
) {
  console.log("📤 Importing to Contentful...\n");

  const contentful = await import("contentful-management");
  const client = contentful.createClient({ accessToken: MGMT_TOKEN });

  const space = await client.getSpace(SPACE_ID);
  const environment = await space.getEnvironment(ENV_ID);

  let created = 0;
  let updated = 0;

  for (const post of posts) {
    try {
      // Create a simple ID from the URL
      const entryId = `blog-${post.url
        .split("/")
        .filter(Boolean)
        .pop()
        ?.replace(/[^a-zA-Z0-9]/g, "-")
        .substring(0, 50)}`;

      type ExistingEntry = { fields: Record<string, unknown>; update(): Promise<ExistingEntry>; publish(): Promise<void> };
      // Check if entry already exists
      let existing: ExistingEntry | null = null;
      try {
        existing = (await environment.getEntry(entryId)) as unknown as ExistingEntry;
      } catch {
        // Entry doesn't exist; we'll create it below
      }

      // Fetch full article content for body + improved summary
      let bodyText = "";
      try {
        const articleRes = await fetch(post.url);
        const articleHtml = await articleRes.text();
        const $page = cheerio.load(articleHtml);

        // Heuristic: prefer <main>, then <article>, then all <p>
        const main = $page("main");
        const article = $page("article");
        const paras: string[] = [];

        const root = main.length
          ? main
          : article.length
            ? article
            : $page("body");
        root.find("p").each((_, el) => {
          const t = $page(el).text().trim();
          if (t && t.length > 40) paras.push(t);
        });

        bodyText = paras.join("\n\n");
      } catch {
        // Fall back to the homepage summary if article fetch fails
        bodyText = post.summary || "";
      }

      const fullSummary = bodyText
        ? bodyText.split(/\n+/).join(" ").slice(0, 480)
        : post.summary;

      // Minimal Rich Text document from body text
      const richBody =
        bodyText.trim().length === 0
          ? undefined
          : {
              nodeType: "document",
              data: {},
              content: bodyText.split(/\n{2,}/).map((para) => ({
                nodeType: "paragraph",
                data: {},
                content: [
                  {
                    nodeType: "text",
                    value: para,
                    marks: [],
                    data: {},
                  },
                ],
              })),
            };

      const newFields: Record<string, unknown> = {
        title: { "en-US": post.title },
        url: { "en-US": post.url },
        summary: { "en-US": fullSummary },
        ...(richBody ? { body: { "en-US": richBody } } : {}),
      };

      let entry;
      if (existing) {
        // Merge into existing entry
        entry = existing;
        entry.fields = { ...(entry.fields || {}), ...newFields };
        entry = await entry.update();
        // Optional: publish updated entry — intentionally swallow publish errors
        try {
          await entry.publish();
        } catch {
          /* intentional */
        }
        updated++;
        console.log(`   ✏️  Updated: ${post.title.substring(0, 50)}...`);
      } else {
        // Create new entry
        entry = await environment.createEntryWithId("aiDemoAsset", entryId, {
          fields: newFields,
        });
        try {
          await entry.publish();
        } catch {
          /* intentional */
        }
        created++;
        console.log(`   ✓ Created: ${post.title.substring(0, 50)}...`);
      }

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error: unknown) {
      console.error(
        `   ✗ Failed: ${post.title.substring(0, 50)}... - ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  return { created, updated };
}

async function main() {
  console.log("🚀 Contentful Website Scraper\n");
  console.log(`Space: ${SPACE_ID}`);
  console.log(`Environment: ${ENV_ID}\n`);

  try {
    const posts = await scrapeBlogPosts(15);
    const { created, updated } = await importToContentful(posts);

    console.log("\n🎉 Import complete!");
    console.log(`   Created: ${created}`);
    console.log(`   Updated: ${updated}`);
    console.log("\n📝 Next steps:");
    console.log("   1. Go to Contentful and view the imported entries");
    console.log("   2. Use the Sidebar App to classify them");
    console.log("   3. Publish an entry to test the webhook");
  } catch (error) {
    console.error("\n❌ Scraping failed:", error);
    process.exit(1);
  }
}

main();
