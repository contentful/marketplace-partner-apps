import { Asset } from '../types';
import { getAsset, getBynderAccessToken } from './bynderUtils';
import { BynderAuthConfig } from '../types';
import { transformAsset } from '../../utils/transformAsset';

/**
 * Transform Bynder API response to match the format stored in Contentful
 * Reuses the shared transformAsset utility function
 *
 * @param apiAsset - Raw asset data from Bynder API
 * @param existingAsset - Existing asset data from Contentful (to preserve selectedFile)
 * @returns Transformed asset data matching Contentful storage format
 */
export function transformApiAssetToStoredFormat(apiAsset: Asset, existingAsset?: Asset): Asset {
  return transformAsset(apiAsset, {
    existingAsset,
    filterFields: true, // Filter to FIELDS_TO_PERSIST only
    addSrc: true, // Add src field for compatibility
  });
}

/**
 * Refresh a single Bynder asset by fetching latest data from API.
 * The caller must pass the ID already in Bynder media-id format
 * (8-4-4-16 uppercase, via resolveBynderAssetIdForApi / toBynderMediaId).
 *
 * @param config - Bynder authentication configuration
 * @param assetId - The Bynder asset ID to refresh (Bynder format)
 * @param existingAsset - Existing asset data (to preserve selectedFile)
 * @returns Refreshed asset data or null if refresh failed
 */
export async function refreshSingleAsset(config: BynderAuthConfig, assetId: string, existingAsset?: Asset): Promise<Asset | null> {
  try {
    const accessToken = await getBynderAccessToken(config);
    const response = await getAsset(config.bynderURL, accessToken, assetId);

    if (response.status === 200 && response.data) {
      return transformApiAssetToStoredFormat(response.data as Asset, existingAsset);
    }

    const detail = response.error ? `Error: ${JSON.stringify(response.error)}` : `Status ${response.status}`;
    console.error(`Failed to refresh asset ${assetId}: ${detail}`);
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
  assetMap: Map<string, { originalId: string; existingAsset: Asset }>
): Promise<Map<string, Asset>> {
  const refreshedAssets = new Map<string, Asset>();

  // Refresh all assets in parallel
  const refreshPromises = Array.from(assetMap.entries()).map(async ([normalizedId, { originalId, existingAsset }]) => {
    // Use the original ID when calling Bynder API (not normalized)
    const refreshed = await refreshSingleAsset(config, originalId, existingAsset);
    if (refreshed) {
      refreshedAssets.set(normalizedId.toLowerCase(), refreshed);
    }
    return { normalizedId, originalId, refreshed };
  });

  await Promise.allSettled(refreshPromises);

  return refreshedAssets;
}
