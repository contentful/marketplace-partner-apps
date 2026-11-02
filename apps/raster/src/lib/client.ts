import { checkApiKey, createRasterClient, memoryCredentialStore, scopedRaster } from '@raster-app/react';

const HOST = {
  /** What Raster's sign-in page and Connected apps call this host. */
  name: 'Contentful',
  openExternal: (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};

/** The installation parameters, as an admin saves them on the config screen. */
export type Settings = {
  /** Pins the app to one organization (its slug): a sign-in that grants any other fails. */
  orgId?: string;
  /** An organization API key that connects every editor without signing in. */
  apiKey?: string;
};

export function readParameters(parameters: Record<string, unknown> | null | undefined): Settings {
  const orgId = typeof parameters?.orgId === 'string' ? parameters.orgId.trim() : '';
  const apiKey = typeof parameters?.apiKey === 'string' ? parameters.apiKey.trim() : '';
  return { ...(orgId && { orgId }), ...(apiKey && { apiKey }) };
}

/**
 * Where a Contentful user's Raster sign-in and browsing state are kept in this space. The pinned
 * organization is in it, so pinning, or changing the pin, asks editors to sign in again.
 */
export function rasterScope(ids: { space: string; user: string }, orgId: string | undefined): string {
  const scope = `raster.${ids.space}.${ids.user}`;
  return orgId === undefined ? scope : `${scope}.org.${orgId}`;
}

/** The client, browsing state and query cache for `rasterScope`, the same ones on every call. */
export function getRasterClient(ids: { space: string; user: string }, orgId: string | undefined) {
  return scopedRaster(rasterScope(ids, orgId), HOST);
}

/** Checks a key with Raster, and that it is for `orgId`, without storing it anywhere. */
export async function verifyApiKey(apiKey: string, orgId: string | undefined): Promise<void> {
  await checkApiKey(createRasterClient({ host: HOST, credentials: memoryCredentialStore() }), { apiKey, organizationId: orgId });
}
