import {
  BynderResponse,
  BynderAuthConfig,
  TokenCacheEntry,
  BynderTokenResponse,
  Asset,
  BynderAssetUsageResponse,
} from "../types";

/**
 * Bynder base endpoints and other constants.
 */
const API_ASSET_BASE = "/api/v4/media";
const API_ASSET_USAGE_ENDPOINT = "/api/media/usage";
const BYNDER_CONTENTFUL_INTEGRATION_ID = "ac534173-7ee1-493b-98b7-a6d88ce7a450";

/**
 * Core Bynder asset fields that must be present to identify a Bynder asset
 * These are the essential fields that uniquely identify a Bynder asset
 */
const CORE_BYNDER_FIELDS = [
  "id",
  "name",
  "dateCreated",
  "dateModified",
  "type",
  "fileSize",
  "extension",
  "textMetaproperties",
  "width",
  "height",
  "isPublic",
];

/**
 * In-memory cache for Bynder OAuth2 access tokens.
 *
 * NOTE: In serverless environments (e.g., AWS Lambda, Vercel, Netlify), this cache
 * only persists for the lifetime of a single "warm" function instance. There is no
 * guarantee that the cache will be available across invocations, so the access token
 * may be fetched on every cold start or new invocation.
 *
 * For most use cases, this is acceptable, as the client credentials flow is designed
 * for frequent token requests.
 */
const tokenCache: Record<string, TokenCacheEntry> = {};

/**
 * Utility function get the API asset base URL for bynder.
 *
 * @param {string} base_url
 *   The client specific endpoint.
 * @returns {string}
 *   The Bynder Asset endpoint.
 */
const getBynderAssetUrl = (base_url: string): string => {
  base_url = base_url.endsWith("/") ? base_url.slice(0, -1) : base_url;
  return `${base_url}${API_ASSET_BASE}`;
};

/**
 * Fetch and cache a Bynder access token using client credentials.
 * Caches per bynderURL+clientId.
 *
 * @param {BynderAuthConfig} config
 *   The Bynder authentication configuration (from installation config).
 * @returns {Promise<string>}
 *   The Bynder OAuth2 access token.
 */
