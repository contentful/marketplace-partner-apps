import { describe, it, expect } from "vitest";
import { pickString, getEntryTitle, getEntryDescription } from "./entryHelpers";

const contentTypeArticle = {
  sys: { id: "article" },
  displayField: "title",
};

describe("pickString", () => {
  it("returns string when value is string", () => {
    expect(pickString("hello")).toBe("hello");
  });

  it("returns first string value in object", () => {
    const val = pickString({ en: "Hello", fr: "Bonjour" });
    expect(val).toBe("Hello");
  });

  it("returns undefined when no string found", () => {
    expect(pickString({ en: 5 })).toBeUndefined();
  });
});

describe("getEntryTitle", () => {
  const contentTypes = [contentTypeArticle];

  it("uses displayField when available", () => {
    const entry = {
      sys: { contentType: { sys: { id: "article" } } },
      fields: { title: { en: "My Article" } },
    };
    expect(getEntryTitle(entry, contentTypes)).toBe("My Article");
  });

  it("falls back to common keys", () => {
    const entry = {
      sys: { contentType: { sys: { id: "article" } } },
      fields: { name: { en: "Common Name" } },
    };
    expect(getEntryTitle(entry, contentTypes)).toBe("Common Name");
  });

  it("falls back to first string found", () => {
    const entry = {
      sys: { contentType: { sys: { id: "article" } } },
      fields: { other: { en: "Something" } },
    };
    expect(getEntryTitle(entry, contentTypes)).toBe("Something");
  });
});

describe("getEntryDescription", () => {
  const titleKeys = ["title"];

  it("returns description from preferred keys", () => {
    const entry = { fields: { description: "This is a great article" } };
    expect(getEntryDescription(entry, titleKeys)).toBe(
      "This is a great article"
    );
  });

  it("truncates long description", () => {
    const long = "a".repeat(150);
    const entry = { fields: { description: long } };
    const result = getEntryDescription(entry, titleKeys);
    expect(result?.endsWith("…")).toBe(true);
    expect(result?.length).toBe(118);
  });

  it("uses alternative field when description absent", () => {
    const entry = { fields: { body: "Body text", title: "Title here" } };
    expect(getEntryDescription(entry, titleKeys)).toBe("Body text");
  });
});
