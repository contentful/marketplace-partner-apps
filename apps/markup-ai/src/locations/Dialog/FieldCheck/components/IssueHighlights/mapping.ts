/**
 * Mapping utilities for converting API suggestions to editor positions
 * Supports both plain text/code and rendered HTML modes
 */

import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import type { Suggestion } from "../../../../../api-client/types.gen";
import type { SuggestItem } from "./types";

/**
 * Decode HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = text;
  return tempDiv.textContent || tempDiv.innerText || text;
}

/**
 * Extract plain text from HTML (same as what API does)
 */
function extractTextFromHtml(html: string): string {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  // Get text content and normalize whitespace
  let textContent = tempDiv.textContent || tempDiv.innerText || "";
  // Normalize whitespace similar to what the API does
  textContent = textContent.replaceAll(/\s+/g, " ").trim();
  return textContent;
}

/**
 * Binary search to find document position from text index
 */
function textIndexToDocPos(doc: ProseMirrorNode, index: number): number {
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

/**
 * Find all occurrences of exact text in the document
 */
function findAllOccurrences(
  doc: ProseMirrorNode,
  original: string,
): Array<{ from: number; to: number }> {
  if (!original) return [];

  const results: Array<{ from: number; to: number }> = [];
  const docSize = doc.content.size;

  // Normalize the original text
  const normalizedOriginal = original.trim();
  if (!normalizedOriginal) return [];

  // Search through the document
  let searchPos = 0;
  while (searchPos < docSize) {
    // Get a chunk of text to search
    const chunkEnd = Math.min(docSize, searchPos + normalizedOriginal.length + 500);
    const chunk = doc.textBetween(searchPos, chunkEnd, " ", " ");

    const idx = chunk.indexOf(normalizedOriginal);
    if (idx >= 0) {
      // Found a match - now find the exact document position
      const from = searchPos + idx;
      const to = from + normalizedOriginal.length;

      // Verify the match
      const matchedText = doc.textBetween(from, Math.min(to, docSize), " ", " ");
      if (matchedText.startsWith(normalizedOriginal)) {
        results.push({ from, to });
        searchPos = from + 1; // Move past this match to find next
      } else {
        searchPos = from + 1;
      }
    } else {
      // No match in this chunk, move forward
      searchPos = Math.max(searchPos + 1, chunkEnd - normalizedOriginal.length);
    }

    // Safety check to prevent infinite loops
    if (searchPos >= docSize) break;
  }

  return results;
}

/**
 * Try to snap to the exact original text in the document
 */
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
      if (matchedText === original) {
        return { from, to };
      }
      if (matchedText.trim() === original.trim() && original.trim().length > 0) {
        return { from, to };
      }
    }
  }
  return null;
}

/**
 * Maps issue range from API position to document position
 * Handles both plain text/code and rendered HTML modes
 *
 * Key insight: The API's start_index is based on the PLAIN TEXT extracted from HTML,
 * not the HTML source position. So we need to:
 * 1. Extract plain text from original HTML (same as API does)
 * 2. Find the text at the API's start_index position
 * 3. Locate that same text in the ProseMirror document
 */
