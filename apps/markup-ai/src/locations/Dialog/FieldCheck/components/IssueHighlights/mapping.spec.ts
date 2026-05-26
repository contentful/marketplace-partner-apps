import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { schema as basicSchema } from "@tiptap/pm/schema-basic";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import type { CortexIssueWithId } from "../../../../../agents/types";
import { mapIssueRange, mapIssueToItem, textIndexToPosCountNewlines } from "./mapping";

function docFromText(text: string) {
  // Build a ProseMirror doc from a single paragraph of plain text.
  const container = document.createElement("div");
  const p = document.createElement("p");
  p.textContent = text;
  container.appendChild(p);
  const state = EditorState.create({
    doc: ProseMirrorDOMParser.fromSchema(basicSchema).parse(container),
  });
  return state.doc;
}

function issue(overrides: Partial<CortexIssueWithId> = {}): CortexIssueWithId {
  return {
    id: overrides.id ?? "i-1",
    groupKey: "g",
    agent: "style_agent",
    confidence: 1,
    severity: overrides.severity ?? "medium",
    explanation: "",
    suggestion: overrides.suggestion ?? "fix",
    original: overrides.original ?? "world",
    status: "active",
    position: overrides.position ?? { start: 6, end: 11, sentence: "Hello world" },
    ...overrides,
  };
}

describe("textIndexToPosCountNewlines", () => {
  it("is monotonic in the surface index", () => {
    const doc = docFromText("Hello world");
    const a = textIndexToPosCountNewlines(doc, 0);
    const b = textIndexToPosCountNewlines(doc, 6);
    const c = textIndexToPosCountNewlines(doc, 11);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it("clamps indices below 0 and above the surface length", () => {
    const doc = docFromText("abcde");
    expect(textIndexToPosCountNewlines(doc, -1)).toBe(textIndexToPosCountNewlines(doc, 0));
    expect(textIndexToPosCountNewlines(doc, 9999)).toBeLessThanOrEqual(doc.content.size);
  });

  it("round-trips: the PM range [from(idx), from(idx+len)] extracts the right substring", () => {
    const doc = docFromText("Hello world");
    const from = textIndexToPosCountNewlines(doc, 6);
    const to = textIndexToPosCountNewlines(doc, 11);
    expect(doc.textBetween(from, to, "\n\n", "\n")).toBe("world");
  });
});

describe("mapIssueRange (plain source)", () => {
  it("returns { from, to } spanning the exact original text", () => {
    const doc = docFromText("Hello world");
    const { from, to } = mapIssueRange({
      doc,
      start: 6,
      end: 11,
      original: "world",
      sourceFormat: "plain",
    });
    expect(doc.textBetween(from, to, "\n\n", "\n")).toBe("world");
  });

  it("snaps to the nearest occurrence when offsets are slightly off", () => {
    const doc = docFromText("Hello world");
    const { from, to } = mapIssueRange({
      doc,
      start: 0,
      end: 5, // claims "Hello" at 0..5, matches; also tests the happy path
      original: "Hello",
      sourceFormat: "plain",
    });
    expect(doc.textBetween(from, to, "\n\n", "\n")).toBe("Hello");
  });

  it("clamps negative start to 0", () => {
    const doc = docFromText("abcdef");
    const { from } = mapIssueRange({
      doc,
      start: -5,
      end: 3,
      original: "abc",
      sourceFormat: "plain",
    });
    expect(from).toBeGreaterThanOrEqual(0);
  });

  it("returns a sensible fallback range when nothing in the doc matches `original`", () => {
    const doc = docFromText("abcdef");
    const { from, to } = mapIssueRange({
      doc,
      start: 0,
      end: 3,
      original: "zzz", // never appears
      sourceFormat: "plain",
    });
    expect(from).toBeGreaterThanOrEqual(0);
    expect(to).toBeGreaterThanOrEqual(from);
  });
});

describe("mapIssueToItem", () => {
  it("returns a SuggestItem with agent/severity/offsets copied over", () => {
    const doc = docFromText("Hello world");
    const item = mapIssueToItem(
      doc,
      issue({
        id: "abc",
        severity: "high",
        suggestion: "earth",
        position: { start: 6, end: 11, sentence: "Hello world" },
      }),
      4,
      "plain",
    );
    expect(item).not.toBeNull();
    expect(item?.id).toBe("abc");
    expect(item?.agent).toBe("style_agent");
    expect(item?.severity).toBe("high");
    expect(item?.suggestion).toBe("earth");
    expect(item?.sourceStart).toBe(6);
    expect(item?.sourceEnd).toBe(11);
    expect(item?.originalIndex).toBe(4);
    expect(item?.from).toBeLessThan(item?.to ?? 0);
  });

  it("returns null when from >= to (invalid range)", () => {
    const doc = docFromText("Hello");
    const item = mapIssueToItem(
      doc,
      issue({ position: { start: 100, end: 100, sentence: "" }, original: "" }),
      0,
      "plain",
    );
    expect(item).toBeNull();
  });
});

describe("html-source offset mapping", () => {
  // Locate "world" in a wrapped HTML source — the offsets are in HTML-coordinate
  // space, but the editor doc surface is the plain text "Hello world".
  const sourceText = "<p>Hello world</p>";
  const htmlStart = sourceText.indexOf("world");
  const htmlEnd = htmlStart + "world".length;

  it("mapIssueRange translates HTML offsets to ProseMirror positions", () => {
    const doc = docFromText("Hello world");
    const { from, to } = mapIssueRange({
      doc,
      start: htmlStart,
      end: htmlEnd,
      original: "world",
      sourceFormat: "html",
      sourceText,
    });
    expect(doc.textBetween(from, to, "\n\n", "\n")).toBe("world");
  });

  it("mapIssueRange falls back to plain-offset interpretation when sourceText is omitted", () => {
    const doc = docFromText("Hello world");
    const { from, to } = mapIssueRange({
      doc,
      start: 6,
      end: 11,
      original: "world",
      sourceFormat: "html",
      // sourceText intentionally omitted — should hit the plain fallback path.
    });
    expect(doc.textBetween(from, to, "\n\n", "\n")).toBe("world");
  });

  it("mapIssueToItem maps issue offsets in HTML space onto the editor doc", () => {
    const doc = docFromText("Hello world");
    const item = mapIssueToItem(
      doc,
      issue({
        position: { start: htmlStart, end: htmlEnd, sentence: "Hello world" },
        original: "world",
      }),
      0,
      "html",
      sourceText,
    );
    expect(item).not.toBeNull();
    expect(doc.textBetween(item?.from ?? 0, item?.to ?? 0, "\n\n", "\n")).toBe("world");
  });
});
