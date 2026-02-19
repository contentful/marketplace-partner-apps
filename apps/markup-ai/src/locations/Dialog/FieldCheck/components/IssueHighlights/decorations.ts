/**
 * Decoration utilities for issue highlights
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Suggestion } from "../../../../../api-client/types.gen";
import type { PluginState, SuggestItem } from "./types";
import { mapSuggestionToItem } from "./mapping";
import { ISSUE_STYLES } from "../../utils/constants";

/**
 * Builds the initial plugin state from suggestions
 * @param doc - ProseMirror document
 * @param suggestions - Array of suggestions from API
 * @param originalHtml - Original HTML string for position mapping (for rendered HTML mode)
 */
export function buildState(
  doc: ProseMirrorNode,
  suggestions: Suggestion[],
  originalHtml?: string,
): Pick<PluginState, "decos" | "items" | "suggestions"> {
  const items: Record<string, SuggestItem> = {};
  const decorations: Decoration[] = [];

  suggestions.forEach((suggestion, index) => {
    const item = mapSuggestionToItem(doc, suggestion, index, originalHtml);
    if (!item) return;

    items[item.id] = item;

    // Create underline decoration
    decorations.push(
      Decoration.inline(item.from, item.to, {
        class: "wp-issue-underline",
        "data-category": item.category ?? "",
        "data-subcategory": String(item.subcategory ?? ""),
        "data-suggest-id": item.id,
        "data-suggestion": item.suggestion,
        style: `text-decoration: underline; text-decoration-color: ${ISSUE_STYLES.UNDERLINE_COLOR}; text-decoration-thickness: ${ISSUE_STYLES.UNDERLINE_THICKNESS}; text-underline-offset: ${ISSUE_STYLES.UNDERLINE_OFFSET}; cursor: pointer;`,
      }),
    );
  });

  return {
    decos: DecorationSet.create(doc, decorations),
    items,
    suggestions,
  };
}
