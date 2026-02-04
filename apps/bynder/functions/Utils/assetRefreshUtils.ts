import { Asset } from "../types";
import { getAsset, getBynderAccessToken } from "./bynderUtils";
import { BynderAuthConfig } from "../types";

/**
 * Fields that should be persisted when storing Bynder asset data
 * This matches the FIELDS_TO_PERSIST constant in index.jsx
 */
const FIELDS_TO_PERSIST = [
  'archive',
  'brandId',
  'copyright',
  'dateCreated',
  'dateModified',
  'datePublished',
  'description',
  'extension',
  'fileSize',
  'height',
  'id',
  'isPublic',
  'limited',
  'name',
  'orientation',
  'original',
  'thumbnails',
  'type',
  'watermarked',
  'width',
  'videoPreviewURLs',
  'tags',
  'selectedFile',
  'textMetaproperties',
];

/**
 * Transform Bynder API response to match the format stored in Contentful
 * This matches the transformAsset function logic from index.jsx
 *
 * @param apiAsset - Raw asset data from Bynder API
 * @param existingAsset - Existing asset data from Contentful (to preserve selectedFile)
 * @returns Transformed asset data matching Contentful storage format
 */
export function transformApiAssetToStoredFormat(
  apiAsset: any,
  existingAsset?: any
): any {
  // Extract thumbnails from files object
  const thumbnails: Record<string, string> = {};
  
  if (apiAsset.files) {
    // Handle webImage and thumbnail specifically
    if (apiAsset.files.webImage?.url) {
      thumbnails.webimage = apiAsset.files.webImage.url;
    }
    if (apiAsset.files.thumbnail?.url) {
      thumbnails.thul = apiAsset.files.thumbnail.url;
    }
    
    // Add all other file types
    Object.entries(apiAsset.files).forEach(([key, value]: [string, any]) => {
      const lowerKey = key.toLowerCase();
      if (!['webimage', 'thumbnail'].includes(lowerKey) && value?.url) {
        thumbnails[key] = value.url;
      }
    });
  } else if (apiAsset.thumbnails) {
    // Fallback: use thumbnails object directly if files is not available
    thumbnails.webimage = apiAsset.thumbnails.webimage || apiAsset.thumbnails.webImage;
    thumbnails.thul = apiAsset.thumbnails.thul || apiAsset.thumbnails.thumbnail;
  }

  // Transform the asset to match stored format
  const transformed: any = {
    id: apiAsset.id || apiAsset.databaseId,
    name: apiAsset.name || '',
    type: (apiAsset.type || '').toLowerCase(),
    fileSize: apiAsset.fileSize || 0,
    description: apiAsset.description || null,
    height: apiAsset.height || null,
    width: apiAsset.width || null,
    copyright: apiAsset.copyright || null,
    extension: apiAsset.extensions || apiAsset.extension || [],
    orientation: (apiAsset.orientation || '').toLowerCase(),
    archive: apiAsset.isArchived || apiAsset.archive ? 1 : 0,
    watermarked: apiAsset.isWatermarked || apiAsset.watermarked ? 1 : 0,
    limited: apiAsset.isLimitedUse || apiAsset.limited ? 1 : 0,
    isPublic: apiAsset.isPublic ? 1 : 0,
    brandId: apiAsset.brandId || null,
    thumbnails,
    original: apiAsset.originalUrl || apiAsset.original || null,
    videoPreviewURLs: apiAsset.previewUrls || apiAsset.videoPreviewURLs || [],
    textMetaproperties: apiAsset.textMetaproperties || [],
    tags: apiAsset.tags || [],
    dateCreated: apiAsset.dateCreated || apiAsset.createdAt || '',
    dateModified: apiAsset.dateModified || apiAsset.updatedAt || '',
    datePublished: apiAsset.datePublished || apiAsset.publishedAt || null,
    userCreated: apiAsset.createdBy || apiAsset.userCreated || null,
    // Preserve selectedFile from existing asset if available
    selectedFile: existingAsset?.selectedFile || null,
  };

  // Only include fields that should be persisted
  const result: any = {};
  FIELDS_TO_PERSIST.forEach((field) => {
    if (transformed.hasOwnProperty(field)) {
      result[field] = transformed[field];
    }
  });

  // Add src for compatibility (from thumbnails.webimage)
  if (thumbnails.webimage) {
    result.src = thumbnails.webimage;
  }

  return result;
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
