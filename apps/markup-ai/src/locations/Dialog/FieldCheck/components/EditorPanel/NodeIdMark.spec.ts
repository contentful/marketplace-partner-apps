/**
 * Tests for NodeIdMark TipTap extension
 */

import { describe, it, expect } from "vitest";
import { NodeIdMark } from "./NodeIdMark";

// Type for the extension config to avoid using `any`
interface ExtensionConfig {
  parseHTML?: () => Array<{ tag: string }>;
  addAttributes?: () => Record<
    string,
    {
      default: string | null;
      parseHTML: (element: HTMLElement) => string | null;
      renderHTML: (attributes: Record<string, string | null>) => Record<string, string>;
    }
  >;
  renderHTML?: (
    this: { options: { HTMLAttributes: Record<string, string> } },
    props: { HTMLAttributes: Record<string, string> },
  ) => [string, Record<string, string>, number];
  addCommands?: (this: { name: string }) => {
    setNodeId: (
      id: string,
    ) => (context: {
      commands: { setMark: (name: string, attrs: Record<string, string>) => boolean };
    }) => boolean;
    unsetNodeId: () => (context: { commands: { unsetMark: (name: string) => boolean } }) => boolean;
  };
  addOptions?: () => { HTMLAttributes: Record<string, string> };
}

