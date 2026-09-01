import type { OrganizationConfigResponse } from "../api-client/types.gen";
import { fingerprintApiKey } from "./styleGuidesCache";

/**
 * Cross-iframe cache for the `GET /account/config` response.
 *
 * Each Markup AI-enabled field on the entry editor renders inside its own
 * iframe, so they each run a separate React tree and a separate react-query
 * cache. Without this layer, N enabled fields → N network calls per page
 * load. localStorage is shared across same-origin iframes, so a value
 * written by the first field is read by the rest within the TTL.
 *
 * Same pattern (and same TTL) as `styleGuidesCache`.
 */

const CACHE_KEY = "markupai.accountConfigCache.v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  /** Hash of the api key that fetched this. Mismatch invalidates the entry. */
  apiKeyFingerprint: string;
  timestamp: number;
  config: OrganizationConfigResponse;
}

export function readAccountConfigCache(
  apiKey: string | null | undefined,
): OrganizationConfigResponse | null {
  if (!apiKey || typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isCacheEntry(parsed)) return null;
    if (parsed.apiKeyFingerprint !== fingerprintApiKey(apiKey)) return null;
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) return null;
    return parsed.config;
  } catch {
    return null;
  }
}

export function writeAccountConfigCache(
  apiKey: string | null | undefined,
  config: OrganizationConfigResponse,
): void {
  if (!apiKey || typeof localStorage === "undefined") return;
  try {
    const entry: CacheEntry = {
      apiKeyFingerprint: fingerprintApiKey(apiKey),
      timestamp: Date.now(),
      config,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // ignore — quota exceeded or storage disabled
  }
}

export function clearAccountConfigCache(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

function isCacheEntry(value: unknown): value is CacheEntry {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.apiKeyFingerprint === "string" &&
    typeof v.timestamp === "number" &&
    typeof v.config === "object" &&
    v.config !== null
  );
}
