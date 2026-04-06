import { describe, expect, it } from "vitest";
import {
  mapFieldType,
  isSupportedFieldType,
  normalizeIds,
  getSupportedFields,
} from "./fieldType";

const assetLinkField = { type: "Link", linkType: "Asset" };
const entryLinkField = { type: "Link", linkType: "Entry" };
const dateField = { type: "Date" };
const objectField = { type: "Object" };
const arrayAssetField = {
  type: "Array",
  items: { type: "Link", linkType: "Asset" },
};
const arrayEntryField = {
  type: "Array",
  items: { type: "Link", linkType: "Entry" },
};

describe("mapFieldType", () => {
  it("maps asset link", () => {
    expect(mapFieldType(assetLinkField)).toEqual({
      uiType: "Asset",
      display: "Media",
    });
  });

  it("maps entry link", () => {
    expect(mapFieldType(entryLinkField)).toEqual({
      uiType: "Entry",
      display: "Reference",
    });
  });

  it("maps date", () => {
    expect(mapFieldType(dateField)).toEqual({
      uiType: "Date",
      display: "Date & time",
    });
  });

  it("maps object", () => {
    expect(mapFieldType(objectField)).toEqual({
      uiType: "JSON",
      display: "JSON object",
    });
  });

  it("maps array of asset links", () => {
    expect(mapFieldType(arrayAssetField)).toEqual({
      uiType: "Asset",
      display: "Media (multi)",
    });
  });

  it("maps array of entry links", () => {
    expect(mapFieldType(arrayEntryField)).toEqual({
      uiType: "Entry",
      display: "Reference (multi)",
    });
  });
});

describe("isSupportedFieldType", () => {
  it("supports asset link", () => {
    expect(isSupportedFieldType(assetLinkField)).toBe(true);
  });

  it("supports entry link", () => {
    expect(isSupportedFieldType(entryLinkField)).toBe(true);
  });

  it("supports date", () => {
    expect(isSupportedFieldType(dateField)).toBe(true);
  });

  it("does not support taxonomy field", () => {
    expect(
      isSupportedFieldType({ id: "taxonomy", type: "Link", linkType: "Entry" })
    ).toBe(false);
  });

  it("does not support unsupported type", () => {
    expect(isSupportedFieldType({ type: "Symbol" })).toBe(false);
  });
});

describe("normalizeIds", () => {
  it("handles undefined", () => {
    expect(normalizeIds(undefined)).toEqual([]);
  });

  it("handles single string", () => {
    expect(normalizeIds("a,b , c")).toEqual(["a", "b", "c"]);
  });

  it("handles array with duplicates and whitespace", () => {
    expect(normalizeIds(["a", "b , c", "a"])).toEqual(["a", "b", "c"]);
  });
});

describe("getSupportedFields", () => {
  it("filters content types without supported fields", () => {
    const ct1 = { sys: { id: "ct1" }, fields: [assetLinkField] };
    const ct2 = { sys: { id: "ct2" }, fields: [{ type: "Symbol" }] };
    const ct3 = { sys: { id: "ct3" }, fields: [dateField, { type: "Symbol" }] };
    const supported = getSupportedFields([ct1, ct2, ct3]);
    expect(supported.map((c: any) => c.sys.id)).toEqual(["ct1", "ct3"]);
  });
});