describe("NodeIdMark", () => {
  // Helper to get typed config
  const getConfig = () => NodeIdMark.config as ExtensionConfig;

  it("is defined and is a TipTap extension", () => {
    expect(NodeIdMark).toBeDefined();
    expect(NodeIdMark.name).toBe("nodeIdMark");
  });

  it("has correct extension name", () => {
    expect(NodeIdMark.name).toBe("nodeIdMark");
  });

  it("has type Mark", () => {
    expect(NodeIdMark.type).toBe("mark");
  });

  describe("configuration", () => {
    it("has parseHTML configuration for span[data-node-id]", () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.parseHTML).toBeDefined();

      if (config.parseHTML) {
        const parseHtmlConfig = config.parseHTML();
        expect(parseHtmlConfig).toBeInstanceOf(Array);
        expect(parseHtmlConfig.length).toBeGreaterThan(0);
        expect(parseHtmlConfig[0]).toHaveProperty("tag", "span[data-node-id]");
      }
    });

    it("has addAttributes configuration", () => {
      const config = getConfig();
      expect(config.addAttributes).toBeDefined();
    });

    it("has renderHTML configuration", () => {
      const config = getConfig();
      expect(config.renderHTML).toBeDefined();
    });

    it("has addCommands configuration", () => {
      const config = getConfig();
      expect(config.addCommands).toBeDefined();
    });

    it("has addOptions configuration", () => {
      const config = getConfig();
      expect(config.addOptions).toBeDefined();
    });
  });

  describe("attribute parsing", () => {
    it("addAttributes returns data-node-id attribute config", () => {
      const config = getConfig();
      if (config.addAttributes) {
        const attributes = config.addAttributes();
        expect(attributes).toHaveProperty("data-node-id");
      }
    });

    it("data-node-id attribute has default value of null", () => {
      const config = getConfig();
      if (config.addAttributes) {
        const attributes = config.addAttributes();
        expect(attributes["data-node-id"]).toHaveProperty("default", null);
      }
    });

    it("data-node-id parseHTML extracts attribute from element", () => {
      const config = getConfig();
      if (config.addAttributes) {
        const attributes = config.addAttributes();
        const parseHTML = attributes["data-node-id"].parseHTML;

        // Create a mock element with dataset property
        const mockElement = {
          getAttribute: (attr: string) => (attr === "data-node-id" ? "node-0-0" : null),
          dataset: { nodeId: "node-0-0" },
        } as unknown as HTMLElement;

        const result = parseHTML(mockElement);
        expect(result).toBe("node-0-0");
      }
    });

    it("data-node-id renderHTML returns attribute object when set", () => {
      const config = getConfig();
      if (config.addAttributes) {
        const attributes = config.addAttributes();
        const renderHTML = attributes["data-node-id"].renderHTML;

        const result = renderHTML({ "data-node-id": "node-1-2" });
        expect(result).toEqual({ "data-node-id": "node-1-2" });
      }
    });

    it("data-node-id renderHTML returns empty object when null", () => {
      const config = getConfig();
      if (config.addAttributes) {
        const attributes = config.addAttributes();
        const renderHTML = attributes["data-node-id"].renderHTML;

        const result = renderHTML({ "data-node-id": null });
        expect(result).toEqual({});
      }
    });
  });

  describe("extension options", () => {
    it("addOptions returns default HTMLAttributes", () => {
      const config = getConfig();
      if (config.addOptions) {
        const options = config.addOptions();
        expect(options).toHaveProperty("HTMLAttributes");
        expect(options.HTMLAttributes).toEqual({});
      }
    });
  });

  describe("renderHTML", () => {
    it("returns span element structure with merged attributes", () => {
      const config = getConfig();
      if (config.renderHTML) {
        // Create a mock context with options and HTMLAttributes
        const mockThis = {
          options: { HTMLAttributes: {} },
        };

        const result = config.renderHTML.call(mockThis, {
          HTMLAttributes: { "data-node-id": "test-id" },
        });

        expect(result).toBeInstanceOf(Array);
        expect(result[0]).toBe("span");
        expect(result[2]).toBe(0);
      }
    });

    it("merges custom HTMLAttributes from options", () => {
      const config = getConfig();
      if (config.renderHTML) {
        const mockThis = {
          options: { HTMLAttributes: { class: "custom-class" } },
        };

        const result = config.renderHTML.call(mockThis, {
          HTMLAttributes: { "data-node-id": "test-id" },
        });

        // Should return span with merged attributes
        expect(result[0]).toBe("span");
        expect(result[1]).toHaveProperty("class", "custom-class");
        expect(result[1]).toHaveProperty("data-node-id", "test-id");
      }
    });
  });

  describe("addCommands", () => {
    it("returns object with setNodeId and unsetNodeId commands", () => {
      const config = getConfig();
      if (config.addCommands) {
        const mockThis = {
          name: "nodeIdMark",
        };

        const commands = config.addCommands.call(mockThis);

        expect(commands).toHaveProperty("setNodeId");
        expect(commands).toHaveProperty("unsetNodeId");
        expect(typeof commands.setNodeId).toBe("function");
        expect(typeof commands.unsetNodeId).toBe("function");
      }
    });

    it("setNodeId returns a function that calls setMark", () => {
      const config = getConfig();
      if (config.addCommands) {
        const mockThis = {
          name: "nodeIdMark",
        };

        const commands = config.addCommands.call(mockThis);
        const setNodeIdCommand = commands.setNodeId("my-node-id");

        // setNodeIdCommand should be a function
        expect(typeof setNodeIdCommand).toBe("function");

        // Call it with a mock context
        const mockSetMark = (name: string, attrs: Record<string, string>) => {
          expect(name).toBe("nodeIdMark");
          expect(attrs).toEqual({ "data-node-id": "my-node-id" });
          return true;
        };

        const result = setNodeIdCommand({ commands: { setMark: mockSetMark } });
        expect(result).toBe(true);
      }
    });

    it("unsetNodeId returns a function that calls unsetMark", () => {
      const config = getConfig();
      if (config.addCommands) {
        const mockThis = {
          name: "nodeIdMark",
        };

        const commands = config.addCommands.call(mockThis);
        const unsetNodeIdCommand = commands.unsetNodeId();

        // unsetNodeIdCommand should be a function
        expect(typeof unsetNodeIdCommand).toBe("function");

        // Call it with a mock context
        const mockUnsetMark = (name: string) => {
          expect(name).toBe("nodeIdMark");
          return true;
        };

        const result = unsetNodeIdCommand({ commands: { unsetMark: mockUnsetMark } });
        expect(result).toBe(true);
      }
    });
  });
});
