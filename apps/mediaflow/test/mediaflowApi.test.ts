import { describe, test, expect, vi } from 'vitest';
import {
    mediaflowRequest,
    mediaflowJson,
    MediaflowApiError,
    retryDelayMs,
    metadataCheckForError,
    MAX_RATE_LIMIT_RETRIES,
    MAX_RETRY_DELAY_MS,
} from '../src/utils/MediaflowApi';

/**
 * Tests the Mediaflow request helper: status checks, token refresh on 401 and retries on 429
 */
const reply = (status: number, body: unknown = [], headers: Record<string, string> = {}) =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });

const setup = (...responses: Array<Response | Error>) => {
    const fetch = vi.fn(async () => {
        const next = responses.shift();
        if (!next) throw new Error('No more responses');
        if (next instanceof Error) throw next;
        return next;
    });
    const deps = {
        fetch: fetch as unknown as typeof globalThis.fetch,
        getAccessToken: vi.fn(async () => 'token-1'),
        refreshAccessToken: vi.fn(async () => 'token-2'),
        sleep: vi.fn(async () => {}),
        random: () => 0,
    };
    const authHeader = (call: number) => ((fetch.mock.calls[call] as unknown as [string, RequestInit])[1].headers as Record<string, string>).Authorization;
    return { deps, fetch, authHeader };
};

describe('mediaflowRequest', () => {
    test('returns a successful response with the token set', async () => {
        const { deps, authHeader } = setup(reply(200, [{ id: 1 }]));
        expect(await mediaflowJson('file/1', {}, deps)).toEqual([{ id: 1 }]);
        expect(authHeader(0)).toBe('Bearer token-1');
    });

    test('refreshes the token once after a 401 and repeats the request', async () => {
        const { deps, fetch, authHeader } = setup(reply(401), reply(200, [{ id: 1 }]));
        await mediaflowRequest('file/1', {}, deps);
        expect(deps.refreshAccessToken).toHaveBeenCalledWith('token-1');
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(authHeader(1)).toBe('Bearer token-2');
    });

    test('gives up with an auth error after a second 401', async () => {
        const { deps } = setup(reply(401), reply(401));
        await expect(mediaflowRequest('file/1', {}, deps)).rejects.toMatchObject({ kind: 'auth', status: 401 });
        expect(deps.refreshAccessToken).toHaveBeenCalledTimes(1);
    });

    test('does not refresh a token passed in by the caller', async () => {
        const { deps } = setup(reply(401));
        await expect(mediaflowRequest('file/1', { accessToken: 'fixed' }, deps)).rejects.toMatchObject({ kind: 'auth' });
        expect(deps.refreshAccessToken).not.toHaveBeenCalled();
        expect(deps.getAccessToken).not.toHaveBeenCalled();
    });

    test('waits as Retry-After says and repeats the request after a 429', async () => {
        const { deps, fetch } = setup(reply(429, '', { 'Retry-After': '2' }), reply(200));
        await mediaflowRequest('file/1', {}, deps);
        expect(deps.sleep).toHaveBeenCalledWith(2000);
        expect(fetch).toHaveBeenCalledTimes(2);
    });

    test('gives up with a rate-limit error after the last retry', async () => {
        const responses = Array.from({ length: MAX_RATE_LIMIT_RETRIES + 1 }, () => reply(429));
        const { deps, fetch } = setup(...responses);
        await expect(mediaflowRequest('file/1', {}, deps)).rejects.toMatchObject({ kind: 'rate-limit', status: 429 });
        expect(fetch).toHaveBeenCalledTimes(MAX_RATE_LIMIT_RETRIES + 1);
    });

    test('does not retry a 429 when retries are turned off', async () => {
        const { deps, fetch } = setup(reply(429));
        await expect(mediaflowRequest('file/1', { retryOnRateLimit: false }, deps)).rejects.toMatchObject({ kind: 'rate-limit' });
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('reports a 404 as not found', async () => {
        const { deps } = setup(reply(404));
        await expect(mediaflowRequest('file/1', {}, deps)).rejects.toMatchObject({ kind: 'not-found', status: 404 });
    });

    test('keeps the body of a failed request', async () => {
        const { deps } = setup(reply(400, 'Filetype pdf is not supported'));
        await expect(mediaflowRequest('cdn/resources/', {}, deps)).rejects.toMatchObject({ kind: 'http', status: 400, body: 'Filetype pdf is not supported' });
    });

    test('reports a network error', async () => {
        const { deps } = setup(new TypeError('Failed to fetch'));
        await expect(mediaflowRequest('file/1', {}, deps)).rejects.toMatchObject({ kind: 'network', status: null });
    });

    test('reports a missing token as an auth error', async () => {
        const { deps, fetch } = setup();
        deps.getAccessToken.mockRejectedValueOnce(new Error('backend down'));
        await expect(mediaflowRequest('file/1', {}, deps)).rejects.toBeInstanceOf(MediaflowApiError);
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe('retryDelayMs', () => {
    test('uses Retry-After in seconds', () => {
        expect(retryDelayMs('3', 0, 0)).toBe(3000);
    });

    test('uses Retry-After as an HTTP date', () => {
        const now = Date.parse('2026-10-28T10:00:00Z');
        expect(retryDelayMs('Wed, 28 Oct 2026 10:00:04 GMT', 0, 0, now)).toBe(4000);
    });

    test('backs off exponentially without Retry-After', () => {
        expect([0, 1, 2].map((attempt) => retryDelayMs(null, attempt, 0))).toEqual([1000, 2000, 4000]);
    });

    test('never waits longer than the maximum', () => {
        expect(retryDelayMs('120', 0, 0.9)).toBe(MAX_RETRY_DELAY_MS);
    });
});

describe('metadataCheckForError', () => {
    test('a missing file means it was removed', () => {
        expect(metadataCheckForError(new MediaflowApiError('not-found', '', 404)).value).toBe('Image got removed');
    });

    test('auth, rate limit and other errors do not claim the file was removed', () => {
        for (const kind of ['auth', 'rate-limit', 'http', 'network'] as const) {
            expect(metadataCheckForError(new MediaflowApiError(kind, '')).value).not.toBe('Image got removed');
        }
        expect(metadataCheckForError(new Error('anything')).value).toBe("Couldn't check metadata");
    });

    test('a rate limit is a warning with its own label', () => {
        expect(metadataCheckForError(new MediaflowApiError('rate-limit', '', 429))).toEqual({ type: 'warning', value: 'Mediaflow is busy, try again', label: 'Mediaflow is busy, try again' });
    });
});
