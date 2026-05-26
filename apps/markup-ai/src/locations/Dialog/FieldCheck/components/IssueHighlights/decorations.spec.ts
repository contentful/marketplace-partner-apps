import { describe, expect, it } from "vitest";
import { EditorState } from "@tiptap/pm/state";
import { schema as basicSchema } from "@tiptap/pm/schema-basic";
import { DOMParser as ProseMirrorDOMParser } from "@tiptap/pm/model";
import type { CortexIssueWithId } from "../../../../../agents/types";
import { buildState } from "./decorations";

function docFromText(text: string) {
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
    severity: "medium",
    category: "grammar",
    explanation: "",
    suggestion: "fix",
    original: "world",
    status: "active",
    position: { start: 6, end: 11, sentence: "Hello world" },
    ...overrides,
  };
}

describe("buildState", () => {
  it("returns a state containing one item per valid issue", () => {
    const doc = docFromText("Hello world");
    const state = buildState(doc, [issue()], "plain");
    expect(Object.keys(state.items)).toEqual(["i-1"]);
    expect(state.issues).toHaveLength(1);
    expect(state.decos.find().length).toBe(1);
  });

  it("skips issues whose offsets produce an invalid range", () => {
    const doc = docFromText("Short");
    const state = buildState(
      doc,
      [issue({ position: { start: 100, end: 100, sentence: "" }, original: "" })],
      "plain",
    );
    expect(Object.keys(state.items)).toHaveLength(0);
    expect(state.decos.find()).toHaveLength(0);
  });

  it("handles an empty issue list", () => {
    const doc = docFromText("Hello world");
    const state = buildState(doc, [], "plain");
    expect(Object.keys(state.items)).toHaveLength(0);
    expect(state.decos.find()).toHaveLength(0);
  });
});
