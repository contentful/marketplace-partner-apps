import { test, expect } from 'vitest';

/**
 * Tests the getMediaflowFileUrl function in MediaflowUrl.js
 */
import { getMediaflowFileUrl, shouldShowMediaflowLinks } from '../src/utils/MediaflowUrl';

test('Builds the file URL from a folder id and a file id', () => {
    expect(getMediaflowFileUrl(13075315, 123456)).toBe("https://app.mediaflow.com/media/folder/123456/file/13075315");
});

test('Builds the file URL from string ids', () => {
    expect(getMediaflowFileUrl("13075315", "123456")).toBe("https://app.mediaflow.com/media/folder/123456/file/13075315");
});

test('Returns null when the folder id is missing', () => {
    expect(getMediaflowFileUrl(13075315, undefined)).toBe(null);
});

test('Returns null when the file id is missing', () => {
    expect(getMediaflowFileUrl(null, 123456)).toBe(null);
});

test('Shows Mediaflow links when the setting is on', () => {
    expect(shouldShowMediaflowLinks({ showMediaflowLinks: true })).toBe(true);
});

test('Hides Mediaflow links when the setting is off', () => {
    expect(shouldShowMediaflowLinks({ showMediaflowLinks: false })).toBe(false);
});

test('Shows Mediaflow links for installations without the setting', () => {
    expect([shouldShowMediaflowLinks({ clientId: "abc" }), shouldShowMediaflowLinks(undefined)]).toEqual([true, true]);
});
