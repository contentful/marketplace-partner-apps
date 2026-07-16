import { PIIScrubber } from "../utils/piiScrubber.js";
import type { Logger } from "../types.js";
import { createContentfulManagementClient } from "../utils/contentfulManagementClient.js";

export type ContentAsset = {
  id: string;
  title?: string;
  description?: string;
  contentType: string;
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
  textContent: string;
};

/**
 * Extract text content from Contentful entry fields, removing PII
 */
export function extractTextContent(
  fields: Record<string, unknown>,
  contentTypeId: string,
  logger?: Logger,
): string {
  const textFields: string[] = [];
  let totalPiiDetected = false;
  const allRedactedTypes: string[] = [];

  try {
    // Extract text from common field types
    Object.entries(fields).forEach(([fieldName, fieldData]) => {
      if (!fieldData || typeof fieldData !== "object") return;

      const typedFieldData = fieldData as Record<string, unknown>;
      const fieldValue =
        typedFieldData["en-US"] || typedFieldData[Object.keys(typedFieldData)[0]];

      if (typeof fieldValue === "string") {
        // Skip fields that are obviously PII by name
        const piiFields = [
          "email",
          "phone",
          "address",
          "ssn",
          "password",
          "token",
          "key",
        ];
        if (piiFields.some((pii) => fieldName.toLowerCase().includes(pii))) {
          logger?.info(`🔒 [ContentfulTool] Skipping PII field: ${fieldName}`);
          return;
        }

        // Scrub PII from the field value
        const scrubResult = PIIScrubber.scrubContent(fieldValue);
        if (scrubResult.piiDetected) {
          totalPiiDetected = true;
          allRedactedTypes.push(...scrubResult.redactedTypes);
          logger?.info(
            `🧹 [ContentfulTool] PII scrubbed from field ${fieldName}: ${PIIScrubber.createScrubbingReport(scrubResult)}`,
          );
        }

        textFields.push(scrubResult.scrubbedContent);
      } else if (Array.isArray(fieldValue)) {
        // Handle arrays (e.g., tags, categories)
        fieldValue.forEach((item) => {
          if (typeof item === "string") {
            const scrubResult = PIIScrubber.scrubContent(item);
            if (scrubResult.piiDetected) {
              totalPiiDetected = true;
              allRedactedTypes.push(...scrubResult.redactedTypes);
            }
            textFields.push(scrubResult.scrubbedContent);
          }
        });
      } else if (fieldValue && typeof fieldValue === "object" && "content" in fieldValue) {
        // Handle rich text fields
        const richTextContent = extractRichTextContent((fieldValue as { content: { nodeType?: string; value?: string; content?: unknown[] }[] }).content);
        if (richTextContent) {
          const scrubResult = PIIScrubber.scrubContent(richTextContent);
          if (scrubResult.piiDetected) {
            totalPiiDetected = true;
            allRedactedTypes.push(...scrubResult.redactedTypes);
            logger?.info(
              `🧹 [ContentfulTool] PII scrubbed from rich text in ${fieldName}: ${PIIScrubber.createScrubbingReport(scrubResult)}`,
            );
          }
          textFields.push(scrubResult.scrubbedContent);
        }
      }
    });
  } catch (error) {
    logger?.error("📝 [ContentfulTool] Error extracting text content", {
      error,
      contentTypeId,
    });
  }

  const combinedContent = textFields.join(" ").slice(0, 5000); // Limit to 5000 chars for classification

  // Final validation to ensure no PII slipped through
  if (!PIIScrubber.validateScrubbing(combinedContent)) {
    logger?.error(
      "❌ [ContentfulTool] PII validation failed - content may still contain sensitive data",
      { contentTypeId },
    );
    throw new Error(
      "PII scrubbing validation failed - cannot proceed with potentially sensitive content",
    );
  }

  if (totalPiiDetected) {
    const uniqueTypes = [...new Set(allRedactedTypes)];
    logger?.info(
      `✅ [ContentfulTool] Content successfully scrubbed of PII types: ${uniqueTypes.join(", ")}`,
    );
  }

  return combinedContent;
}

/**
 * Extract text from Contentful rich text content
 */
export function extractRichTextContent(
  content: Array<{ nodeType?: string; value?: string; content?: unknown[] }>,
): string {
  const textParts: string[] = [];

  function traverse(
    nodes: Array<{ nodeType?: string; value?: string; content?: unknown[] }>,
  ) {
    nodes?.forEach((node) => {
      if (node.nodeType === "text" && node.value) {
        textParts.push(node.value);
      } else if (node.content) {
        traverse(
          node.content as Array<{
            nodeType?: string;
            value?: string;
            content?: unknown[];
          }>,
        );
      }
    });
  }

  traverse(content);
  return textParts.join(" ");
}

