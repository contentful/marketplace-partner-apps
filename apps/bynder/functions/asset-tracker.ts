import {
  FunctionEventHandler,
  FunctionTypeEnum,
  FunctionEventContext,
  AppEventRequest,
} from "@contentful/node-apps-toolkit";
import {
  getBynderAccessToken,
  createAssetUsage,
  extractBynderAssetIds,
  getAssetUsage,
  deleteAssetUsage,
} from "./Utils/bynderUtils";
import { BynderAuthConfig, BynderAssetUsageResponse } from "./types";

/**
 * App Event Handler for Bynder Asset Usage Tracking
 *
 * This handler tracks when Bynder assets are used in Contentful entries
 * and syncs this usage information with Bynder's Asset Usage API.
 *
 * Handles the following events:
 * - Entry.publish: Creates asset usage records
 * - Entry.unpublish: Removes asset usage records
 * - Entry.save: Updates asset usage records
 *
 * @param event - The app event to be handled
 * @param context - The execution context
 * @returns None - App event handlers don't return a response
 */
export const handler: FunctionEventHandler<
  FunctionTypeEnum.AppEventHandler
> = async (event: AppEventRequest, context: FunctionEventContext) => {
  try {
    const topic = event.headers["X-Contentful-Topic"];
    // Only process Entry events
    if (!topic?.includes("Entry")) {
      return;
    }
    // Determine action based on event type
    let shouldRemove = false;
    if (
      topic.includes("unpublish") ||
      topic.includes("delete") ||
      (topic.includes("archive") && !topic.includes("unarchive"))
    ) {
      shouldRemove = true;
    }
    // Only create an usage on publish.
    else if (!topic.includes("publish")) {
      return;
    }

    // Extract entry information.
    const entryData = event.body as any; // Type assertion to handle various event payload types
    const entryId = entryData?.sys?.id;
    const spaceId = context.spaceId;
    const environmentId = context.environmentId;

    if (!entryId) {
      return;
    }
    // Only process in master environment
    if (environmentId !== "master") {
      return;
    }

    // Get Bynder configuration from app installation parameters
    const { bynderURL, clientId, clientSecret } =
      context.appInstallationParameters || {};

    if (!bynderURL || !clientId || !clientSecret) {
      return;
    }

    // Get Bynder access token
    const bynderConfig: BynderAuthConfig = {
      bynderURL,
      clientId,
      clientSecret,
    };
    const accessToken = await getBynderAccessToken(bynderConfig);

    // Create usage URI and additional context
    const uri = `https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/${entryId}`;
    const additional = JSON.stringify({
      spaceId,
      environmentId,
      entryId,
      timestamp: new Date().toISOString(),
    });

    let assetsToProcess: string[] = [];

    // For delete/unpublish/archive events, get assets from Usage API since fields are not available
    if (shouldRemove) {
      try {
        const usageResponse = await getAssetUsage(bynderURL, accessToken, uri);

        if (usageResponse.status === 200 && usageResponse.data) {
          const usageData = usageResponse.data as BynderAssetUsageResponse;
          assetsToProcess = usageData.map((entry) =>
            entry.asset_id.toLowerCase(),
          );
        } else {
          return;
        }
      } catch (error) {
        console.error("Error getting existing usage for delete/unpublish:", error);
        return;
      }
    } else {
      // For publish events, extract asset IDs from entry fields
      const assetIds = extractBynderAssetIds(entryData.fields || {});
      assetsToProcess = assetIds;
    }

    // For publish events, first check for removed assets and clean them up
    if (!shouldRemove && topic.includes("publish")) {
      try {
        // Get all usage for this URI (without specifying asset_id)
        const usageResponse = await getAssetUsage(bynderURL, accessToken, uri);

        if (usageResponse.status === 200 && usageResponse.data) {
          const usageData = usageResponse.data as BynderAssetUsageResponse;

          // Extract all asset IDs that have usage for this URI (normalize to lowercase)
          const usageAssetIds = usageData.map((entry) =>
            entry.asset_id.toLowerCase(),
          );

          // Find assets to remove (exist in usage but not in current entry fields)
          const assetsToRemove = usageAssetIds.filter(
            (id) => !assetsToProcess.includes(id),
          );

          // Find assets to add (exist in current entry but not in usage)
          const assetsToAdd = assetsToProcess.filter(
            (id) => !usageAssetIds.includes(id),
          );

          if (assetsToRemove.length > 0) {
            // Remove usage for assets no longer in the entry using deleteAssetUsage directly
            await Promise.allSettled(
              assetsToRemove.map(async (assetId) => {
                try {
                  await deleteAssetUsage(
                    bynderURL,
                    accessToken,
                    assetId,
                    uri,
                  );
                } catch (error) {
                  console.error(`Failed to remove usage for asset ${assetId}:`, error);
                }
              }),
            );
          }

          // Only process assets that need to be added (not already tracked)
          assetsToProcess = assetsToAdd;
        }
      } catch (error) {
        console.error("Error checking for removed assets:", error);
      }
    }

    // Sync usage for assets that need processing
    await Promise.allSettled(
      assetsToProcess.map(async (assetId) => {
        try {
          const result = shouldRemove
            ? await deleteAssetUsage(bynderURL, accessToken, assetId, uri)
            : await createAssetUsage(
                bynderURL,
                accessToken,
                assetId,
                uri,
                additional,
              );
          return { assetId, result };
        } catch (error) {
          console.error(`Failed to sync usage for asset ${assetId}:`, error);
          throw error;
        }
      }),
    );
  } catch (error) {
    console.error("Error in Bynder Asset Tracker:", error);
  }
  return;
};
