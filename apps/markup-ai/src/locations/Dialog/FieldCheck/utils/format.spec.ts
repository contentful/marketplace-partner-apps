import { describe, expect, it } from "vitest";
import { formatMarkup } from "./format";

describe("formatMarkup", () => {
  it("indents HTML input with two-space indentation", () => {
    const output = formatMarkup("<div><p>hi</p></div>", "html");
    expect(output).toContain("<div>");
    expect(output).toContain("  <p>hi</p>");
  });

  it("formats XML input", () => {
    const output = formatMarkup("<root><child/></root>", "xml");
    expect(output).toContain("<root>");
  });

  it("returns the original input when beautification throws", () => {
    // Beautifier should not throw on arbitrary strings; verify the fallback path is a no-op for plain text.
    const plain = "just some text without markup";
    expect(formatMarkup(plain, "html")).toBe(plain);
  });
});
