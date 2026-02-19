/**
 * Custom TipTap Mark extension to preserve data-node-id attributes
 * These attributes are used to track which text nodes in the RichText Document
 * correspond to which parts of the rendered HTML
 */

import { Mark, mergeAttributes } from "@tiptap/core";

export interface NodeIdMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    nodeIdMark: {
      /**
       * Set a node ID mark
       */
      setNodeId: (nodeId: string) => ReturnType;
      /**
       * Unset a node ID mark
       */
      unsetNodeId: () => ReturnType;
    };
  }
}

export const NodeIdMark = Mark.create<NodeIdMarkOptions>({
  name: "nodeIdMark",

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      "data-node-id": {
        default: null,
        parseHTML: (element) => element.dataset.nodeId ?? null,
        renderHTML: (attributes) => {
          if (!attributes["data-node-id"]) {
            return {};
          }
          return {
            "data-node-id": attributes["data-node-id"] as string,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-node-id]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setNodeId:
        (nodeId: string) =>
        ({ commands }) => {
          return commands.setMark(this.name, { "data-node-id": nodeId });
        },
      unsetNodeId:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});
