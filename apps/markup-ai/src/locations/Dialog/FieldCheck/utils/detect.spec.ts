import { describe, expect, it } from "vitest";
import { detectSyntaxKind, isDitaLikeXml, type SyntaxKind } from "./detect";

describe("isDitaLikeXml", () => {
  it.each([
    ["<topic id='x'>", true],
    ["<task><title>t</title></task>", true],
    ["<concept>", true],
    ["<reference id='r'>", true],
    ["<map>", true],
    ["<BookMap>", true],
    ["<p>just html</p>", false],
    ["plain text", false],
  ])("matches DITA-ish prefixes (%s)", (input, expected) => {
    expect(isDitaLikeXml(input)).toBe(expected);
  });
});

describe("detectSyntaxKind", () => {
  it.each<[string, SyntaxKind, string]>([
    ["", "plaintext", "empty string is plaintext"],
    ["   \n\t  ", "plaintext", "whitespace-only is plaintext"],
    ["<topic><title>Intro</title></topic>", "xml", "DITA matches xml before HTML check"],
    ["<html><body><p>hello</p></body></html>", "html", "canonical html tags → html"],
    ["<div class='x'>hi</div>", "html", "div → html"],
    ["<h2>Heading</h2>", "html", "heading tag → html"],
    ["<root><child/></root>", "xml", "non-DITA non-HTML tags fall through to generic xml"],
    ["# Title\n\nbody", "markdown", "ATX heading"],
    ["This is **bold** text", "markdown", "bold via **"],
    ["This is __also bold__", "markdown", "bold via __"],
    ["See [docs](https://example.com)", "markdown", "link syntax"],
    ["- item one\n- item two", "markdown", "unordered list"],
    ["1. first\n2. second", "markdown", "ordered list"],
    ["> a quote", "markdown", "blockquote"],
    ["use `code` inline", "markdown", "inline code"],
    ["```js\nfoo()\n```", "markdown", "fenced code block"],
    ["Just a sentence with no markup at all.", "plaintext", "no markers → plaintext"],
  ])("classifies %j as %s (%s)", (input, expected) => {
    expect(detectSyntaxKind(input)).toBe(expected);
  });
});
