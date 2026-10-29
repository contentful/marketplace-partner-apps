import { MEDIAFLOW_BASE_URL } from '../config';
import { getAccessToken, refreshAccessToken } from './TokenManager';
import type { MetadataCheck } from '../types';

/** What went wrong in a Mediaflow request, so callers can show a fitting message */
export type MediaflowErrorKind = 'auth' | 'rate-limit' | 'not-found' | 'http' | 'network';

/**
 * A failed Mediaflow request. status is the HTTP status, or null when no response arrived (network error, no access token).
 * body holds the response text of a failed request, e.g. to tell an unsupported file type apart from other CDN errors.
 */
export class MediaflowApiError extends Error {
  readonly kind: MediaflowErrorKind;
  readonly status: number | null;
  readonly body: string;

  constructor(kind: MediaflowErrorKind, message: string, status: number | null = null, body = '') {
    super(message);
    this.name = 'MediaflowApiError';
    this.kind = kind;
    this.status = status;
    this.body = body;
  }
}

/** Number of retries after a 429 before giving up */
export const MAX_RATE_LIMIT_RETRIES = 3;
/** Longest wait between retries after a 429, in milliseconds, whatever Retry-After says */
export const MAX_RETRY_DELAY_MS = 10_000;
/** First wait after a 429 without Retry-After, doubled on every retry */
export const BASE_RETRY_DELAY_MS = 1_000;

export interface MediaflowRequestOptions extends RequestInit {
  /** Use this token instead of asking the TokenManager, and don't refresh it on a 401. Used while the page closes. */
  accessToken?: string;
  /** Retry after a 429. Default true */
  retryOnRateLimit?: boolean;
}

/** Replaceable parts, for tests */
export interface MediaflowRequestDependencies {
  fetch: typeof fetch;
  getAccessToken: () => Promise<string>;
  refreshAccessToken: (staleToken: string) => Promise<string>;
  sleep: (ms: number) => Promise<void>;
  random: () => number;
}

const defaultDependencies: MediaflowRequestDependencies = {
  fetch: (...args) => fetch(...args),
  getAccessToken: () => getAccessToken(),
  refreshAccessToken: (staleToken) => refreshAccessToken(staleToken),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
};

/**
 * How long to wait before retrying after a 429: Retry-After (seconds or an HTTP date) when given,
 * otherwise an exponential backoff. A random part spreads the retries of many fields loading at once.
 *
 * @param retryAfter - The Retry-After header, or null
 * @param attempt - 0 for the first retry
 * @param random - A number in [0, 1)
 * @param now - The current time in milliseconds
 * @returns The delay in milliseconds, at most MAX_RETRY_DELAY_MS
 */
export function retryDelayMs(retryAfter: string | null, attempt: number, random: number, now = Date.now()): number {
  let delay = BASE_RETRY_DELAY_MS * 2 ** attempt;
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) {
      delay = seconds * 1000;
    } else {
      const date = Date.parse(retryAfter);
      if (!Number.isNaN(date)) {
        delay = Math.max(0, date - now);
      }
    }
  }
  const jitter = random * 250;
  return Math.min(delay + jitter, MAX_RETRY_DELAY_MS);
}

function errorForResponse(status: number, body: string): MediaflowApiError {
  if (status === 401 || status === 403) {
    return new MediaflowApiError('auth', 'Mediaflow rejected the access token (' + status + ')', status, body);
  }
  if (status === 429) {
    return new MediaflowApiError('rate-limit', 'Mediaflow rate limit reached', status, body);
  }
  if (status === 404) {
    return new MediaflowApiError('not-found', 'Not found in Mediaflow', status, body);
  }
  return new MediaflowApiError('http', 'Mediaflow request failed with status ' + status, status, body);
}

/**
 * Sends a request to the Mediaflow API with the app's access token and returns the successful response.
 * On a 401 the token is refreshed once and the request repeated. On a 429 the request is repeated up to
 * MAX_RATE_LIMIT_RETRIES times, waiting as Retry-After says.
 *
 * @param path - Path relative to the Mediaflow API base URL, e.g. "file/123?fields=name"
 * @param options - fetch options plus accessToken and retryOnRateLimit
 * @param dependencies - Replaceable parts, for tests
 *
 * @throws MediaflowApiError for every failed request; kind tells what failed
 *
 * @returns The response, always with response.ok true
 */
