import { createClient, PlainClientAPI, CollectionProp, LocaleProps } from 'contentful-management';
import { normalizeAssetId, resolveBynderAssetIdForApi, isBynderAsset, getBynderAccessToken, probeMediaApiHost } from './Utils/bynderUtils';
import { refreshMultipleAssets } from './Utils/assetRefreshUtils';
import { Asset, BynderAuthConfig, BynderFunctionEventContext } from './types';

/**
 * Extract assets from a field value (handles arrays and single objects)
 */
function extractAssetsFromValue(value: any): Array<{ asset: any; index?: number }> {
  const assets: Array<{ asset: any; index?: number }> = [];

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (isBynderAsset(item)) {
        assets.push({ asset: item, index });
      }
    });
  } else if (isBynderAsset(value)) {
    assets.push({ asset: value });
  }

  return assets;
}

/**
 * Replace asset in array or single value
 */
function replaceAssetInValue(value: any, assetId: string, refreshedAsset: any, index?: number): any {
  if (Array.isArray(value)) {
    if (index !== undefined && index >= 0 && index < value.length) {
      const newValue = [...value];
      newValue[index] = refreshedAsset;
      return newValue;
    }
    // If no index, find and replace by ID
    return value.map((item) => (normalizeAssetId(item?.id) === normalizeAssetId(assetId) ? refreshedAsset : item));
  }
  return refreshedAsset;
}

/**
 * Refresh Bynder assets in an entry field for all locales
 *
 * @param cma - Contentful Management API client
 * @param spaceId - Space ID
 * @param environmentId - Environment ID
 * @param entryId - Entry ID
 * @param fieldId - Field ID to refresh
 * @param config - Bynder authentication configuration
 * @param locales - Array of locale codes to update
 * @returns Success status and details
 */
async function refreshFieldAssetsForAllLocales(
  cma: PlainClientAPI,
  spaceId: string,
  environmentId: string,
  entryId: string,
  fieldId: string,
  config: BynderAuthConfig,
  locales: CollectionProp<LocaleProps>
): Promise<{ success: boolean; refreshedCount: number; errors: string[]; failedIds: string[] }> {
  const errors: string[] = [];

  try {
    // Probe whether the configured URL serves the v4 media API (avoids generic 404s when portal URL is used)
    const token = await getBynderAccessToken(config);
    const probe = await probeMediaApiHost(config.bynderURL, token);
    if (!probe.ok) {
      return {
        success: false,
        refreshedCount: 0,
        errors: [
          `The configured Bynder URL does not appear to serve the v4 media API (GET /api/v4/media/ returned ${probe.status}). Use your instance's API host, not the portal URL. Check the Bynder UI Network tab or ask Bynder for the correct API base URL.`,
        ],
        failedIds: [],
      };
    }

    // Get the entry
    const entry = await cma.entry.get({
      spaceId,
      environmentId,
      entryId,
    });

    if (!entry.fields[fieldId]) {
      return {
        success: false,
        refreshedCount: 0,
        errors: [`Field ${fieldId} not found in entry`],
        failedIds: [],
      };
    }

    // Collect all assets from all locales
    const assetMap = new Map<string, { asset: any; locale: string; index?: number }[]>();

    for (const locale of locales.items) {
      const localeValue = entry.fields[fieldId][locale.code];
      if (!localeValue) continue;

      const assets = extractAssetsFromValue(localeValue);
      for (const { asset, index } of assets) {
        const normalizedId = normalizeAssetId(asset.id);
        if (!assetMap.has(normalizedId)) {
          assetMap.set(normalizedId, []);
        }
        assetMap.get(normalizedId)!.push({ asset, locale: locale.code, index });
      }
    }

    if (assetMap.size === 0) {
      return {
        success: true,
        refreshedCount: 0,
        errors: [],
        failedIds: [],
      };
    }

    // Refresh all assets from Bynder API
    // Map: normalizedId -> { originalId, existingAsset }
    // originalId must be the ID Bynder API expects (resolve base64-wrapped "Asset_id <uuid>" etc.)
    const assetsToRefresh = new Map<string, { originalId: string; existingAsset: Asset }>();
    assetMap.forEach((occurrences, normalizedId) => {
      const storedId = occurrences[0].asset?.id || normalizedId;
      const originalId = resolveBynderAssetIdForApi(String(storedId));
      assetsToRefresh.set(normalizedId, {
        originalId,
        existingAsset: occurrences[0].asset,
      });
    });

    const refreshedAssets = await refreshMultipleAssets(config, assetsToRefresh);

    // IDs that were requested but could not be refreshed (e.g. deleted in Bynder, 403)
    const requestedIds = Array.from(assetsToRefresh.keys());
    const succeededIds = new Set(refreshedAssets.keys());
    const failedIds = requestedIds.filter((id) => !succeededIds.has(id.toLowerCase()));

    if (refreshedAssets.size === 0) {
      return {
        success: false,
        refreshedCount: 0,
        errors: ['Failed to refresh any assets from Bynder API. The assets may have been deleted or the configured credentials may lack the asset:read scope.'],
        failedIds,
      };
    }

    // Update field values for all locales
    for (const locale of locales.items) {
      const localeValue = entry.fields[fieldId][locale.code];
      if (!localeValue) continue;

      let updatedValue = localeValue;

      // Replace each asset occurrence in this locale
      assetMap.forEach((occurrences, normalizedId) => {
        // Look up refreshed asset using normalized ID (lowercased for consistency)
        const refreshedAsset = refreshedAssets.get(normalizedId.toLowerCase());
        if (!refreshedAsset) {
          console.warn(`No refreshed asset found for normalized ID: ${normalizedId}`);
          return;
        }

        // Find occurrences for this locale
        const localeOccurrences = occurrences.filter((occ) => occ.locale === locale.code);
        for (const { index } of localeOccurrences) {
          updatedValue = replaceAssetInValue(updatedValue, normalizedId, refreshedAsset, index);
        }
      });

      entry.fields[fieldId][locale.code] = updatedValue;
    }

    await cma.entry.update({ entryId }, entry);

    return {
      success: true,
      refreshedCount: refreshedAssets.size,
      errors: [],
      failedIds,
    };
  } catch (error: any) {
    console.error('Error refreshing assets:', error);
    errors.push(error.message || String(error));
    return {
      success: false,
      refreshedCount: 0,
      errors,
      failedIds: [],
    };
  }
}

