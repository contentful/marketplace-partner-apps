// @vitest-environment jsdom
import { test, expect, vi, beforeAll, beforeEach } from 'vitest';

/**
 * Tests opening the file selector for fields that only have a file id (e.g. migrated assets)
 */
vi.mock('../src/utils/TokenManager', () => ({
    initializeTokenManager: vi.fn(),
    isReady: () => true,
    getAccessToken: async () => "token",
}));

import type { BaseAppSDK } from '@contentful/app-sdk';
import { initializeFileSelector, openFileSelector } from '../src/utils/FileSelector';

const sdk = { notifier: { warning: vi.fn(), error: vi.fn(), success: vi.fn() } };
const FileSelectorMock = vi.fn();
let root: HTMLDivElement;

beforeAll(async () => {
    (globalThis as unknown as { FileSelector: unknown }).FileSelector = FileSelectorMock;
    const loading = initializeFileSelector(sdk as unknown as BaseAppSDK);
    const script = document.querySelector('script[src*="fileselector"]') as HTMLScriptElement;
    script.onload?.(new Event('load'));
    await loading;
    root = document.createElement('div');
    root.id = 'root';
});

beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const mockFolders = (response: unknown, ok = true, status = 200) => {
    globalThis.fetch = vi.fn(async () => ({ ok, status, json: async () => response })) as unknown as typeof fetch;
};

const openedWith = () => FileSelectorMock.mock.calls[0][1];

test('Preselects the folder when the file is in one folder', async () => {
    mockFolders([{ id: 42 }]);
    await openFileSelector(root, () => {}, null, 123);
    expect(openedWith().selectedFolder).toBe(42);
    expect(openedWith().selectedFile).toBe(123);
    expect(sdk.notifier.warning).not.toHaveBeenCalled();
});

test('Preselects the first folder when the file is in multiple folders', async () => {
    mockFolders([{ id: 1 }, { id: 2 }]);
    await openFileSelector(root, () => {}, null, 123);
    expect(console.warn).toHaveBeenCalledOnce();
    expect(sdk.notifier.warning).not.toHaveBeenCalled();
    expect(openedWith().selectedFolder).toBe(1);
    expect(openedWith().selectedFile).toBe(123);
});

test('Warns and opens without a preselection when the file is in no folder', async () => {
    mockFolders([]);
    await openFileSelector(root, () => {}, null, 123);
    expect(sdk.notifier.warning).toHaveBeenCalledOnce();
    expect(openedWith().selectedFile).toBe(null);
    expect(openedWith().selectedFolder).toBe(null);
});

test('Warns and opens without a preselection when the folder request fails', async () => {
    mockFolders({ error: "Not found" }, false, 404);
    await openFileSelector(root, () => {}, null, 123);
    expect(sdk.notifier.warning).toHaveBeenCalledOnce();
    expect(openedWith().selectedFile).toBe(null);
});

test('Warns and opens without a preselection when the request throws', async () => {
    globalThis.fetch = vi.fn(async () => { throw new TypeError("Failed to fetch"); }) as unknown as typeof fetch;
    await openFileSelector(root, () => {}, null, 123);
    expect(sdk.notifier.warning).toHaveBeenCalledOnce();
    expect(openedWith().selectedFile).toBe(null);
});

test('Skips the folder lookup when the folder id is known', async () => {
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
    await openFileSelector(root, () => {}, 7, 123);
    expect(fetch).not.toHaveBeenCalled();
    expect(openedWith().selectedFolder).toBe(7);
});