export async function mediaflowRequest(path: string, options: MediaflowRequestOptions = {}, dependencies: Partial<MediaflowRequestDependencies> = {}): Promise<Response> {
  const deps = { ...defaultDependencies, ...dependencies };
  const { accessToken: fixedToken, retryOnRateLimit = true, headers, ...init } = options;

  const tokenFor = async (staleToken: string | null): Promise<string> => {
    if (fixedToken) {
      return fixedToken;
    }
    try {
      return staleToken ? await deps.refreshAccessToken(staleToken) : await deps.getAccessToken();
    } catch (error) {
      throw new MediaflowApiError('auth', 'No Mediaflow access token: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  let token = await tokenFor(null);
  let refreshedToken = false;
  let rateLimitRetries = 0;

  for (;;) {
    let response: Response;
    try {
      response = await deps.fetch(MEDIAFLOW_BASE_URL + path, {
        ...init,
        headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string> | undefined), Authorization: 'Bearer ' + token },
      });
    } catch (error) {
      throw new MediaflowApiError('network', 'Could not reach Mediaflow: ' + (error instanceof Error ? error.message : String(error)));
    }

    if (response.ok) {
      return response;
    }

    if (response.status === 401 && !refreshedToken && !fixedToken) {
      refreshedToken = true;
      token = await tokenFor(token);
      continue;
    }

    if (response.status === 429 && retryOnRateLimit && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
      await deps.sleep(retryDelayMs(response.headers.get('Retry-After'), rateLimitRetries, deps.random()));
      rateLimitRetries++;
      continue;
    }

    let body = '';
    try {
      body = await response.text();
    } catch {
      // The body is only used for messages
    }
    throw errorForResponse(response.status, body);
  }
}

/**
 * Like mediaflowRequest, but parses the response as JSON.
 *
 * @throws MediaflowApiError when the request fails or the response is not JSON (kind "http")
 */
export async function mediaflowJson<T>(path: string, options: MediaflowRequestOptions = {}, dependencies: Partial<MediaflowRequestDependencies> = {}): Promise<T> {
  const response = await mediaflowRequest(path, options, dependencies);
  try {
    return await response.json() as T;
  } catch {
    throw new MediaflowApiError('http', 'Mediaflow returned a response that is not JSON', response.status);
  }
}

/**
 * The message for a failed request, for notifications and badges.
 *
 * @param error - Anything thrown by mediaflowRequest
 * @param action - What was attempted, e.g. "check the metadata"
 * @returns A sentence for the user
 */
export function describeMediaflowError(error: unknown, action: string): string {
  const kind = error instanceof MediaflowApiError ? error.kind : 'http';
  switch (kind) {
    case 'auth':
      return 'Could not ' + action + ': Mediaflow authentication failed. Please make sure the app is configured correctly.';
    case 'rate-limit':
      return 'Could not ' + action + ': Mediaflow is busy. Please try again in a moment.';
    case 'network':
      return 'Could not ' + action + ': Mediaflow could not be reached. Please check your connection.';
    case 'not-found':
      return 'Could not ' + action + ': the file was not found in Mediaflow.';
    default:
      return 'Could not ' + action + ': Mediaflow returned an error.';
  }
}

/**
 * The metadata badge for a failed metadata check. Only a successful response without the file means it was removed;
 * a missing file (404) is treated the same way, every other error says the check could not be done.
 *
 * @param error - Anything thrown by mediaflowRequest
 * @returns The badge type and text
 */
export function metadataCheckForError(error: unknown): MetadataCheck {
  const kind = error instanceof MediaflowApiError ? error.kind : 'http';
  if (kind === 'not-found') {
    return { type: 'negative', value: 'Image got removed' };
  }
  if (kind === 'rate-limit') {
    return { type: 'warning', value: 'Mediaflow is busy, try again', label: 'Mediaflow is busy, try again' };
  }
  if (kind === 'auth') {
    return { type: 'negative', value: "Couldn't check metadata: authentication failed" };
  }
  return { type: 'negative', value: "Couldn't check metadata" };
}
