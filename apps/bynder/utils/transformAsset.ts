import { FIELDS_TO_PERSIST } from './constants';

/**
 * Extract thumbnails from asset files object
 */
function extractThumbnails(asset: any): Record<string, string> {
  const thumbnails: Record<string, string> = {};

  if (asset.files) {
    // Handle webImage and thumbnail specifically
    if (asset.files.webImage?.url) {
      thumbnails.webimage = asset.files.webImage.url;
    }
    if (asset.files.thumbnail?.url) {
      thumbnails.thul = asset.files.thumbnail.url;
    }

    // Add all other file types
    Object.entries(asset.files).forEach(([key, value]: [string, any]) => {
      const lowerKey = key.toLowerCase();
      if (!['webimage', 'thumbnail'].includes(lowerKey) && value?.url) {
        thumbnails[key] = value.url;
      }
    });
  } else if (asset.thumbnails) {
    // Fallback: use thumbnails object directly if files is not available
    thumbnails.webimage = asset.thumbnails.webimage || asset.thumbnails.webImage;
    thumbnails.thul = asset.thumbnails.thul || asset.thumbnails.thumbnail;
  }

  return thumbnails;
}

/**
 * Transform Bynder asset to the format stored in Contentful
 *
 * This function handles assets from both:
 * - Bynder CompactView (used in dialog)
 * - Bynder API (used in refresh functions)
 *
 * @param asset - Asset data from Bynder (CompactView or API format)
 * @param options - Options for transformation
 * @param options.selectedFile - Selected file from CompactView (optional)
 * @param options.existingAsset - Existing asset from Contentful to preserve selectedFile (optional)
 * @param options.filterFields - Whether to filter to FIELDS_TO_PERSIST only (default: false)
 * @param options.addSrc - Whether to add src field for compatibility (default: false)
 * @returns Transformed asset data
 */
export function transformAsset(
  asset: any,
  options: {
    selectedFile?: string | null;
    existingAsset?: any;
    filterFields?: boolean;
    addSrc?: boolean;
  } = {}
): any {
  const { selectedFile, existingAsset, filterFields = false, addSrc = false } = options;

  const thumbnailsFromSource = extractThumbnails(asset);
  // When refreshing from API, preserve existing thumbnails (e.g. from Compact View) that the API
  // does not return — mini, original, inprv_* transforms, transformBaseUrl — and overlay
  // API-provided URLs (webimage, thul) so they stay up to date.
  const thumbnails =
    existingAsset?.thumbnails && typeof existingAsset.thumbnails === 'object' && !Array.isArray(existingAsset.thumbnails)
      ? { ...existingAsset.thumbnails, ...thumbnailsFromSource }
      : thumbnailsFromSource;

  // Determine selectedFile: prefer from options, then existingAsset, then null
  const finalSelectedFile = selectedFile ?? existingAsset?.selectedFile ?? null;

  // Prefer databaseId when present (avoids storing Base64 from Compact View's id field).
  // Store the id as-is: Bynder uses 8-4-4-16 format; do not convert to standard UUID (8-4-4-4-12)
  // or the Bynder API will not find the asset.
  const transformed: any = {
    id: asset.databaseId ?? asset.id ?? '',
    name: asset.name || '',
    type: (asset.type || '').toLowerCase(),
    fileSize: asset.fileSize || 0,
    description: asset.description || null,
    height: asset.height || null,
    width: asset.width || null,
    copyright: asset.copyright || null,
    extension: asset.extensions || asset.extension || [],
    orientation: (asset.orientation || '').toLowerCase(),
    archive: asset.isArchived || asset.archive ? 1 : 0,
    watermarked: asset.isWatermarked || asset.watermarked ? 1 : 0,
    limited: asset.isLimitedUse || asset.limited ? 1 : 0,
    isPublic: asset.isPublic ? 1 : 0,
    brandId: asset.brandId || null,
    thumbnails,
    original: asset.originalUrl || asset.original || existingAsset?.original || null,
    videoPreviewURLs: asset.previewUrls ?? asset.videoPreviewURLs ?? existingAsset?.videoPreviewURLs ?? [],
    streamingLinks: asset.streamingLinks ?? asset.streamingLinks ?? existingAsset?.streamingLinks ?? {},
    textMetaproperties: asset.textMetaproperties || [],
    tags: asset.tags || [],
    dateCreated: asset.dateCreated || asset.createdAt || '',
    dateModified: asset.dateModified || asset.updatedAt || '',
    datePublished: asset.datePublished || asset.publishedAt || null,
    userCreated: asset.createdBy || asset.userCreated || null,
    selectedFile: finalSelectedFile,
  };

  // Filter to only persisted fields if requested
  if (filterFields) {
    const result: any = {};
    FIELDS_TO_PERSIST.forEach((field) => {
      if (transformed.hasOwnProperty(field)) {
        result[field] = transformed[field];
      }
    });

    // Add src for compatibility if requested
    if (addSrc && thumbnails.webimage) {
      result.src = thumbnails.webimage;
    }

    return result;
  }

  return transformed;
}