export const getBynderAccessToken = async (
  config: BynderAuthConfig,
): Promise<string> => {
  const cacheKey = `${config.bynderURL}|${config.clientId}`;
  const now = Date.now();

  // Check cache (may only persist for warm invocations in serverless)
  const cached = tokenCache[cacheKey];
  if (cached && cached.expiresAt > now + 60000) {
    // 60s buffer
    return cached.accessToken;
  }

  // Fetch new token
  const tokenUrl = `${config.bynderURL.replace(/\/$/, "")}/v6/authentication/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: config.clientId,
    client_secret: config.clientSecret,
  });

  const resp = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!resp.ok) {
    throw new Error(
      `Failed to fetch Bynder access token: ${resp.status} ${await resp.text()}`,
    );
  }

  const data = (await resp.json()) as BynderTokenResponse;
  const accessToken = data.access_token;
  const expiresIn = data.expires_in || 3600; // seconds

  // Store in cache for future use (if instance is reused)
  tokenCache[cacheKey] = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
  };

  return accessToken;
};

/**
 * Utility function to fetch an asset from Bynder, if exists.
 * Uses client credentials flow for authentication.
 *
 * @param {BynderAuthConfig} config
 *   The Bynder authentication configuration (from installation config).
 * @param {string} assetId
 *   Asset ID which is requested.
 * @returns {Promise<BynderResponse>}
 *   The Bynder API response.
 */
export const getAsset = async (
  bynderURL: string,
  token: string,
  assetId: string,
): Promise<BynderResponse> => {
  const assetUrl = `${getBynderAssetUrl(bynderURL)}/${assetId}?versions=1`;

  try {
    const apiResponse = await fetch(assetUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      method: "GET",
    });
    let response: BynderResponse = {
      status: apiResponse.status,
    };
    if (apiResponse.status === 200) {
      response.data = (await apiResponse.json()) as Asset;
    }
    return response;
  } catch (error) {
    const errorResponse: BynderResponse = {
      status: 500,
      error: error as Object,
    };
    return errorResponse;
  }
};

/**
 * Retrieve existing asset usage from Bynder
 *
 * @param {string} bynderURL - The Bynder instance URL
 * @param {string} token - The Bynder access token
 * @param {string} uri - URI where the asset is being used
 * @param {string} [assetId] - Optional Bynder asset ID to filter by specific asset
 * @returns {Promise<BynderResponse>} - The API response with usage data
 */
export const getAssetUsage = async (
  bynderURL: string,
  token: string,
  uri: string,
  assetId?: string,
): Promise<BynderResponse> => {
  const params = new URLSearchParams({
    integration_id: BYNDER_CONTENTFUL_INTEGRATION_ID,
    uri: uri,
  });

  // Add asset_id only if provided
  if (assetId) {
    params.append("asset_id", assetId);
  }

  const usageUrl = `${bynderURL.replace(/\/$/, "")}${API_ASSET_USAGE_ENDPOINT}?${params.toString()}`;

  try {
    const apiResponse = await fetch(usageUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let response: BynderResponse = {
      status: apiResponse.status,
    };

    if (apiResponse.status === 200) {
      response.data = (await apiResponse.json()) as BynderAssetUsageResponse;
    }

    return response;
  } catch (error) {
    const errorResponse: BynderResponse = {
      status: 500,
      error: error as Object,
    };
    return errorResponse;
  }
};

/**
 * Create asset usage in Bynder
 *
 * @param {string} bynderURL - The Bynder instance URL
 * @param {string} token - The Bynder access token
 * @param {string} assetId - The Bynder asset ID
 * @param {string} uri - URI where the asset is being used
 * @param {string} additional - Additional context information
 * @returns {Promise<BynderResponse>} - The API response
 */
export const createAssetUsage = async (
  bynderURL: string,
  token: string,
  assetId: string,
  uri: string,
  additional: string,
): Promise<BynderResponse> => {
  const usageUrl = `${bynderURL.replace(/\/$/, "")}${API_ASSET_USAGE_ENDPOINT}`;

  const body = new URLSearchParams({
    asset_id: assetId,
    integration_id: BYNDER_CONTENTFUL_INTEGRATION_ID,
    uri,
    additional,
    timestamp: new Date().toISOString(),
  });

  try {
    const apiResponse = await fetch(usageUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    let response: BynderResponse = {
      status: apiResponse.status,
    };

    if (apiResponse.status === 200 || apiResponse.status === 201) {
      response.data = await apiResponse.json();
    }

    return response;
  } catch (error) {
    const errorResponse: BynderResponse = {
      status: 500,
      error: error as Object,
    };
    return errorResponse;
  }
};

/**
 * Delete asset usage from Bynder
 *
 * @param {string} bynderURL - The Bynder instance URL
 * @param {string} token - The Bynder access token
 * @param {string} assetId - The Bynder asset ID
 * @param {string} uri - URI where the asset is being used
 * @returns {Promise<BynderResponse>} - The API response
 */
export const deleteAssetUsage = async (
  bynderURL: string,
  token: string,
  assetId: string,
  uri: string,
): Promise<BynderResponse> => {
  const params = new URLSearchParams({
    integration_id: BYNDER_CONTENTFUL_INTEGRATION_ID,
    asset_id: assetId,
    uri: uri,
  });
  const usageUrl = `${bynderURL.replace(/\/$/, "")}${API_ASSET_USAGE_ENDPOINT}?${params.toString()}`;

  try {
    const apiResponse = await fetch(usageUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    let response: BynderResponse = {
      status: apiResponse.status,
    };

    if (apiResponse.status === 200 || apiResponse.status === 204) {
      response.data = {};
    }

    return response;
  } catch (error) {
    const errorResponse: BynderResponse = {
      status: 500,
      error: error as Object,
    };
    return errorResponse;
  }
};

/**
 * Normalize asset ID to proper UUID format with hyphens
 * Converts formats like "681d7df7e6e04d219c92f0c5e2ad90e3" to "681d7df7-e6e0-4d21-9c92-f0c5e2ad90e3"
 *
 * @param {string} assetId - The asset ID to normalize
 * @returns {string} - Normalized UUID format
 */
export const normalizeAssetId = (assetId: string): string => {
  // Remove any existing hyphens and convert to lowercase
  const cleanId = assetId.replace(/-/g, "").toLowerCase();

  // Check if it's a valid 32-character hex string (UUID without hyphens)
  if (cleanId.length === 32 && /^[0-9a-f]{32}$/.test(cleanId)) {
    // Format as UUID: 8-4-4-4-12
    return `${cleanId.slice(0, 8)}-${cleanId.slice(8, 12)}-${cleanId.slice(12, 16)}-${cleanId.slice(16, 20)}-${cleanId.slice(20, 32)}`;
  }

  // If it's already in proper format or not a UUID, return as lowercase
  return assetId.toLowerCase();
};

/**
 * Extract Bynder asset IDs from all JSON object fields in entry
 * Recursively searches through all fields to find objects with Bynder asset structure
 *
 * @param {Record<string, any>} fields - Entry fields object
 * @returns {string[]} - Array of unique Bynder asset IDs found
 */
export const extractBynderAssetIds = (
  fields: Record<string, any>,
): string[] => {
  const assetIds: Set<string> = new Set();

  /**
   * Check if an object matches the Bynder asset schema
   * An object is considered a Bynder asset if it has ALL core Bynder fields:
   * id, name, dateCreated, dateModified, type, fileSize, extension,
   * textMetaproperties, width, height, isPublic
   *
   * @param obj - The object to validate
   * @returns true if the object has all required Bynder asset fields
   */
  const isBynderAsset = (obj: any): boolean => {
    if (!obj || typeof obj !== "object") {
      return false;
    }

    // Check that ALL core Bynder fields are present
    return CORE_BYNDER_FIELDS.every((field) => obj.hasOwnProperty(field));
  };

  /**
   * Recursively search for Bynder assets in any object structure
   * Traverses arrays and nested objects to find valid Bynder assets
   *
   * @param obj - The object/array to search through
   */
  const searchForAssets = (obj: any): void => {
    if (!obj || typeof obj !== "object") return;

    // Check if this object matches the Bynder asset schema strictly
    if (isBynderAsset(obj)) {
      assetIds.add(normalizeAssetId(obj.id));
    }

    // Recursively search arrays and objects
    if (Array.isArray(obj)) {
      obj.forEach((item) => searchForAssets(item));
    } else if (typeof obj === "object") {
      Object.values(obj).forEach((value) => searchForAssets(value));
    }
  };

  // Search through all fields and their locale values
  Object.values(fields).forEach((fieldValue) => {
    if (fieldValue && typeof fieldValue === "object") {
      // Handle locale-specific values (e.g., { "en-US": [...] })
      Object.values(fieldValue).forEach((localeValue) => {
        searchForAssets(localeValue);
      });
    }
  });

  return Array.from(assetIds);
};
