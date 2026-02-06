import { Asset } from "../types";
import { getAsset, getBynderAccessToken } from "./bynderUtils";
import { BynderAuthConfig } from "../types";
import { transformAsset } from "../../utils/transformAsset";

/**
 * Transform Bynder API response to match the format stored in Contentful
 * Reuses the shared transformAsset utility function
 *
 * @param apiAsset - Raw asset data from Bynder API
 * @param existingAsset - Existing asset data from Contentful (to preserve selectedFile)
 * @returns Transformed asset data matching Contentful storage format
 */
export function transformApiAssetToStoredFormat(
  apiAsset: any,
  existingAsset?: any
): any {
  return transformAsset(apiAsset, {
    existingAsset,
    filterFields: true, // Filter to FIELDS_TO_PERSIST only
    addSrc: true, // Add src field for compatibility
  });
}

/**
 * Refresh a single Bynder asset by fetching latest data from API
 *
 * @param config - Bynder authentication configuration
 * @param assetId - The Bynder asset ID to refresh
 * @param existingAsset - Existing asset data (to preserve selectedFile)
 * @returns Refreshed asset data or null if refresh failed
 */
export async function refreshSingleAsset(
  config: BynderAuthConfig,
  assetId: string,
  existingAsset?: any
): Promise<any | null> {
  try {
    // Log the asset ID being used for debugging
    console.log(`Refreshing asset with ID: ${assetId} (from Contentful: ${existingAsset?.id || 'N/A'})`);
    
    const accessToken = await getBynderAccessToken(config);
    const response = await getAsset(config.bynderURL, accessToken, assetId);

    if (response.status === 200 && response.data) {
      return transformApiAssetToStoredFormat(response.data as Asset, existingAsset);
    }

    // Log more details for debugging
    const errorMessage = response.error 
      ? `Error: ${JSON.stringify(response.error)}` 
      : `Status ${response.status}`;
    console.error(`Failed to refresh asset ${assetId}: ${errorMessage}`);
    
    // If 404, the asset might not exist in Bynder or the ID format is wrong
    if (response.status === 404) {
      console.error(`Asset ${assetId} not found in Bynder API.`);
      console.error(`  - Asset ID used: ${assetId}`);
      console.error(`  - Original asset from Contentful:`, JSON.stringify(existingAsset, null, 2));
      console.error(`  - Bynder URL: ${config.bynderURL}`);
    }
    
    return null;
  } catch (error) {
    console.error(`Error refreshing asset ${assetId}:`, error);
    return null;
  }
}

/**
 * Refresh multiple Bynder assets
 *
 * @param config - Bynder authentication configuration
 * @param assetMap - Map of normalizedId -> { originalId, existingAsset }
 * @returns Map of normalizedId -> refreshed asset data
 */
export async function refreshMultipleAssets(
  config: BynderAuthConfig,
  assetMap: Map<string, { originalId: string; existingAsset: any }>
): Promise<Map<string, any>> {
  const refreshedAssets = new Map<string, any>();

  // Refresh all assets in parallel
  const refreshPromises = Array.from(assetMap.entries()).map(
    async ([normalizedId, { originalId, existingAsset }]) => {
      // Use the original ID when calling Bynder API (not normalized)
      const refreshed = await refreshSingleAsset(config, originalId, existingAsset);
      if (refreshed) {
        // Store using normalized ID as key for consistency
        refreshedAssets.set(normalizedId.toLowerCase(), refreshed);
      } else {
        console.error(`Failed to refresh asset ${originalId} (normalized: ${normalizedId}): Status 404`);
      }
      return { normalizedId, originalId, refreshed };
    }
  );

  await Promise.allSettled(refreshPromises);

  return refreshedAssets;
}
