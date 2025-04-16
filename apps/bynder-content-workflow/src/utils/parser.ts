import { Options } from "@contentful/rich-text-html-renderer";
import {
  HTMLElementNode,
  Options as HTMLToRTOptions,
  Next,
  TagConverter,
} from "contentful-rich-text-html-parser";
import {
  Block,
  INLINES,
  BLOCKS,
  MARKS,
  Node,
} from "@contentful/rich-text-types";

export const documentToHTMLOptions: Partial<Options> = {
  renderNode: {
    [INLINES.ASSET_HYPERLINK]: (node: Node) => {
      return `<p>Inline Contentful asset link, ID: ${node.data.target.sys.id}</p>`;
    },
    [BLOCKS.EMBEDDED_ASSET]: (node: Node) => {
      return `<p>Embedded Contentful asset, ID: ${node.data.target.sys.id}</p>`;
    },
    [INLINES.ENTRY_HYPERLINK]: (node: Node) => {
      return `<p>Inline Contentful entry link, ID: ${node.data.target.sys.id}</p>`;
    },
    [INLINES.EMBEDDED_ENTRY]: (node: Node) => {
      return `<p>Embedded Contentful inline entry, ID: ${node.data.target.sys.id}</p>`;
    },
    [BLOCKS.EMBEDDED_ENTRY]: (node: Node) => {
      return `<p>Embedded Contentful entry, ID: ${node.data.target.sys.id}</p>`;
    },
  },
  renderMark: {
    [MARKS.BOLD]: (text: string) => `<strong>${text}<strong>`,
    [MARKS.ITALIC]: (text: string) => `<em>${text}<em>`,
  },
};

const listItemConverter: TagConverter<Block> = (
  node: HTMLElementNode,
  next: Next
) => {
  let content: Block;
  const childNode = node.children[0];
  if (childNode && childNode.type === "element" && childNode.tagName === "ul") {
    content = {
      nodeType: BLOCKS.UL_LIST,
      data: {},
      content: next(childNode),
    };
  } else if (
    childNode &&
    childNode.type === "element" &&
    childNode.tagName === "ol"
  ) {
    content = {
      nodeType: BLOCKS.OL_LIST,
      data: {},
      content: next(childNode),
    };
  } else {
    content = {
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: next(node),
    };
  }
  return {
    nodeType: BLOCKS.LIST_ITEM,
    data: {},
    content: [content],
  };
};

export const htmlStringToDocumentOptions: Partial<HTMLToRTOptions> = {
  convertTag: {
    li: listItemConverter,
    blockquote: (node, next) => ({
      nodeType: BLOCKS.QUOTE,
      data: {},
      content: [
        {
          nodeType: BLOCKS.PARAGRAPH,
          data: {},
          content: next(node),
        },
      ],
    }),
    figure: (node, next) => ({
      nodeType: BLOCKS.PARAGRAPH,
      data: {},
      content: next(node),
    }),
    img: (node) => ({
      nodeType: INLINES.HYPERLINK,
      data: {
        uri: node.attrs.src,
      },
      content: [
        {
          nodeType: "text",
          value: node.attrs.alt || "An image from Content Workflow",
          marks: [],
          data: {},
        },
      ],
    }),
  },
};
