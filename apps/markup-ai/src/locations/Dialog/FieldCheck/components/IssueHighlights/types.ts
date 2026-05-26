import type { DecorationSet } from "@tiptap/pm/view";
import type { CortexIssueWithId, CortexSeverity } from "../../../../../agents/types";

/** Source format submitted to Cortex; offsets come back in this coordinate space. */
export type IssueSourceFormat = "html" | "markdown" | "plain";

export interface SuggestItem {
  id: string;
  /** ProseMirror document position (start). */
  from: number;
  /** ProseMirror document position (end). */
  to: number;
  /** Offset in the source text we submitted to Cortex. */
  sourceStart: number;
  sourceEnd: number;
  agent: string;
  severity: CortexSeverity;
  category?: string;
  confidence: number;
  explanation: string;
  suggestion: string;
  /** Exact matched text from the submitted source. */
  original: string;
  /** Index into the original unfiltered issues array. */
  originalIndex: number;
}

export interface AppliedRange {
  from: number;
  to: number;
}

export interface PluginState {
  decos: DecorationSet;
  items: Record<string, SuggestItem>;
  issues: CortexIssueWithId[];
  /** Set of original indices that should be visible (for filtering). */
  visibleIndices?: Set<number>;
  activeId?: string | null;
  navRequest?: "first" | "next" | "prev" | "goto";
  gotoIndex?: number;
  appliedRanges?: AppliedRange[];
}
