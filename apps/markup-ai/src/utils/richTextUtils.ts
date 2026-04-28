/**
 * Utilities for converting between Contentful Rich Text and HTML
 *
 * Rich Text in Contentful is stored as a JSON Document structure.
 * This module provides functions to:
 * - Convert Rich Text Document to HTML (for display and API checking)
 * - Convert HTML back to Rich Text Document (after edits)
 * - Track text node positions for applying suggestions
 */

import { Document, Block, Inline, Text, BLOCKS, INLINES, MARKS } from "@contentful/rich-text-types";

type RichTextNode = Block | Inline | Text;

export interface TextNodeWithId {
  node: Text;
  path: number[];
  id: string;
}

export interface RichTextConversionResult {
  html: string;
  nodeMap: Map<string, TextNodeWithId>;
}

/**
 * Generate a unique ID for a text node based on its path in the document
 */
const generateNodeId = (path: number[]): string => {
  return `node-${path.join("-")}`;
};

/**
 * Validate that a node is a valid Rich Text node
 */
const isValidNode = (node: RichTextNode): boolean => {
  if (typeof node !== "object") return false;
  if (!("nodeType" in node)) return false;
  return true;
};

/**
 * Wrap a block/inline node content with the appropriate HTML tag
 */
const wrapNodeWithTag = (node: Block | Inline, children: string, dataAttrs: string): string => {
  switch (node.nodeType) {
    case BLOCKS.PARAGRAPH:
      return `<p ${dataAttrs}>${children}</p>`;
    case BLOCKS.HEADING_1:
      return `<h1 ${dataAttrs}>${children}</h1>`;
    case BLOCKS.HEADING_2:
      return `<h2 ${dataAttrs}>${children}</h2>`;
    case BLOCKS.HEADING_3:
      return `<h3 ${dataAttrs}>${children}</h3>`;
    case BLOCKS.HEADING_4:
      return `<h4 ${dataAttrs}>${children}</h4>`;
    case BLOCKS.HEADING_5:
      return `<h5 ${dataAttrs}>${children}</h5>`;
    case BLOCKS.HEADING_6:
      return `<h6 ${dataAttrs}>${children}</h6>`;
    case BLOCKS.OL_LIST:
      return `<ol ${dataAttrs}>${children}</ol>`;
    case BLOCKS.UL_LIST:
      return `<ul ${dataAttrs}>${children}</ul>`;
    case BLOCKS.LIST_ITEM:
      return `<li ${dataAttrs}>${children}</li>`;
    case BLOCKS.QUOTE:
      return `<blockquote ${dataAttrs}>${children}</blockquote>`;
    case BLOCKS.HR:
      return `<hr ${dataAttrs}/>`;
    case BLOCKS.TABLE:
      return `<table ${dataAttrs}>${children}</table>`;
    case BLOCKS.TABLE_ROW:
      return `<tr ${dataAttrs}>${children}</tr>`;
    case BLOCKS.TABLE_CELL:
      return `<td ${dataAttrs}>${children}</td>`;
    case BLOCKS.TABLE_HEADER_CELL:
      return `<th ${dataAttrs}>${children}</th>`;
    case BLOCKS.EMBEDDED_ENTRY:
      return `<div class="embedded-entry" ${dataAttrs}>[Embedded Entry]</div>`;
    case BLOCKS.EMBEDDED_ASSET:
      return `<div class="embedded-asset" ${dataAttrs}>[Embedded Asset]</div>`;
    case BLOCKS.EMBEDDED_RESOURCE:
      return `<div class="embedded-resource" ${dataAttrs}>[Embedded Resource]</div>`;
    case INLINES.HYPERLINK: {
      const uri = (node.data as { uri?: string }).uri;
      return `<a href="${uri || "#"}" ${dataAttrs}>${children}</a>`;
    }
    case INLINES.ENTRY_HYPERLINK:
      return `<a href="#" class="entry-hyperlink" ${dataAttrs}>${children}</a>`;
    case INLINES.ASSET_HYPERLINK:
      return `<a href="#" class="asset-hyperlink" ${dataAttrs}>${children}</a>`;
    case INLINES.EMBEDDED_ENTRY:
      return `<span class="inline-embedded-entry" ${dataAttrs}>[Inline Entry]</span>`;
    case INLINES.EMBEDDED_RESOURCE:
      return `<span class="inline-embedded-resource" ${dataAttrs}>[Inline Resource]</span>`;
    default:
      console.warn("Unknown node type:", node.nodeType);
      return children;
  }
};

/**
 * Convert a Rich Text Document to HTML with unique IDs for each text node
 * This enables backtracking from HTML edits to the original document structure
 */
