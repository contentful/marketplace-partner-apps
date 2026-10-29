import { test, expect } from "vitest";

/**
 * Tests the compareObjects function in Util.js
 */
import { compareObjects } from "../src/utils/Util";

test('Compares null with null to equal true', () => {
    expect(compareObjects(null, null)).toBe(true);
});

test('Compares null with different primitive to equal false', () => {
    expect(compareObjects(null, 5)).toBe(false);
    expect(compareObjects("test", null)).toBe(false);
});

test('Compares same primitives to equal true', () => {
    expect(compareObjects(5, 5)).toBe(true);
    expect(compareObjects("test", "test")).toBe(true);
    expect(compareObjects(true, true)).toBe(true);
    expect(compareObjects(undefined, undefined)).toBe(true);
});

test('Compares different primitives to equal false', () => {
    expect(compareObjects(5, 10)).toBe(false);
    expect(compareObjects("test", "test2")).toBe(false);
    expect(compareObjects(true, false)).toBe(false);
    expect(compareObjects(undefined, null)).toBe(false);
});

test('Compares objects with same keys and values to equal true', () => {
    const obj1 = { a: 1, b: "test", c: true };
    const obj2 = { a: 1, b: "test", c: true };
    expect(compareObjects(obj1, obj2)).toBe(true);
    expect(compareObjects(obj2, obj1)).toBe(true);
});

test('Compares objects with different keys to equal false', () => {
    const obj1 = { a: 1, b: "test", c: true };
    const obj2 = { a: 1, b: "test" };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares objects with same keys but different values to equal false', () => {
    const obj1 = { a: 1, b: "test", c: true };
    const obj2 = { a: 1, b: "test", c: false };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares nested objects with same keys and values to equal true', () => {
    const obj1 = { a: 1, b: { c: 2, d: "test" } };
    const obj2 = { a: 1, b: { c: 2, d: "test" } };
    expect(compareObjects(obj1, obj2)).toBe(true);
    expect(compareObjects(obj2, obj1)).toBe(true);
});

test('Compares nested objects with different keys to equal false', () => {
    const obj1 = { a: 1, b: { c: 2, d: "test" } };
    const obj2 = { a: 1, b: { c: 2 } };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares nested objects with same keys but different values to equal false', () => {
    const obj1 = { a: 1, b: { c: 2, d: "test" } };
    const obj2 = { a: 1, b: { c: 2, d: "test2" } };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares arrays with same elements to equal true', () => {
    const obj1 = [1, 2, 3];
    const obj2 = [1, 2, 3];
    expect(compareObjects(obj1, obj2)).toBe(true);
    expect(compareObjects(obj2, obj1)).toBe(true);
});

test('Compares arrays with different elements to equal false', () => {
    const obj1 = [1, 2, 3];
    const obj2 = [1, 2, 4];
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares arrays with different lengths to equal false', () => {
    const obj1 = [1, 2, 3];
    const obj2 = [1, 2];
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares complex nested structures with same keys and values to equal true', () => {
    const obj1 = { a: 1, b: { c: 2, d: [{e: "test"}, 2, 3] } };
    const obj2 = { a: 1, b: { c: 2, d: [{e: "test"}, 2, 3] } };
    expect(compareObjects(obj1, obj2)).toBe(true);
    expect(compareObjects(obj2, obj1)).toBe(true);
});

test('Compares complex nested structures with same keys and different values to equal false', () => {
    const obj1 = { a: 1, b: { c: 2, d: [{e: "test"}, 2, 3] } };
    const obj2 = { a: 1, b: { c: 2, d: [{e: "test2"}, 2, 3] } };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares complex nested structures with different keys to equal false', () => {
    const obj1 = { a: 1, b: { c: 2, d: [{e: "test"}, 2, 3] } };
    const obj2 = { a: 1, b: { c: 2, d: [{f: "test"}, 2, 3] } };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});

test('Compares complex nexted strucutres with different arrays to equal false', () => {
    const obj1 = { a: 1, b: { c: 2, d: [{e: "test"}, 2, 3] } };
    const obj2 = { a: 1, b: { c: 2, d: [{e: "test"}, 2] } };
    expect(compareObjects(obj1, obj2)).toBe(false);
    expect(compareObjects(obj2, obj1)).toBe(false);
});