export async function fetchContentfulAssets(params: {
  limit?: number;
  skip?: number;
  contentTypes?: string[];
  lastSyncToken?: string;
  logger?: Logger;
}) {
  const { limit = 100, skip = 0, contentTypes, lastSyncToken, logger } = params;

  // Allow server-side env to define demo content types when client doesn't pass any
  const envTypes = (process.env.CONTENTFUL_DEMO_CONTENT_TYPES || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const effectiveContentTypes =
    contentTypes && contentTypes.length > 0
      ? contentTypes
      : envTypes.length > 0
        ? envTypes
        : undefined;

  logger?.info("🔧 [ContentfulTool] Starting Contentful assets fetch", {
    limit,
    skip,
    contentTypes: effectiveContentTypes?.join(",") || "all",
    incremental: !!lastSyncToken,
  });

  try {
    // Initialize Contentful Management API client
    const SPACE_ID = process.env.CONTENTFUL_SPACE_ID!;
    const ENV_ID =
      process.env.CONTENTFUL_ENV_ID ||
      process.env.CONTENTFUL_ENVIRONMENT_ID ||
      "master";
    const MGMT_TOKEN =
      process.env.CONTENTFUL_MANAGEMENT_TOKEN ||
      process.env.CONTENTFUL_ACCESS_TOKEN;
    if (!MGMT_TOKEN) {
      throw new Error(
        "Missing Contentful management token. Set CONTENTFUL_MANAGEMENT_TOKEN or CONTENTFUL_ACCESS_TOKEN.",
      );
    }
    const { sanitizeToken } = await import("../utils/sanitizeToken.js");
    const cleanToken = sanitizeToken(MGMT_TOKEN);
    if (!cleanToken) {
      throw new Error(
        "Contentful management token is empty after trimming/sanitization.",
      );
    }
    const client = await createContentfulManagementClient(cleanToken) as {
      getSpace: (spaceId: string) => Promise<{
        name: string;
        getEnvironment: (envId: string) => Promise<{
          getEntries: (query: Record<string, string | number | boolean>) => Promise<{
            items: Array<{
              sys: { id: string; contentType?: { sys: { id: string } }; createdAt: string; updatedAt: string; version: number };
              fields: Record<string, unknown>;
            }>;
          }>;
        }>;
      }>;
    };

    const space = await client.getSpace(SPACE_ID);
    const environment = await space.getEnvironment(ENV_ID as string);
    logger?.info("📝 [ContentfulTool] Connected to Contentful space", {
      spaceName: space.name,
      env: ENV_ID,
    });

    // Full fetch with pagination (sync API requires additional setup)
    const query: Record<string, string | number | boolean> = {
      limit: Math.min(limit, 1000),
      skip,
      "sys.publishedAt[exists]": true, // Only published content
      order: "-sys.updatedAt", // newest first
    };

    // Filter by content types if specified (from input or env)
    if (effectiveContentTypes && effectiveContentTypes.length > 0) {
      query["sys.contentType.sys.id[in]"] = effectiveContentTypes.join(",");
    }

    // For incremental updates, filter by updatedAt if lastSyncToken is provided
    if (lastSyncToken) {
      logger?.info(
        "📝 [ContentfulTool] Performing incremental update based on timestamp",
      );
      query["sys.updatedAt[gte]"] = lastSyncToken; // Use as timestamp
    }

    logger?.info("📝 [ContentfulTool] Fetching entries with query", query);
    const entriesCollection = await environment.getEntries(query);
    const entries = entriesCollection.items;

    // Set next sync token as current timestamp for future incremental updates
    const nextSyncToken = new Date().toISOString();

    logger?.info("📝 [ContentfulTool] Processing entries for text extraction", {
      entryCount: entries.length,
    });

    // Process entries to extract assets
    const assets: ContentAsset[] = entries
      .map((entry: { sys: { id: string; contentType?: { sys: { id: string } }; createdAt: string; updatedAt: string; version: number }; fields: Record<string, unknown> }) => {
        const contentTypeId = entry.sys.contentType?.sys.id || "unknown";
        const textContent = extractTextContent(
          entry.fields,
          contentTypeId,
          logger,
        );

        // Extract and scrub safe display fields only - never return raw fields
        const getLocaleValue = (fieldVal: unknown): string | undefined => {
          if (fieldVal && typeof fieldVal === "object") {
            return (fieldVal as Record<string, unknown>)["en-US"] as string | undefined;
          }
          return undefined;
        };
        const rawTitle =
          getLocaleValue(entry.fields?.["title"]) ||
          getLocaleValue(entry.fields?.["name"]) ||
          entry.sys.id;
        const rawDescription =
          getLocaleValue(entry.fields?.["description"]) ||
          getLocaleValue(entry.fields?.["summary"]);

        // Scrub title and description to ensure no PII
        const titleScrubResult = PIIScrubber.scrubContent(rawTitle || "");
        const descScrubResult = PIIScrubber.scrubContent(rawDescription || "");

        if (titleScrubResult.piiDetected) {
          logger?.info(
            `🧹 [ContentfulTool] PII scrubbed from title of asset ${entry.sys.id}`,
          );
        }
        if (descScrubResult.piiDetected) {
          logger?.info(
            `🧹 [ContentfulTool] PII scrubbed from description of asset ${entry.sys.id}`,
          );
        }

        // Return only safe, scrubbed metadata - NO raw fields object
        return {
          id: entry.sys.id,
          title: titleScrubResult.scrubbedContent,
          description: descScrubResult.scrubbedContent,
          contentType: contentTypeId,
          fields: {}, // Empty object - never expose raw fields
          createdAt: entry.sys.createdAt,
          updatedAt: entry.sys.updatedAt,
          version: entry.sys.version,
          textContent,
        };
      })
      .filter((asset: ContentAsset) => asset.textContent.length > 10); // Only assets with meaningful content

    const hasMore = !lastSyncToken && entries.length === limit;
    const summary = `Fetched ${assets.length} content assets from Contentful. ${contentTypes ? `Filtered by content types: ${contentTypes.join(", ")}` : "All content types included"}`;

    logger?.info(
      "✅ [ContentfulTool] Successfully processed Contentful assets",
      {
        assetsProcessed: assets.length,
        hasMore,
        avgTextLength:
          assets.reduce((sum, a) => sum + a.textContent.length, 0) /
          assets.length,
      },
    );

    return {
      assets,
      total: assets.length,
      hasMore,
      nextSyncToken,
      summary,
    };
  } catch (error) {
    logger?.error("❌ [ContentfulTool] Error fetching Contentful assets", {
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    throw new Error(
      `Failed to fetch Contentful assets: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