/**
 * Initialize Contentful Management Client
 */
function initContentfulManagementClient(context: BynderFunctionEventContext): PlainClientAPI {
  if (!context.cmaClientOptions) {
    throw new Error('Contentful Management API client options are only provided for certain function types.');
  }
  return createClient(context.cmaClientOptions, {
    type: 'plain',
    defaults: {
      spaceId: context.spaceId,
      environmentId: context.environmentId,
    },
  });
}

/**
 * App Action handler to refresh Bynder assets for all locales
 *
 * This function can be triggered as an App Action from the Contentful UI
 * to refresh Bynder asset data for a specific entry field across all locales.
 *
 * Expected parameters:
 * - entryId: string (required) - The ID of the entry containing Bynder assets
 * - fieldId: string (required) - The ID of the field containing Bynder assets to refresh
 */
export const handler = async (
  event: { body?: { entryId?: string; fieldId?: string }; payload?: { entryId?: string; fieldId?: string } },
  context: BynderFunctionEventContext
) => {
  try {
    // Extract parameters from event body (App Actions pass parameters in body)
    const { entryId, fieldId } = event.body || event.payload || {};

    if (!entryId || !fieldId) {
      return {
        success: false,
        error: 'entryId and fieldId are required',
        timestamp: new Date().toISOString(),
      };
    }

    const targetSpaceId = context.spaceId;
    const targetEnvironmentId = context.environmentId;

    // Get Bynder configuration
    const { bynderURL, clientId, clientSecret } = context.appInstallationParameters || {};

    if (!bynderURL || !clientId || !clientSecret) {
      return {
        success: false,
        error: 'Bynder configuration is missing. Please configure Bynder URL, Client ID, and Client Secret in the app installation settings.',
        timestamp: new Date().toISOString(),
      };
    }

    const config: BynderAuthConfig = {
      bynderURL,
      clientId,
      clientSecret,
    };

    // Create CMA client
    const cma = initContentfulManagementClient(context);

    // Get locales from environment (fallback to space locales)
    const locales = await cma.locale.getMany({ spaceId: targetSpaceId, environmentId: targetEnvironmentId });

    // Refresh assets for all locales
    const result = await refreshFieldAssetsForAllLocales(cma, targetSpaceId, targetEnvironmentId, entryId, fieldId, config, locales);

    if (result.success) {
      return {
        success: true,
        refreshedCount: result.refreshedCount,
        failedIds: result.failedIds,
        message: result.failedIds.length
          ? `Refreshed ${result.refreshedCount} asset(s). ${result.failedIds.length} could not be refreshed (deleted or inaccessible): ${result.failedIds.join(
              ', '
            )}`
          : `Successfully refreshed ${result.refreshedCount} asset(s) for all locales`,
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        success: false,
        errors: result.errors,
        refreshedCount: result.refreshedCount,
        failedIds: result.failedIds,
        timestamp: new Date().toISOString(),
      };
    }
  } catch (error: any) {
    console.error('Error in refresh-assets handler:', error);
    return {
      success: false,
      error: error.message || String(error),
      timestamp: new Date().toISOString(),
    };
  }
};
