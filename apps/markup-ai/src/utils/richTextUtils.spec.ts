/**
 * Tests for RichText utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BLOCKS, MARKS, INLINES } from "@contentful/rich-text-types";
import type { Document } from "@contentful/rich-text-types";
import {
  convertRichTextToHtml,
  extractTextFromRichText,
  convertHtmlToRichText,
  createRichTextDocument,
  isRichTextDocument,
} from "./richTextUtils";

describe("richTextUtils", () => {
  describe("isRichTextDocument", () => {
    it("returns true for valid RichText Document", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [],
      };
      expect(isRichTextDocument(doc)).toBe(true);
    });

    it("returns false for null", () => {
      expect(isRichTextDocument(null)).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isRichTextDocument(undefined)).toBe(false);
    });

    it("returns false for string", () => {
      expect(isRichTextDocument("test")).toBe(false);
    });

    it("returns false for object without nodeType", () => {
      expect(isRichTextDocument({ content: [] })).toBe(false);
    });

    it("returns false for object with wrong nodeType", () => {
      expect(isRichTextDocument({ nodeType: "paragraph" })).toBe(false);
    });
  });

  describe("createRichTextDocument", () => {
    it("creates a document from simple text", () => {
      const doc = createRichTextDocument("Hello world");
      expect(doc.nodeType).toBe(BLOCKS.DOCUMENT);
      expect(doc.content).toHaveLength(1);
      expect(doc.content[0].nodeType).toBe(BLOCKS.PARAGRAPH);
    });

    it("creates multiple paragraphs from text with double newlines", () => {
      const doc = createRichTextDocument("First paragraph\n\nSecond paragraph");
      expect(doc.content).toHaveLength(2);
    });

    it("handles empty text", () => {
      const doc = createRichTextDocument("");
      expect(doc.nodeType).toBe(BLOCKS.DOCUMENT);
      expect(doc.content).toHaveLength(1);
    });
  });

  describe("convertRichTextToHtml", () => {
    it("converts simple paragraph to HTML", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Hello world",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { html, nodeMap } = convertRichTextToHtml(doc);
      expect(html).toContain("<p");
      expect(html).toContain("Hello world");
      expect(html).toContain("data-node-id");
      expect(nodeMap.size).toBe(1);
    });

    it("converts headings correctly", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.HEADING_1,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Title",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<h1");
      expect(html).toContain("Title");
    });

    it("applies bold marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Bold text",
                marks: [{ type: MARKS.BOLD }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<strong>");
      expect(html).toContain("Bold text");
    });

    it("applies italic marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Italic text",
                marks: [{ type: MARKS.ITALIC }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<em>");
    });

    it("applies underline marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Underlined",
                marks: [{ type: MARKS.UNDERLINE }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<u>");
    });

    it("converts lists correctly", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.UL_LIST,
            data: {},
            content: [
              {
                nodeType: BLOCKS.LIST_ITEM,
                data: {},
                content: [
                  {
                    nodeType: BLOCKS.PARAGRAPH,
                    data: {},
                    content: [
                      {
                        nodeType: "text",
                        value: "Item 1",
                        marks: [],
                        data: {},
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<ul");
      expect(html).toContain("<li");
      expect(html).toContain("Item 1");
    });

    it("converts blockquotes correctly", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.QUOTE,
            data: {},
            content: [
              {
                nodeType: BLOCKS.PARAGRAPH,
                data: {},
                content: [
                  {
                    nodeType: "text",
                    value: "Quote text",
                    marks: [],
                    data: {},
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<blockquote");
    });

    it("creates unique node IDs in the node map", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "First",
                marks: [],
                data: {},
              },
              {
                nodeType: "text",
                value: "Second",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { nodeMap } = convertRichTextToHtml(doc);
      expect(nodeMap.size).toBe(2);

      const ids = Array.from(nodeMap.keys());
      expect(ids[0]).not.toBe(ids[1]);
    });
  });

  describe("extractTextFromRichText", () => {
    it("extracts text from simple paragraph", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Hello world",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const text = extractTextFromRichText(doc);
      expect(text).toBe("Hello world");
    });

    it("concatenates text from multiple paragraphs", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "First",
                marks: [],
                data: {},
              },
            ],
          },
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Second",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const text = extractTextFromRichText(doc);
      expect(text).toContain("First");
      expect(text).toContain("Second");
    });
  });

  describe("convertHtmlToRichText", () => {
    beforeEach(() => {
      // Mock document.createElement for JSDOM
      vi.spyOn(document, "createElement");
    });

    it("updates text nodes in the original document", () => {
      const originalDoc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Original text",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      // First convert to get the nodeMap
      const { nodeMap } = convertRichTextToHtml(originalDoc);

      // Create modified HTML with updated text
      const nodeId = Array.from(nodeMap.keys())[0];
      const modifiedHtml = `<p><span data-node-id="${nodeId}">Modified text</span></p>`;

      const updatedDoc = convertHtmlToRichText(modifiedHtml, originalDoc, nodeMap);

      // Check that the text was updated
      const textNode = updatedDoc.content[0].content[0] as { nodeType: string; value: string };
      expect(textNode.nodeType).toBe("text");
      expect(textNode.value).toBe("Modified text");
    });

    it("preserves document structure when updating text", () => {
      const originalDoc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Text",
                marks: [{ type: MARKS.BOLD }],
                data: {},
              },
            ],
          },
        ],
      };

      const { nodeMap } = convertRichTextToHtml(originalDoc);
      const nodeId = Array.from(nodeMap.keys())[0];
      const modifiedHtml = `<p><span data-node-id="${nodeId}">Updated</span></p>`;

      const updatedDoc = convertHtmlToRichText(modifiedHtml, originalDoc, nodeMap);

      // Check structure is preserved
      expect(updatedDoc.nodeType).toBe(BLOCKS.DOCUMENT);
      expect(updatedDoc.content[0].nodeType).toBe(BLOCKS.PARAGRAPH);
      // Marks should be preserved
      const textNode = updatedDoc.content[0].content[0] as { marks: unknown[] };
      expect(textNode.marks).toHaveLength(1);
    });

    it("handles multiple text nodes", () => {
      const originalDoc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "First",
                marks: [],
                data: {},
              },
              {
                nodeType: "text",
                value: "Second",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { nodeMap } = convertRichTextToHtml(originalDoc);
      const nodeIds = Array.from(nodeMap.keys());

      const modifiedHtml = `<p><span data-node-id="${nodeIds[0]}">Changed1</span><span data-node-id="${nodeIds[1]}">Changed2</span></p>`;

      const updatedDoc = convertHtmlToRichText(modifiedHtml, originalDoc, nodeMap);

      const node0 = updatedDoc.content[0].content[0] as { value: string };
      const node1 = updatedDoc.content[0].content[1] as { value: string };
      expect(node0.value).toBe("Changed1");
      expect(node1.value).toBe("Changed2");
    });

    it("handles missing spans gracefully", () => {
      const originalDoc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Original",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { nodeMap } = convertRichTextToHtml(originalDoc);

      // HTML without any data-node-id spans
      const modifiedHtml = `<p>No spans here</p>`;

      // Should not throw and should return original doc unchanged
      const updatedDoc = convertHtmlToRichText(modifiedHtml, originalDoc, nodeMap);
      const textNode = updatedDoc.content[0].content[0] as { value: string };
      expect(textNode.value).toBe("Original");
    });

    it("handles span without id gracefully", () => {
      const originalDoc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Original",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { nodeMap } = convertRichTextToHtml(originalDoc);

      // HTML with span but no data-node-id
      const modifiedHtml = `<p><span>No id</span></p>`;

      // Should not throw
      const updatedDoc = convertHtmlToRichText(modifiedHtml, originalDoc, nodeMap);
      expect(updatedDoc).toBeDefined();
    });
  });

  describe("convertRichTextToHtml additional cases", () => {
    it("handles code marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "code text",
                marks: [{ type: MARKS.CODE }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<code>");
    });

    it("handles superscript marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "sup",
                marks: [{ type: MARKS.SUPERSCRIPT }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<sup>");
    });

    it("handles subscript marks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "sub",
                marks: [{ type: MARKS.SUBSCRIPT }],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<sub>");
    });

    it("handles ordered lists", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.OL_LIST,
            data: {},
            content: [
              {
                nodeType: BLOCKS.LIST_ITEM,
                data: {},
                content: [
                  {
                    nodeType: BLOCKS.PARAGRAPH,
                    data: {},
                    content: [
                      {
                        nodeType: "text",
                        value: "Item",
                        marks: [],
                        data: {},
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<ol");
    });

    it("handles tables", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.TABLE,
            data: {},
            content: [
              {
                nodeType: BLOCKS.TABLE_ROW,
                data: {},
                content: [
                  {
                    nodeType: BLOCKS.TABLE_CELL,
                    data: {},
                    content: [
                      {
                        nodeType: BLOCKS.PARAGRAPH,
                        data: {},
                        content: [
                          {
                            nodeType: "text",
                            value: "Cell",
                            marks: [],
                            data: {},
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<table");
      expect(html).toContain("<tr");
      expect(html).toContain("<td");
    });

    it("handles table header cells", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.TABLE,
            data: {},
            content: [
              {
                nodeType: BLOCKS.TABLE_ROW,
                data: {},
                content: [
                  {
                    nodeType: BLOCKS.TABLE_HEADER_CELL,
                    data: {},
                    content: [
                      {
                        nodeType: BLOCKS.PARAGRAPH,
                        data: {},
                        content: [
                          {
                            nodeType: "text",
                            value: "Header",
                            marks: [],
                            data: {},
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<th");
    });

    it("handles HR", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.HR,
            data: {},
            content: [],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<hr");
    });

    it("handles heading 2", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.HEADING_2,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Heading 2",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<h2");
    });

    it("handles heading 3", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.HEADING_3,
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Heading 3",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<h3");
    });

    it("handles hyperlinks", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.PARAGRAPH,
            data: {},
            content: [
              {
                nodeType: INLINES.HYPERLINK,
                data: { uri: "https://example.com" },
                content: [
                  {
                    nodeType: "text",
                    value: "Link text",
                    marks: [],
                    data: {},
                  },
                ],
              },
            ],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("<a");
      expect(html).toContain("https://example.com");
    });

    it("handles embedded entries", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.EMBEDDED_ENTRY,
            data: { target: { sys: { id: "entry123", linkType: "Entry" } } },
            content: [],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("embedded-entry");
    });

    it("handles embedded assets", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          {
            nodeType: BLOCKS.EMBEDDED_ASSET,
            data: { target: { sys: { id: "asset123", linkType: "Asset" } } },
            content: [],
          },
        ],
      };

      const { html } = convertRichTextToHtml(doc);
      expect(html).toContain("embedded-asset");
    });

    it("handles invalid nodes gracefully", () => {
      const doc: Document = {
        nodeType: BLOCKS.DOCUMENT,
        data: {},
        content: [
          // @ts-expect-error Testing invalid node
          { invalid: true },
        ],
      };

      // Should not throw
      const { html } = convertRichTextToHtml(doc);
      expect(html).toBeDefined();
    });
  });
});
