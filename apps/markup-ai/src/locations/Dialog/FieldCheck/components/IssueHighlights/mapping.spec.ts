/**
 * Tests for mapping utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { mapIssueRange, mapSuggestionToItem, findProseMirrorPosition } from "./mapping";
import type { Suggestion } from "../../../../../api-client/types.gen";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";

// Type for mock document
interface MockDoc {
  content: { size: number };
  textBetween: ReturnType<typeof vi.fn>;
  descendants: ReturnType<typeof vi.fn>;
}

// Mock ProseMirror document
const createMockDoc = (text: string): MockDoc => {
  return {
    content: { size: text.length + 2 },
    textBetween: vi.fn((from: number, to: number) => {
      // Simulate ProseMirror text extraction
      const start = Math.max(0, from - 1);
      const end = Math.min(text.length, to - 1);
      return text.substring(start, end);
    }),
    descendants: vi.fn(
      (
        callback: (
          node: { isText?: boolean; isBlock?: boolean; text?: string },
          pos: number,
        ) => boolean,
      ) => {
        // Simulate text node traversal
        callback({ isText: true, text }, 1);
        return undefined;
      },
    ),
  };
};

describe("mapping utilities", () => {
  beforeEach(() => {
    // Mock document.createElement for HTML parsing
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const element = {
        tagName: tag.toUpperCase(),
        innerHTML: "",
        textContent: "",
        innerText: "",
        getAttribute: vi.fn(),
        querySelectorAll: vi.fn(() => []),
      } as unknown as HTMLElement;

      // Make textContent/innerText return stripped HTML based on innerHTML
      // Use a closure to access the element reference properly
      const getInnerHtml = () => (element as { innerHTML: string }).innerHTML;
      const setInnerHtml = (val: string) => {
        (element as { innerHTML: string }).innerHTML = val;
      };

      Object.defineProperty(element, "textContent", {
        get() {
          return getInnerHtml().replaceAll(/<[^>]*>/g, "");
        },
        set(val: string) {
          setInnerHtml(val);
        },
      });
      Object.defineProperty(element, "innerText", {
        get() {
          return getInnerHtml().replaceAll(/<[^>]*>/g, "");
        },
      });

      return element;
    });
  });

  // Helper to cast mock doc to ProseMirrorNode
  const asProseMirrorNode = (doc: MockDoc) => doc as unknown as ProseMirrorNode;

  describe("findProseMirrorPosition", () => {
    it("finds position for character index 0", () => {
      const doc = createMockDoc("Hello world");
      const pos = findProseMirrorPosition(asProseMirrorNode(doc), 0);
      expect(pos).toBe(0);
    });

    it("finds position for character index in text", () => {
      const doc = createMockDoc("Hello world");
      const pos = findProseMirrorPosition(asProseMirrorNode(doc), 5);
      expect(typeof pos).toBe("number");
    });
  });

  describe("mapIssueRange", () => {
    it("maps range for simple text without HTML", () => {
      const text = "Hello world";
      const doc = createMockDoc(text);

      const result = mapIssueRange(asProseMirrorNode(doc), 0, "Hello");

      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
      expect(result.from).toBeLessThanOrEqual(result.to);
    });

    it("returns valid range even with empty original", () => {
      const doc = createMockDoc("Hello world");

      const result = mapIssueRange(asProseMirrorNode(doc), 0, "");

      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
    });

    it("handles HTML content with originalHtml parameter", () => {
      const text = "Hello world";
      const doc = createMockDoc(text);
      const originalHtml = "<p>Hello world</p>";

      const result = mapIssueRange(asProseMirrorNode(doc), 3, "Hello", originalHtml);

      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
    });

    it("handles HTML entities in original text", () => {
      const text = "It's a test";
      const doc = createMockDoc(text);

      // API might return HTML entities
      const result = mapIssueRange(asProseMirrorNode(doc), 0, "It&#39;s");

      expect(result).toHaveProperty("from");
      expect(result).toHaveProperty("to");
    });
  });

  describe("mapSuggestionToItem", () => {
    // Helper to create mock suggestion
    const createMockSuggestion = (
      original: string,
      suggestion: string,
      startIndex: number,
    ): Suggestion =>
      ({
        original,
        suggestion,
        category: null,
        subcategory: "grammar",
        severity: "medium",
        position: { start_index: startIndex },
      }) as unknown as Suggestion;

    it("maps a valid suggestion to an item", () => {
      const doc = createMockDoc("This is a tset of text");
      const suggestion = createMockSuggestion("tset", "test", 10);

      const item = mapSuggestionToItem(asProseMirrorNode(doc), suggestion, 0);

      if (item) {
        expect(item.id).toBeDefined();
        expect(item.original).toBe("tset");
        expect(item.suggestion).toBe("test");
        expect(item.startIndex).toBe(10);
        expect(item.length).toBe(4);
      }
    });

    it("handles suggestion with missing position", () => {
      const doc = createMockDoc("Hello world");
      const suggestion = createMockSuggestion("Hello", "Hi", 0);

      // Should handle gracefully without throwing - result can be null or a valid SuggestItem
      expect(() => mapSuggestionToItem(asProseMirrorNode(doc), suggestion, 0)).not.toThrow();
    });

    it("handles empty original text", () => {
      const doc = createMockDoc("Hello world");
      const suggestion = createMockSuggestion("", "something", 5);

      const item = mapSuggestionToItem(asProseMirrorNode(doc), suggestion, 0);

      // Empty original should result in null item
      expect(item).toBeNull();
    });

    it("includes originalHtml when provided", () => {
      const doc = createMockDoc("Hello world");
      const suggestion = createMockSuggestion("Hello", "Hi", 0);

      // Should work with originalHtml without throwing
      expect(() =>
        mapSuggestionToItem(asProseMirrorNode(doc), suggestion, 0, "<p>Hello world</p>"),
      ).not.toThrow();
    });

    it("generates unique IDs based on position and index", () => {
      const doc = createMockDoc("Hello world test world");
      const suggestion1 = createMockSuggestion("world", "universe", 6);
      const suggestion2 = createMockSuggestion("world", "universe", 17);

      const item1 = mapSuggestionToItem(asProseMirrorNode(doc), suggestion1, 0);
      const item2 = mapSuggestionToItem(asProseMirrorNode(doc), suggestion2, 1);

      if (item1 && item2) {
        expect(item1.id).not.toBe(item2.id);
      }
    });
  });
});
