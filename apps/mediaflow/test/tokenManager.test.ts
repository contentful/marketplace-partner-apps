import { test, expect, vi, beforeEach } from 'vitest';
import type { BaseAppSDK } from '@contentful/app-sdk';

/**
 * Tests that the frontend keeps a token until fewer than 60 seconds are left
 */
let tokenNumber = 0;
const fetchMock = vi.fn(async () => {
    tokenNumber++;
    return new Response(JSON.stringify({ access_token: 'token-' + tokenNumber, expires_in: 3600 }), { status: 200 });
});

const sdk = {
    ids: { app: 'app', space: 'space', environment: 'master' },
    cma: { appSignedRequest: { create: vi.fn(async () => ({ additionalHeaders: {} })) } },
} as unknown as BaseAppSDK;

beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_BACKEND_URL', 'https://backend.example/');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T10:00:00Z'));
    tokenNumber = 0;
    fetchMock.mockClear();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
});

const load = async () => {
    const tokenManager = await import('../src/utils/TokenManager');
    tokenManager.initializeTokenManager(sdk);
    return tokenManager;
};

test('reuses the token while more than 60 seconds are left', async () => {
    const { getAccessToken, TOKEN_REFRESH_MARGIN_SECONDS } = await load();
    expect(await getAccessToken()).toBe('token-1');
    vi.advanceTimersByTime((3600 - TOKEN_REFRESH_MARGIN_SECONDS - 1) * 1000);
    expect(await getAccessToken()).toBe('token-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('gets a new token when 60 seconds or fewer are left', async () => {
    const { getAccessToken, TOKEN_REFRESH_MARGIN_SECONDS } = await load();
    await getAccessToken();
    vi.advanceTimersByTime((3600 - TOKEN_REFRESH_MARGIN_SECONDS) * 1000);
    expect(await getAccessToken()).toBe('token-2');
});

test('calls at the same time share one refresh', async () => {
    const { getAccessToken } = await load();
    const tokens = await Promise.all([getAccessToken(), getAccessToken(), getAccessToken()]);
    expect(tokens).toEqual(['token-1', 'token-1', 'token-1']);
    expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('refreshAccessToken returns a newer token without asking the backend again', async () => {
    const { getAccessToken, refreshAccessToken } = await load();
    await getAccessToken();
    expect(await refreshAccessToken('token-1')).toBe('token-2');
    expect(await refreshAccessToken('token-1')).toBe('token-2');
    expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('a failed backend response is not used as a token', async () => {
    const { getAccessToken } = await load();
    fetchMock.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
    await expect(getAccessToken()).rejects.toThrow();
});
