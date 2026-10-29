import { test, expect } from 'vitest';

/**
 * Tests when the folder of a file is looked up for the links to Mediaflow
 */
import { fileIdNeedingFolderLookup } from '../src/utils/MediaflowFolders';

test('Looks up the folder for a field without folderId, e.g. a migrated asset', () => {
    expect(fileIdNeedingFolderLookup({ id: 123 }, true)).toBe(123);
});

test('Skips the lookup when the field already has a folderId', () => {
    expect(fileIdNeedingFolderLookup({ id: 123, folderId: 7 }, true)).toBe(null);
});

test('Skips the lookup when links to Mediaflow are turned off', () => {
    expect(fileIdNeedingFolderLookup({ id: 123 }, false)).toBe(null);
});
