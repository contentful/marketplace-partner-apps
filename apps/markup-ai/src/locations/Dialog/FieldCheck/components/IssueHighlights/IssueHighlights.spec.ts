import { describe, expect, it } from "vitest";
import type { Editor } from "@tiptap/core";
import { Schema } from "@tiptap/pm/model";
import { EditorState, Plugin } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";
import { IssueHighlights } from "./IssueHighlights";
import type { PluginState, SuggestItem } from "./types";
import { GrammarCategory, IssueCategory, Severity } from "../../../../../api-client/types.gen";
import type { Suggestion } from "../../../../../api-client/types.gen";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { group: "block", content: "text*" },
    text: { group: "inline" },
  },
});

function createDoc() {
  return schema.node("doc", null, [
    schema.node("paragraph", null, [schema.text("abcdefghijklmnopqrstuvwxyz")]),
  ]);
}

function createSuggestion(severity: Severity): Suggestion {
  return {
    original: "text",
    suggestion: "replacement",
    severity,
    position: { start_index: 0 },
    category: IssueCategory.GRAMMAR,
    subcategory: GrammarCategory.SPELLING,
  };
}

function getIssueHighlightsPlugin(): Plugin {
  const addPlugins = IssueHighlights.config.addProseMirrorPlugins;
  if (!addPlugins) {
    throw new Error("IssueHighlights missing addProseMirrorPlugins");
  }
  const plugins = addPlugins.call({
    name: "issueHighlights",
    options: {
      suggestions: [],
      originalHtml: undefined,
      onIssueClick: undefined,
    },
    storage: {},
    editor: {} as Editor,
    type: null,
    parent: undefined,
  } as {
    name: string;
    options: {
      suggestions: Suggestion[];
      originalHtml?: string;
      onIssueClick?: (payload: { suggestion: Suggestion; index: number }) => void;
    };
    storage: Record<string, unknown>;
    editor: Editor;
    type: null;
    parent: (() => Plugin[]) | undefined;
  });
  return plugins[0];
}

function buildOldState(items: Record<string, SuggestItem>, suggestions: Suggestion[]): PluginState {
  return {
    decos: DecorationSet.empty,
    items,
    suggestions,
    appliedRanges: [],
    activeId: null,
  } as PluginState;
}

function getDecorationsForVisibleIndices(
  oldState: PluginState,
  visibleIndices: number[],
): PluginState {
  const plugin = getIssueHighlightsPlugin();
  const state = EditorState.create({
    schema,
    doc: createDoc(),
    plugins: [plugin],
  });
  const tr = state.tr.setMeta(plugin, { visibleIndices });
  const pluginStateSpec = plugin.spec.state;
  if (!pluginStateSpec) {
    throw new Error("IssueHighlights plugin missing state spec");
  }
  const apply = pluginStateSpec.apply as (tr: typeof state.tr, old: PluginState) => PluginState;
  return apply(tr, oldState);
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}

function getDecorationAttr(decoration: unknown, key: string): string {
  if (!decoration || typeof decoration !== "object") return "";
  const maybeType = (decoration as Record<string, unknown>).type;
  if (!maybeType || typeof maybeType !== "object") return "";
  const maybeAttrs = (maybeType as Record<string, unknown>).attrs;
  if (!maybeAttrs || typeof maybeAttrs !== "object") return "";
  const rawValue = (maybeAttrs as Record<string, unknown>)[key];
  return typeof rawValue === "string" ? rawValue : "";
}

