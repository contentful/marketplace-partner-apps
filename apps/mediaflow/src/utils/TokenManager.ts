import type { BaseAppSDK } from '@contentful/app-sdk';
import { BACKEND_URL } from '../config';

/** A token is refreshed when it has expired or fewer than this many seconds are left */
export const TOKEN_REFRESH_MARGIN_SECONDS = 60;

interface TokenResponse {
    access_token?: string;
    expires_in?: number;
}

let tokenPromise: Promise<boolean> | null = null;
let cachedToken: string | null = null;
let expiresAt: number | null = null;
let sdk: BaseAppSDK | null = null;
let ready = false;

/**
 * Initializes the TokenManager by settings its sdk instance.
 * 
 * @param sdkInstance - The Contentful SDK instance from useSDK() 
 */
export function initializeTokenManager(sdkInstance: BaseAppSDK | null | undefined): void {
    if(!sdkInstance || !sdkInstance.cma){
        throw new Error("Failed to initiailze token manager. The sdkInstance is not correct.");
    }
    sdk = sdkInstance;
    ready = true;
}


/**
 * Initializes the TokenManager with the given sdk unless that already happened.
 *
 * @param sdkInstance - The Contentful SDK instance from useSDK()
 */
export function ensureTokenManager(sdkInstance: BaseAppSDK): void {
    if(!ready) {
        initializeTokenManager(sdkInstance);
    }
}

export function isReady(): boolean {
    return ready;
}

/**
 * Retrieves the cached token. This method will update the token if it is expired ({@link isTokenExpired}) or if forceRefresh is true.
 * 
 * @param forceRefresh - OPTIONAL, When true, the token will be refreshed even if it is not expired.
 * @param noCache - OPTIONAL, When true, the backend will refetch the Contentful parameters instead of using the cached version. This is important when the Contentful parameters changed
 * 
 * @throws Error when an expired token could not be refreshed.
 * 
 * @returns A promise which resolves to the access token.
 */
export async function getAccessToken(forceRefresh = false, noCache = false): Promise<string> {
    if(isTokenExpired() || forceRefresh) {
        if(!tokenPromise) {
            tokenPromise = updateToken(noCache).finally(() => { tokenPromise = null; });
        }
        const updated = await tokenPromise; // This will set the cachedToken variable which can then be returned afterwards
        if(!updated) {
            throw new Error("Failed to update the mediaflow access token.");
        }
    }
    if(!cachedToken) {
        throw new Error("No mediaflow access token available.");
    }
    return cachedToken;
}

/**
 * Gets a new token after Mediaflow rejected staleToken. When another request already replaced that token, the newer one is returned
 * without asking the backend again, so several requests failing at once cause only one refresh.
 *
 * @param staleToken - The token Mediaflow rejected
 *
 * @throws Error when no new token could be retrieved
 *
 * @returns A promise which resolves to a token other than staleToken, if possible
 */
export async function refreshAccessToken(staleToken: string): Promise<string> {
    if(cachedToken && cachedToken !== staleToken && !isTokenExpired()) {
        return cachedToken;
    }
    return getAccessToken(true);
}

/**
 * Replaces the cached token by a new one.
 * 
 * @param noCache - OPTIONAL, When true, the backend will refetch the Contentful parameters instead of using the cached version. This is important when the Contentful parameters changed
 * 
 * @throws Error when the TokenManager is not initialized yet.
 * 
 * @returns A promise which resolves to true if the token was successfully updated, false otherwise.
 */
async function updateToken(noCache = false): Promise<boolean> {
    if(!ready || !sdk) {
        throw new Error("TokenManager is not initialized. Make sure to initialize it first.");
    }

    const appDefinitionId = sdk.ids.app;
    if(!appDefinitionId) {
        throw new Error("The app definition id is missing from the SDK.");
    }
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;

    const request = {
        method: 'POST',
        url: BACKEND_URL + "authenticate",
        headers: { "Content-Type": "application/json" } as Record<string, string>,
        body: JSON.stringify({ spaceId, environmentId, noCache }),
    };

    const { additionalHeaders } = await sdk.cma.appSignedRequest.create({ appDefinitionId: appDefinitionId }, {
        method: "POST",
        headers: request.headers,
        body: request.body,
        path: new URL(request.url).pathname,
    });

    Object.assign(request.headers, additionalHeaders);

    const httpResponse = await fetch(request.url, request);
    if(!httpResponse.ok) {
        console.error("[ERROR] The authentication backend answered with status " + httpResponse.status);
        return false;
    }
    let response: TokenResponse | null;
    try {
        response = await httpResponse.json();
    } catch {
        console.error("[ERROR] The authentication backend did not return JSON");
        return false;
    }
    if(response && response.access_token && response.expires_in) {
        cachedToken = response.access_token;
        // The token is kept until TOKEN_REFRESH_MARGIN_SECONDS before it expires. expires_in is the time it has left
        expiresAt = new Date().getTime() + (response.expires_in - TOKEN_REFRESH_MARGIN_SECONDS) * 1000;
        return true;
    }
    return false;
}

/**
 * Returns the cached token without refreshing it, for requests that cannot wait, such as while the page closes.
 *
 * @returns The access token, or null if there is none or it has expired
 */
export function getCachedAccessToken(): string | null {
    return isTokenExpired() ? null : cachedToken;
}

/**
 * Returns true when the cached token is expired or there is no cached token.
 * 
 * @returns true if the token is expired or not existing, false otherwise.
 */
function isTokenExpired(): boolean {
    if(cachedToken && expiresAt && new Date().getTime() < expiresAt) {
        return false;
    }
    return true;
}
