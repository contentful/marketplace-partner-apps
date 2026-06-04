import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { CortexIssueWithId } from "../../../../../agents/types";
import type { IssueSourceFormat, PluginState, SuggestItem } from "./types";
import { mapIssueToItem } from "./mapping";
import { ISSUE_STYLES } from "../../utils/constants";

/**
 * Build initial plugin state from a Cortex issue list. Skips issues whose offsets do
 * not resolve to a valid editor range (out of bounds or collapsed).
 */
export function buildState(
  doc: ProseMirrorNode,
  issues: CortexIssueWithId[],
  sourceFormat: IssueSourceFormat,
  sourceText?: string,
): Pick<PluginState, "decos" | "items" | "issues"> {
  const items: Record<string, SuggestItem> = {};
  const decorations: Decoration[] = [];

  issues.forEach((issue, index) => {
    const item = mapIssueToItem(doc, issue, index, sourceFormat, sourceText);
    if (!item) return;

    items[item.id] = item;

    decorations.push(
      Decoration.inline(item.from, item.to, {
        class: "wp-issue-underline",
        "data-agent": item.agent,
        "data-category": item.category ?? "",
        "data-severity": item.severity,
        "data-suggest-id": item.id,
        "data-suggestion": item.suggestion,
        style: `text-decoration: underline; text-decoration-color: ${ISSUE_STYLES.UNDERLINE_COLOR}; text-decoration-thickness: ${ISSUE_STYLES.UNDERLINE_THICKNESS}; text-underline-offset: ${ISSUE_STYLES.UNDERLINE_OFFSET}; cursor: pointer;`,
      }),
    );
  });

  return {
    decos: DecorationSet.create(doc, decorations),
    items,
    issues,
  };
}
