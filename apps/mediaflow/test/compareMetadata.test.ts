import { test, expect } from 'vitest';

/**
 * Tests the compareMetadata function in Util.js
 */
import { compareMetadata } from '../src/utils/Util';

test('Compares two empty objects to be true', () => {
    expect(compareMetadata({}, {})).toBe(true);
});

test('Compares two objects with the same simple metadata to be true', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "keywords": ["test", "image"]};
    const object2 = {"id": 1234, "name": "Bild.jpg", "keywords": ["test", "image"]};
    expect(compareMetadata(object1, object2)).toBe(true);
    expect(compareMetadata(object2, object1)).toBe(true);
});

test('Compares two objects with different simple metadata to be false', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "keywords": ["test", "image"]};
    const object2 = {"id": 1234, "name": "Bild.png", "keywords": ["test", "image"]};
    expect(compareMetadata(object1, object2)).toBe(false);
    expect(compareMetadata(object2, object1)).toBe(false);
});

test('Compare two objects with same metadata but different type to be true', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "keywords": ["test", "image"]};
    const object2 = {"id": "1234", "name": "Bild.jpg", "keywords": ["test", "image"]};
    expect(compareMetadata(object1, object2)).toBe(true);
    expect(compareMetadata(object2, object1)).toBe(true);
});

test('Compares two objects with same non-nested wobbly metadata to be true', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "altText": "Sample text"};
    const object2 = {"id": 1234, "name": "Bild.jpg", "alttext": "Sample text"};
    expect(compareMetadata(object1, object2)).toBe(true);
    expect(compareMetadata(object1, object2)).toBe(true);
});

test('Compares two objects with different non-nested wobbly metadata to be false', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "altText": "Sample text"};
    const object2 = {"id": 1234, "name": "Bild.jpg", "alttext": "tample Sext"};
    expect(compareMetadata(object1, object2)).toBe(false);
    expect(compareMetadata(object1, object2)).toBe(false);
});

test('Compares two objects with same nested wobbly metadata to be true', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "filetype": "png"};
    const object2 = {"id": 1234, "name": "Bild.jpg", "type": { "extension": "png" }};
    expect(compareMetadata(object1, object2)).toBe(true);
    expect(compareMetadata(object2, object1)).toBe(true);
});

test('Compares two objects with different nested wobbly metadata to be true', () => {
    const object1 = {"id": 1234, "name": "Bild.jpg", "filetype": "png"};
    const object2 = {"id": 1234, "name": "Bild.jpg", "type": { "extension": "jpg" }};
    expect(compareMetadata(object1, object2)).toBe(false);
    expect(compareMetadata(object2, object1)).toBe(false);
});