export const convertRichTextToHtml = (doc: Document): RichTextConversionResult => {
  const nodeMap = new Map<string, TextNodeWithId>();

  const processNode = (node: RichTextNode, path: number[] = []): string => {
    if (!isValidNode(node)) {
      return "";
    }

    if (node.nodeType === "text") {
      const id = generateNodeId(path);
      nodeMap.set(id, { node, path, id });

      // Apply marks to the text
      let text = node.value;
      if (node.marks.length > 0) {
        for (const mark of node.marks) {
          const markType = mark.type as (typeof MARKS)[keyof typeof MARKS];
          switch (markType) {
            case MARKS.BOLD:
              text = `<strong>${text}</strong>`;
              break;
            case MARKS.ITALIC:
              text = `<em>${text}</em>`;
              break;
            case MARKS.UNDERLINE:
              text = `<u>${text}</u>`;
              break;
            case MARKS.CODE:
              text = `<code>${text}</code>`;
              break;
            case MARKS.SUPERSCRIPT:
              text = `<sup>${text}</sup>`;
              break;
            case MARKS.SUBSCRIPT:
              text = `<sub>${text}</sub>`;
              break;
            default:
              console.warn("Unknown mark type:", mark.type);
          }
        }
      }

      return `<span data-node-id="${id}">${text}</span>`;
    }

    if ("content" in node && Array.isArray(node.content)) {
      const children = node.content
        .map((child, index) => processNode(child, [...path, index]))
        .join("");

      // Handle data attributes
      const dataAttrs = Object.entries(node.data)
        .map(([key, value]) => {
          if (key === "target" && value && typeof value === "object" && "sys" in value) {
            const sys = (value as { sys?: { linkType?: string; id?: string } }).sys;
            if (sys?.linkType && sys.id) {
              return `data-${sys.linkType.toLowerCase()}-id="${sys.id}"`;
            }
          }
          const valueStr =
            typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
          return `data-${key}="${valueStr}"`;
        })
        .join(" ");

      return wrapNodeWithTag(node, children, dataAttrs);
    }

    return "";
  };

  const htmlContent = doc.content.map((block, index) => processNode(block, [index])).join("\n");
  return { html: htmlContent, nodeMap };
};

/**
 * Extract plain text from a Rich Text Document (for API checking)
 */
export const extractTextFromRichText = (doc: Document): string => {
  const extractText = (node: RichTextNode): string => {
    if (!isValidNode(node)) return "";

    if (node.nodeType === "text") {
      return node.value;
    }

    if ("content" in node && Array.isArray(node.content)) {
      return node.content.map((child) => extractText(child)).join("");
    }

    return "";
  };

  return doc.content.map((block) => extractText(block)).join("\n\n");
};

/**
 * Update a text node at a specific path in the document
 */
const updateNodeAtPath = (doc: Document, path: number[], newValue: string): Document => {
  const newDoc = structuredClone(doc);

  let current: { content: RichTextNode[] } = newDoc;
  for (let i = 0; i < path.length - 1; i++) {
    const nextNode = current.content[path[i]];
    if (!("content" in nextNode)) {
      throw new Error(`Invalid path: node at index ${String(i)} does not have content`);
    }
    current = nextNode;
  }

  const lastIndex = path.at(-1);
  if (lastIndex === undefined) {
    throw new Error("Invalid path: path array is empty");
  }
  if (lastIndex >= current.content.length) {
    throw new Error(`Invalid path: no node found at index ${String(lastIndex)}`);
  }
  const targetNode = current.content[lastIndex];

  if (targetNode.nodeType === "text") {
    targetNode.value = newValue;
  } else {
    throw new Error(`Invalid node type at path: expected text node, got ${targetNode.nodeType}`);
  }

  return newDoc;
};

/**
 * Convert HTML back to a Rich Text Document
 * Uses the node map from the original conversion to update text values
 */
export const convertHtmlToRichText = (
  html: string,
  originalDoc: Document,
  nodeMap: Map<string, TextNodeWithId>,
): Document => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  let updatedDoc = originalDoc;

  // Find all spans with node IDs and update the corresponding nodes
  const spans = tempDiv.querySelectorAll("span[data-node-id]");
  for (const span of spans) {
    const id = (span as HTMLElement).dataset.nodeId;
    if (!id) continue;

    const nodeInfo = nodeMap.get(id);
    if (nodeInfo) {
      try {
        // Get text content, stripping any inner HTML formatting
        const textContent = span.textContent || "";
        updatedDoc = updateNodeAtPath(updatedDoc, nodeInfo.path, textContent);
      } catch (error) {
        console.error(`Error updating node ${id}:`, error);
      }
    }
  }

  return updatedDoc;
};

/**
 * Create a new Rich Text Document from plain text
 */
export const createRichTextDocument = (text: string): Document => {
  const paragraphs = text.split(/\n\n+/);

  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: paragraphs.map((paragraph) => ({
      nodeType: BLOCKS.PARAGRAPH,
      content: [
        {
          nodeType: "text",
          value: paragraph,
          marks: [],
          data: {},
        },
      ],
      data: {},
    })),
  };
};

/**
 * Check if a value is a valid Rich Text Document
 */
export const isRichTextDocument = (value: unknown): value is Document => {
  if (!value || typeof value !== "object") return false;
  if (!("nodeType" in value)) return false;
  return (value as { nodeType: unknown }).nodeType === BLOCKS.DOCUMENT;
};