describe("IssueHighlights overlap segmentation and underline lanes", () => {
  it("renders stacked lanes for different severity overlaps on shared segment", () => {
    const suggestions = [createSuggestion(Severity.HIGH), createSuggestion(Severity.LOW)];
    const items: Record<string, SuggestItem> = {
      high: {
        id: "high",
        from: 2,
        to: 10,
        startIndex: 0,
        length: 8,
        original: "abcdefgh",
        suggestion: "ABCDEFGH",
        category: null,
        subcategory: null,
        originalIndex: 0,
      },
      low: {
        id: "low",
        from: 5,
        to: 8,
        startIndex: 3,
        length: 3,
        original: "def",
        suggestion: "DEF",
        category: null,
        subcategory: null,
        originalIndex: 1,
      },
    };

    const oldState = buildOldState(items, suggestions);
    const next = getDecorationsForVisibleIndices(oldState, [0, 1]);
    const decos = next.decos.find(0, createDoc().content.size);

    const sharedSegment = decos.find((d) => {
      const klass = getDecorationAttr(d, "class");
      const ids = getDecorationAttr(d, "data-suggest-ids");
      return klass.includes("wp-issue-underline") && ids.includes("high") && ids.includes("low");
    });
    expect(sharedSegment).toBeDefined();
    const suggestIds = getDecorationAttr(sharedSegment, "data-suggest-ids");
    expect(suggestIds).toContain("high");
    expect(suggestIds).toContain("low");

    const style = getDecorationAttr(sharedSegment, "style");
    expect(countOccurrences(style, "linear-gradient(")).toBe(2);
  });

  it("does not stack extra lanes for same-severity overlaps", () => {
    const suggestions = [createSuggestion(Severity.HIGH), createSuggestion(Severity.HIGH)];
    const items: Record<string, SuggestItem> = {
      highA: {
        id: "highA",
        from: 2,
        to: 10,
        startIndex: 0,
        length: 8,
        original: "abcdefgh",
        suggestion: "ABCDEFGH",
        category: null,
        subcategory: null,
        originalIndex: 0,
      },
      highB: {
        id: "highB",
        from: 5,
        to: 8,
        startIndex: 3,
        length: 3,
        original: "def",
        suggestion: "DEF",
        category: null,
        subcategory: null,
        originalIndex: 1,
      },
    };

    const oldState = buildOldState(items, suggestions);
    const next = getDecorationsForVisibleIndices(oldState, [0, 1]);
    const decos = next.decos.find(0, createDoc().content.size);

    const sharedSegment = decos.find((d) => {
      const klass = getDecorationAttr(d, "class");
      const ids = getDecorationAttr(d, "data-suggest-ids");
      return klass.includes("wp-issue-underline") && ids.includes("highA") && ids.includes("highB");
    });
    expect(sharedSegment).toBeDefined();

    const style = getDecorationAttr(sharedSegment, "style");
    expect(countOccurrences(style, "linear-gradient(")).toBe(1);
  });

  it("creates segmented decorations for partial overlaps", () => {
    const suggestions = [createSuggestion(Severity.HIGH), createSuggestion(Severity.MEDIUM)];
    const items: Record<string, SuggestItem> = {
      high: {
        id: "high",
        from: 2,
        to: 10,
        startIndex: 0,
        length: 8,
        original: "abcdefgh",
        suggestion: "ABCDEFGH",
        category: null,
        subcategory: null,
        originalIndex: 0,
      },
      medium: {
        id: "medium",
        from: 8,
        to: 14,
        startIndex: 6,
        length: 6,
        original: "ghijkl",
        suggestion: "GHIJKL",
        category: null,
        subcategory: null,
        originalIndex: 1,
      },
    };

    const oldState = buildOldState(items, suggestions);
    const next = getDecorationsForVisibleIndices(oldState, [0, 1]);
    const decos = next.decos.find(0, createDoc().content.size);

    // Expected segments from boundaries [2, 8, 10, 14]:
    // [2,8] high only, [8,10] high+medium, [10,14] medium only
    expect(decos.some((d) => d.from === 2 && d.to === 8)).toBe(true);
    expect(decos.some((d) => d.from === 8 && d.to === 10)).toBe(true);
    expect(decos.some((d) => d.from === 10 && d.to === 14)).toBe(true);
  });
});
