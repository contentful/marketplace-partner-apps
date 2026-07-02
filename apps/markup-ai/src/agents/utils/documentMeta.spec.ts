import { describe, expect, it } from "vitest";
import {
  buildDocumentRef,
  extensionForFieldAndContent,
  extensionForFieldFormat,
  slugifyForDocumentRef,
} from "./documentMeta";

describe("extensionForFieldFormat", () => {
  it("maps RichText to html", () => {
    expect(extensionForFieldFormat("RichText")).toBe("html");
  });

  it("maps Text to md", () => {
    expect(extensionForFieldFormat("Text")).toBe("md");
  });

  it("maps Symbol and unknown types to txt", () => {
    expect(extensionForFieldFormat("Symbol")).toBe("txt");
    expect(extensionForFieldFormat("Number")).toBe("txt");
    expect(extensionForFieldFormat("")).toBe("txt");
  });
});

describe("extensionForFieldAndContent", () => {
  it("prefers html when content was detected as html or xml", () => {
    expect(extensionForFieldAndContent("Symbol", "html")).toBe("html");
    expect(extensionForFieldAndContent("Text", "xml")).toBe("html");
  });

  it("prefers md when content was detected as markdown", () => {
    expect(extensionForFieldAndContent("Symbol", "markdown")).toBe("md");
  });

  it("keeps the field-format default when detection is plaintext", () => {
    // plaintext on a Text field stays .md (an empty markdown draft is still
    // a markdown field).
    expect(extensionForFieldAndContent("Text", "plaintext")).toBe("md");
    expect(extensionForFieldAndContent("Symbol", "plaintext")).toBe("txt");
    expect(extensionForFieldAndContent("RichText", "plaintext")).toBe("html");
  });

  it("falls back to the field format when no detection result is provided", () => {
    expect(extensionForFieldAndContent("Text", undefined)).toBe("md");
  });
});

describe("slugifyForDocumentRef", () => {
  it("converts whitespace to hyphens", () => {
    expect(slugifyForDocumentRef("This is a test article")).toBe("This-is-a-test-article");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugifyForDocumentRef("Hello   --- world!!!")).toBe("Hello-world");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugifyForDocumentRef("  -hello-  ")).toBe("hello");
  });

  it("preserves alphanumerics and casing", () => {
    expect(slugifyForDocumentRef("Article-42")).toBe("Article-42");
  });

  it("returns an empty string for empty input", () => {
    expect(slugifyForDocumentRef("")).toBe("");
    expect(slugifyForDocumentRef("   ")).toBe("");
  });
});

describe("buildDocumentRef", () => {
  it("composes title and field id with the requested extension", () => {
    expect(
      buildDocumentRef({
        title: "This is test article",
        fieldId: "description body",
        extension: "md",
      }),
    ).toBe("This-is-test-article_description-body.md");
  });

  it("supports html and txt extensions", () => {
    expect(buildDocumentRef({ title: "Hello", fieldId: "body", extension: "html" })).toBe(
      "Hello_body.html",
    );
    expect(buildDocumentRef({ title: "Hello", fieldId: "body", extension: "txt" })).toBe(
      "Hello_body.txt",
    );
  });

  it("returns undefined when title is missing or whitespace-only", () => {
    expect(
      buildDocumentRef({ title: undefined, fieldId: "body", extension: "md" }),
    ).toBeUndefined();
    expect(buildDocumentRef({ title: null, fieldId: "body", extension: "md" })).toBeUndefined();
    expect(buildDocumentRef({ title: "   ", fieldId: "body", extension: "md" })).toBeUndefined();
  });

  it("returns undefined when title slug is empty (e.g. only punctuation)", () => {
    expect(buildDocumentRef({ title: "!!!", fieldId: "body", extension: "md" })).toBeUndefined();
  });

  it("returns undefined when fieldId slug is empty", () => {
    expect(buildDocumentRef({ title: "Hello", fieldId: "", extension: "md" })).toBeUndefined();
  });
});