export function mapIssueRange(
  doc: ProseMirrorNode,
  startIndex: number,
  original: string,
  originalHtml?: string,
): { from: number; to: number } {
  const decodedOriginal = original ? decodeHtmlEntities(original) : "";
  const originalLength = decodedOriginal.length || original.length || 0;

  // For rendered HTML mode, use direct text matching
  if (originalHtml && original) {
    // First, try to find all exact occurrences in the document
    const allOccurrences = findAllOccurrences(doc, decodedOriginal);

    if (allOccurrences.length === 1) {
      // Only one match - use it directly
      return allOccurrences[0];
    }

    if (allOccurrences.length > 1) {
      // Multiple matches - use API's start_index to disambiguate
      // Extract plain text from HTML to get the expected context
      const htmlPlainText = extractTextFromHtml(originalHtml);

      // Get context around the API's position
      const contextBefore = htmlPlainText
        .substring(Math.max(0, startIndex - 30), startIndex)
        .trim();
      const contextAfter = htmlPlainText
        .substring(
          startIndex + originalLength,
          Math.min(htmlPlainText.length, startIndex + originalLength + 30),
        )
        .trim();

      // Score each occurrence based on surrounding context
      let bestMatch = allOccurrences[0];
      let bestScore = -1;

      for (const occ of allOccurrences) {
        let score = 0;

        // Get context from document around this occurrence
        const docBefore = doc.textBetween(Math.max(0, occ.from - 30), occ.from, " ", " ").trim();
        const docAfter = doc
          .textBetween(occ.to, Math.min(doc.content.size, occ.to + 30), " ", " ")
          .trim();

        // Check if before context matches
        if (contextBefore.length > 5 && docBefore.endsWith(contextBefore.slice(-15))) {
          score += 50;
        } else if (contextBefore.length > 0 && docBefore.includes(contextBefore.slice(-10))) {
          score += 20;
        }

        // Check if after context matches
        if (contextAfter.length > 5 && docAfter.startsWith(contextAfter.slice(0, 15))) {
          score += 50;
        } else if (contextAfter.length > 0 && docAfter.includes(contextAfter.slice(0, 10))) {
          score += 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = occ;
        }
      }

      return bestMatch;
    }

    // No exact matches found - try fuzzy matching
    const normalizedOriginal = decodedOriginal.replaceAll(/\s+/g, " ").trim();
    const snapped = snapToOriginal(doc, 0, normalizedOriginal, doc.content.size);
    if (snapped) {
      return snapped;
    }
  }

  // Standard position mapping for plain text/code
  const from = textIndexToDocPos(doc, startIndex);
  const to = textIndexToDocPos(doc, startIndex + originalLength);
  const text = doc.textBetween(from, to, "\n\n", "\n");

  if (decodedOriginal && text === decodedOriginal) {
    return { from, to };
  }

  const snapped = snapToOriginal(doc, from, decodedOriginal);
  if (snapped) {
    return snapped;
  }

  return { from, to: Math.max(from, to) };
}

/**
 * Converts API position (character index) to ProseMirror position
 */
export function findProseMirrorPosition(doc: ProseMirrorNode, charIndex: number): number {
  let currentChar = 0;
  let proseMirrorPos = 0;

  doc.descendants((node, pos) => {
    if (currentChar >= charIndex) {
      return false;
    }

    if (node.isText) {
      const text = node.text || "";
      if (currentChar + text.length >= charIndex) {
        proseMirrorPos = pos + (charIndex - currentChar);
        return false;
      }
      currentChar += text.length;
    } else if (node.isBlock && currentChar > 0) {
      currentChar += 1;
      if (currentChar > charIndex) {
        proseMirrorPos = pos;
        return false;
      }
    }

    return true;
  });

  return proseMirrorPos;
}

/**
 * Maps a Suggestion from the API to a SuggestItem with editor positions
 */
export function mapSuggestionToItem(
  doc: ProseMirrorNode,
  suggestion: Suggestion,
  index: number,
  originalHtml?: string,
): SuggestItem | null {
  const position = suggestion.position as { start_index?: number } | undefined;
  const startIndex = position?.start_index ?? 0;
  const original = suggestion.original || "";
  const length = original.length;

  // Use mapIssueRange for proper HTML position mapping
  const { from, to } = mapIssueRange(doc, startIndex, original, originalHtml);

  if (from >= to) {
    console.warn("Skipping suggestion with invalid position:", suggestion);
    return null;
  }

  return {
    id: `${String(startIndex)}:${String(length)}:${String(index)}`,
    from,
    to,
    startIndex,
    length,
    original,
    suggestion: suggestion.suggestion || "",
    category: suggestion.category,
    subcategory: suggestion.subcategory,
    originalIndex: index,
  };
}
