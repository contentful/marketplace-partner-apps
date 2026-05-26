/**
 * Map Cortex issue offsets (from the source text we submitted) to ProseMirror positions
 * in the TipTap editor.
 *
 * Cortex returns half-open [start, end) offsets in the coordinate space of whatever
 * string we passed as `AgentRunRequest.text`. For HTML/markdown inputs we use
 * `@markupai/format-offset-mapper` to translate source offsets into the editor's
 * plain-text surface, then binary-search the document for the matching ProseMirror
 * position. For plain-text inputs the source surface already matches the editor.
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { mapOffsets, remapRange } from "@markupai/format-offset-mapper";
import type { CortexIssueWithId } from "../../../../../agents/types";
import type { IssueSourceFormat, SuggestItem } from "./types";

/** Convert a surface (plain-text) index to a ProseMirror document position. */
export function textIndexToPosCountNewlines(doc: ProseMirrorNode, index: number): number {
  const total = doc.textBetween(0, doc.content.size, "\n\n", "\n").length;
  const target = Math.max(0, Math.min(index, total));
  let lo = 0;
  let hi = doc.content.size;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const len = doc.textBetween(0, mid, "\n\n", "\n").length;
    if (len < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function snapToOriginal(
  doc: ProseMirrorNode,
  approxFrom: number,
  original: string,
  windowSize = 200,
): { from: number; to: number } | null {
  if (!original) return null;
  const start = Math.max(0, approxFrom - windowSize);
  const end = Math.min(doc.content.size, approxFrom + windowSize);

  for (let pos = start; pos <= end; pos++) {
    const slice = doc.textBetween(pos, Math.min(end, pos + original.length + 100), "\n", "\n");
    const idx = slice.indexOf(original);
    if (idx >= 0) {
      const from = pos + idx;
      const to = from + original.length;
      const matchedText = doc.textBetween(from, to, "\n", "\n");
      if (matchedText === original || matchedText.trim() === original.trim()) {
        return { from, to };
      }
    }
  }
  return null;
}

export interface MapIssueRangeOptions {
  doc: ProseMirrorNode;
  start: number;
  end: number;
  original: string;
  sourceFormat: IssueSourceFormat;
  /** The raw string submitted to Cortex; required when sourceFormat !== "plain". */
  sourceText?: string;
}

export function mapIssueRange({
  doc,
  start,
  end,
  original,
  sourceFormat,
  sourceText,
}: MapIssueRangeOptions): { from: number; to: number } {
  const clampedStart = Math.max(0, start);
  const clampedEnd = Math.max(clampedStart, end);

  if (sourceFormat !== "plain" && sourceText) {
    const editorSurface = doc.textBetween(0, doc.content.size, "\n\n", "\n");
    const offsetMap = mapOffsets(sourceFormat, sourceText, editorSurface);
    const mapped = remapRange(offsetMap, clampedStart, Math.min(clampedEnd, sourceText.length));
    const mappedStart = mapped?.start ?? offsetMap[clampedStart];
    const mappedEnd = mapped?.end ?? mappedStart;

    if (typeof mappedStart === "number" && typeof mappedEnd === "number") {
      const from = textIndexToPosCountNewlines(doc, mappedStart);
      const to = textIndexToPosCountNewlines(doc, mappedEnd);
      if (to > from) return { from, to };
    }
  }

  // Plain text or fallback: treat Cortex offsets as editor-surface offsets.
  const from = textIndexToPosCountNewlines(doc, clampedStart);
  const to = textIndexToPosCountNewlines(doc, clampedEnd);
  const text = doc.textBetween(from, to, "\n\n", "\n");
  if (original && text === original) return { from, to };

  const snapped = snapToOriginal(doc, from, original);
  if (snapped) return snapped;

  return { from, to: Math.max(from, to) };
}

export function mapIssueToItem(
  doc: ProseMirrorNode,
  issue: CortexIssueWithId,
  index: number,
  sourceFormat: IssueSourceFormat,
  sourceText?: string,
): SuggestItem | null {
  const { from, to } = mapIssueRange({
    doc,
    start: issue.position.start,
    end: issue.position.end,
    original: issue.original,
    sourceFormat,
    sourceText,
  });

  if (from >= to) return null;

  return {
    id: issue.id,
    from,
    to,
    sourceStart: issue.position.start,
    sourceEnd: issue.position.end,
    agent: issue.agent,
    severity: issue.severity,
    category: issue.category,
    confidence: issue.confidence,
    explanation: issue.explanation,
    suggestion: issue.suggestion ?? "",
    original: issue.original,
    originalIndex: index,
  };
}
