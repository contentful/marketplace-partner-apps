import { test, expect, vi } from 'vitest';
import type { BaseAppSDK } from '@contentful/app-sdk';
import { batchUpdateMetadata, describeMetadataUpdate } from '../src/utils/Util';
import type { UpdatableField } from '../src/utils/Util';

/**
 * Tests the metadata update for several fields: counts, missing files and failed requests
 */
const sdk = {
    ids: { app: 'app', space: 'space', environment: 'master' },
    cma: { appSignedRequest: { create: vi.fn() } },
} as unknown as BaseAppSDK;

const field = (value: Record<string, unknown> | null): UpdatableField & { setValue: ReturnType<typeof vi.fn> } => {
    let current = value;
    return {
        type: 'Object',
        getValue: () => current,
        setValue: vi.fn(async (next) => { current = next; return next; }),
    };
};

const deps = (response: Response) => ({
    fetch: vi.fn(async () => response) as unknown as typeof fetch,
    getAccessToken: async () => 'token',
    refreshAccessToken: async () => 'token',
    sleep: async () => {},
    random: () => 0,
});

test('updates changed fields, skips current ones and counts missing files', async () => {
    const changed = field({ id: 1, isMediaflowAsset: true, name: 'Old name' });
    const current = field({ id: 2, isMediaflowAsset: true, name: 'Same' });
    const gone = field({ id: 3, isMediaflowAsset: true, name: 'Deleted' });
    const notMediaflow = field(null);
    const response = new Response(JSON.stringify([{ id: 1, name: 'New name' }, { id: 2, name: 'Same' }, null]), { status: 200 });

    const result = await batchUpdateMetadata(sdk, [changed, current, gone, notMediaflow], deps(response));

    expect(result).toEqual({ updated: 1, unchanged: 1, missing: 1, failed: 0 });
    expect(changed.setValue).toHaveBeenCalledTimes(1);
    expect((changed.getValue() as Record<string, unknown>).name).toBe('New name');
    expect(current.setValue).not.toHaveBeenCalled();
    expect(gone.setValue).not.toHaveBeenCalled();
});

test('counts fields whose new value could not be written as failed, not updated', async () => {
    const saved = field({ id: 1, isMediaflowAsset: true, name: 'Old name' });
    const rejected = field({ id: 2, isMediaflowAsset: true, name: 'Old name' });
    rejected.setValue.mockRejectedValueOnce(new Error('Entry is archived'));
    const response = new Response(JSON.stringify([{ id: 1, name: 'New name' }, { id: 2, name: 'New name' }]), { status: 200 });
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await batchUpdateMetadata(sdk, [saved, rejected], deps(response));

    expect(result).toEqual({ updated: 1, unchanged: 0, missing: 0, failed: 1 });
    expect(consoleError).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ message: 'Entry is archived' }));
    consoleError.mockRestore();
});

test('throws when Mediaflow fails, instead of reporting the files as removed', async () => {
    const changed = field({ id: 1, isMediaflowAsset: true, name: 'Old name' });
    await expect(batchUpdateMetadata(sdk, [changed], deps(new Response('', { status: 500 })))).rejects.toMatchObject({ kind: 'http', status: 500 });
    expect(changed.setValue).not.toHaveBeenCalled();
});

test('describes the result for the notification', () => {
    expect(describeMetadataUpdate({ updated: 2, unchanged: 1, missing: 0, failed: 0 })).toBe('Updated 2 fields, 1 already up to date.');
    expect(describeMetadataUpdate({ updated: 0, unchanged: 3, missing: 0, failed: 0 })).toBe('All 3 fields already up to date.');
    expect(describeMetadataUpdate({ updated: 1, unchanged: 0, missing: 1, failed: 0 })).toBe('Updated 1 field. 1 field points to a file that no longer exists in Mediaflow.');
    expect(describeMetadataUpdate({ updated: 0, unchanged: 0, missing: 0, failed: 0 })).toBe('There are no Mediaflow files in this entry.');
    expect(describeMetadataUpdate({ updated: 1, unchanged: 0, missing: 0, failed: 2 })).toBe('Updated 1 field. 2 fields could not be saved.');
    expect(describeMetadataUpdate({ updated: 0, unchanged: 0, missing: 1, failed: 1 })).toBe('1 field points to a file that no longer exists in Mediaflow. 1 field could not be saved.');
    expect(describeMetadataUpdate({ updated: 0, unchanged: 0, missing: 0, failed: 1 })).toBe('1 field could not be saved.');
});
