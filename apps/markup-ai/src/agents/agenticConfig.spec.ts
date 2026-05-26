import { describe, expect, it } from "vitest";
import {
  DEFAULT_SELECTED_AGENT_IDS,
  PARALLEL_EXECUTOR_AGENT_ID,
  SELECTABLE_AGENT_BACKEND_IDS,
  normalizeAgentId,
  normalizedCatalogAgentIdsFromBackendIds,
  sanitizeAgentConfig,
  toBackendAgentIds,
} from "./agenticConfig";

describe("agenticConfig", () => {
  it("exposes the parallel executor agent ID", () => {
    expect(PARALLEL_EXECUTOR_AGENT_ID).toMatch(/^ag_/);
  });

  it("includes style_agent in the selectable backend ID map", () => {
    expect(SELECTABLE_AGENT_BACKEND_IDS.style_agent).toBe("ag_vYCPHsSQnnJj");
  });

  it("defaults the selected agents to all runnable catalog entries", () => {
    expect(DEFAULT_SELECTED_AGENT_IDS).toContain("style_agent");
  });

  describe("toBackendAgentIds", () => {
    it("maps catalog ids to backend ids and drops unknown entries", () => {
      expect(toBackendAgentIds(["style_agent", "unknown"])).toEqual(["ag_vYCPHsSQnnJj"]);
    });

    it("drops agents flagged unavailable before mapping to backend ids", () => {
      const unavailable = new Map([["style_agent", { reason: "off" }]]);
      expect(toBackendAgentIds(["style_agent"], unavailable)).toEqual([]);
    });

    it("keeps agents not flagged unavailable when an unavailable map is supplied", () => {
      const unavailable = new Map([["other_agent", { reason: "off" }]]);
      expect(toBackendAgentIds(["style_agent"], unavailable)).toEqual(["ag_vYCPHsSQnnJj"]);
    });
  });

  describe("normalizeAgentId", () => {
    it("normalizes backend 'style' → 'style_agent'", () => {
      expect(normalizeAgentId("style")).toBe("style_agent");
    });

    it("passes unknown ids through unchanged", () => {
      expect(normalizeAgentId("some_new_agent")).toBe("some_new_agent");
    });
  });

  describe("normalizedCatalogAgentIdsFromBackendIds", () => {
    it("maps a backend agent id back to its catalog id", () => {
      expect(normalizedCatalogAgentIdsFromBackendIds(["ag_vYCPHsSQnnJj"])).toEqual(["style_agent"]);
    });
  });

  describe("sanitizeAgentConfig", () => {
    it("keeps only allowlisted keys", () => {
      expect(sanitizeAgentConfig({ target_id: "ap", nonsense: "x" })).toEqual({ target_id: "ap" });
    });

    it("drops reserved body keys", () => {
      expect(sanitizeAgentConfig({ text: "hi", target_id: "ap" })).toEqual({ target_id: "ap" });
    });

    it("drops null, undefined, and empty string values", () => {
      expect(
        sanitizeAgentConfig({
          target_id: "",
        }),
      ).toEqual({});
    });

    it("keeps non-empty string values", () => {
      expect(sanitizeAgentConfig({ target_id: "ap" })).toEqual({ target_id: "ap" });
    });
  });
});
