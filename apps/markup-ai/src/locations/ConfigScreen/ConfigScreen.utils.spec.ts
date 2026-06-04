import { describe, expect, it } from "vitest";
import { buildActiveFieldsMap, collectTextFieldsForContentType } from "./ConfigScreen.utils";

describe("buildActiveFieldsMap", () => {
  it("returns an empty map when EditorInterface is undefined", () => {
    expect(buildActiveFieldsMap(undefined)).toEqual({});
  });

  it("returns an empty map when EditorInterface has no entries", () => {
    expect(buildActiveFieldsMap({})).toEqual({});
  });

  it("flattens controls into `${contentTypeId}:${fieldId}` keys", () => {
    const result = buildActiveFieldsMap({
      blogPost: { controls: [{ fieldId: "title" }, { fieldId: "body" }] },
      author: { controls: [{ fieldId: "bio" }] },
    });
    expect(result).toEqual({
      "blogPost:title": true,
      "blogPost:body": true,
      "author:bio": true,
    });
  });

  it("ignores content types with no `controls` array", () => {
    const result = buildActiveFieldsMap({
      blogPost: { controls: [{ fieldId: "title" }] },
      author: {},
    });
    expect(result).toEqual({ "blogPost:title": true });
  });
});

describe("collectTextFieldsForContentType", () => {
  const item = {
    sys: { id: "blogPost" },
    name: "Blog Post",
    fields: [
      { id: "title", name: "Title", type: "Symbol" },
      { id: "body", name: "Body", type: "RichText" },
      { id: "summary", name: "Summary", type: "Text" },
      { id: "publishedAt", name: "Published At", type: "Date" },
      { id: "author", name: "Author", type: "Link" },
    ],
  };

  it("keeps only Text/Symbol/RichText fields", () => {
    const result = collectTextFieldsForContentType(item, {});
    expect(result.map((f) => f.id)).toEqual(["title", "body", "summary"]);
  });

  it("marks fields as checked when present in the active-fields map", () => {
    const active = { "blogPost:title": true, "blogPost:body": true };
    const result = collectTextFieldsForContentType(item, active);
    expect(result.find((f) => f.id === "title")?.isChecked).toBe(true);
    expect(result.find((f) => f.id === "body")?.isChecked).toBe(true);
    expect(result.find((f) => f.id === "summary")?.isChecked).toBe(false);
  });

  it("propagates the parent content-type's display name as modelName", () => {
    const result = collectTextFieldsForContentType(item, {});
    expect(result.every((f) => f.modelName === "Blog Post")).toBe(true);
  });

  it("returns an empty array when the content type has no text-typed fields", () => {
    const numericOnly = {
      sys: { id: "metric" },
      name: "Metric",
      fields: [{ id: "value", name: "Value", type: "Number" }],
    };
    expect(collectTextFieldsForContentType(numericOnly, {})).toEqual([]);
  });
});
