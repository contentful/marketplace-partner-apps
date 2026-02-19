/**
 * Types for IssueHighlights extension
 */

import type { DecorationSet } from "@tiptap/pm/view";
import type { Suggestion } from "../../../../../api-client/types.gen";

export interface SuggestItem {
  id: string;
  from: number;
  to: number;
  startIndex: number;
  length: number;
  original: string;
  suggestion: string;
  category: string | null | undefined;
  subcategory: string | number | null | undefined;
  /** Original index in the suggestions array */
  originalIndex: number;
}

export interface AppliedRange {
  from: number;
  to: number;
}

export interface PluginState {
  decos: DecorationSet;
  items: Record<string, SuggestItem>;
  /** Original suggestions array for lookup */
  suggestions: Suggestion[];
  /** Set of original indices that should be visible (for filtering) */
  visibleIndices?: Set<number>;
  activeId?: string | null;
  navRequest?: "first" | "next" | "prev" | "goto";
  gotoIndex?: number;
  /** Ranges of applied fixes, highlighted green in the editor */
  appliedRanges?: AppliedRange[];
}
