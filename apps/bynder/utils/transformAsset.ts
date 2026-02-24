import { FIELDS_TO_PERSIST } from './constants';

/**
 * Normalize an asset ID to standard UUID format (8-4-4-4-12) for consistent API output.
 * Handles Bynder's 8-4-4-16 format and hyphen-less hex; leaves non-UUID strings unchanged.
 */
function normalizeIdToStandardUuid(assetId: string | null | undefined): string {
  if (assetId == null || typeof assetId !== 'string') {
    return '';
  }
  const clean = assetId.replace(/-/g, '').toLowerCase();
  if (clean.length === 32 && /^[0-9a-f]{32}$/.test(clean)) {
    return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
  }
  return assetId;
}

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

  const thumbnails = extractThumbnails(asset);

  // Determine selectedFile: prefer from options, then existingAsset, then null
  const finalSelectedFile = selectedFile ?? existingAsset?.selectedFile ?? null;

  // Prefer databaseId (GUID) when present; then normalize to standard UUID (8-4-4-4-12)
  // so Contentful's API always serves a consistent GUID to customers.
  const rawId = asset.databaseId ?? asset.id;
  const transformed: any = {
    id: normalizeIdToStandardUuid(rawId),
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
    original: asset.originalUrl || asset.original || null,
    videoPreviewURLs: asset.previewUrls || asset.videoPreviewURLs || [],
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
