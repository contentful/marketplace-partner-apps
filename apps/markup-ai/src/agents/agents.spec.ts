import { describe, expect, it } from "vitest";
import {
  AGENTS,
  AGENT_CATEGORY_MAP,
  AGENT_CONFIG_KEY_META,
  AGENT_ICON_MAP,
  CATEGORIES,
  DEFAULT_CATEGORY,
  DEFAULT_ICON,
  getAgentByID,
  getAgentIconKey,
  getFallbackAgent,
  toTitleCase,
} from "./agents";

describe("agents catalog", () => {
  it("always exposes style_agent as a runnable entry", () => {
    const style = AGENTS.find((a) => a.id === "style_agent");
    expect(style).toBeDefined();
    expect(style?.name.length).toBeGreaterThan(0);
    expect(style?.configurationKeys).toContain("style_guide_id");
  });

  it("maps known agents to their icon key", () => {
    expect(getAgentIconKey("style_agent")).toBe(AGENT_ICON_MAP.style_agent);
    expect(getAgentIconKey("terminology")).toBe(AGENT_ICON_MAP.terminology);
  });

  it("falls back to DEFAULT_ICON for unknown agents", () => {
    expect(getAgentIconKey("unknown_agent_xyz")).toBe(DEFAULT_ICON);
  });

  it("CATEGORIES covers every category referenced by AGENT_CATEGORY_MAP", () => {
    for (const categoryId of Object.values(AGENT_CATEGORY_MAP)) {
      expect(CATEGORIES[categoryId]).toBeDefined();
    }
    expect(CATEGORIES[DEFAULT_CATEGORY]).toBeDefined();
  });

  it("AGENT_CONFIG_KEY_META style_guide_id is marked as a style_guide_select", () => {
    const meta = AGENT_CONFIG_KEY_META.style_guide_id;
    expect(meta?.inputType).toBe("style_guide_select");
  });
});

describe("getAgentByID", () => {
  it("returns the matching agent from the catalog", () => {
    expect(getAgentByID("style_agent")?.id).toBe("style_agent");
  });

  it("returns null for unknown ids", () => {
    expect(getAgentByID("no_such_agent")).toBeNull();
  });
});

describe("getFallbackAgent", () => {
  it("synthesizes a catalog entry with a title-cased name", () => {
    const fallback = getFallbackAgent("custom_new_agent");
    expect(fallback.id).toBe("custom_new_agent");
    expect(fallback.name).toBe("Custom New Agent");
    expect(fallback.iconKey).toBe(DEFAULT_ICON);
    expect(fallback.category).toBe(DEFAULT_CATEGORY);
    expect(fallback.configurationKeys).toEqual([]);
  });
});

describe("toTitleCase", () => {
  it("capitalizes each snake_case word", () => {
    expect(toTitleCase("hello_world")).toBe("Hello World");
  });

  it("uppercases known acronyms", () => {
    expect(toTitleCase("ai_voice_detector")).toBe("AI Voice Detector");
    expect(toTitleCase("seo_check")).toBe("SEO Check");
  });

  it("handles an empty slug gracefully", () => {
    expect(toTitleCase("")).toBe("");
  });
});
