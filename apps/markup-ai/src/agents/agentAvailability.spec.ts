import { describe, expect, it } from "vitest";
import {
  STYLE_AGENT_DISABLED_MESSAGE,
  computeAgentAvailability,
  filterRunnableAgentIds,
  unavailabilityReasonsFor,
} from "./agentAvailability";
import type { OrganizationConfigResponse } from "../api-client/types.gen";
import { StyleAgentMode } from "../api-client/types.gen";

function config(overrides: Partial<OrganizationConfigResponse> = {}): OrganizationConfigResponse {
  return {
    is_acrolinx_classic: false,
    style_agent: StyleAgentMode.ENABLED,
    style_agent_numeric_scoring: false,
    ...overrides,
  };
}

describe("computeAgentAvailability", () => {
  it("returns an empty map when config is null (fail-open)", () => {
    expect(computeAgentAvailability(null).size).toBe(0);
    expect(computeAgentAvailability(undefined).size).toBe(0);
  });

  it("does not flag style_agent when mode is enabled", () => {
    const result = computeAgentAvailability(config({ style_agent: StyleAgentMode.ENABLED }));
    expect(result.has("style_agent")).toBe(false);
  });

  it("does not flag style_agent when mode is enabled_terminology", () => {
    const result = computeAgentAvailability(
      config({ style_agent: StyleAgentMode.ENABLED_TERMINOLOGY }),
    );
    expect(result.has("style_agent")).toBe(false);
  });

  it("flags style_agent when mode is disabled", () => {
    const result = computeAgentAvailability(config({ style_agent: StyleAgentMode.DISABLED }));
    expect(result.get("style_agent")?.reason).toBe(STYLE_AGENT_DISABLED_MESSAGE);
  });

  it("treats unknown agents as available by default", () => {
    // No rule exists for `terminology` today, so it must not appear in the map
    // even when other agents are blocked.
    const result = computeAgentAvailability(config({ style_agent: StyleAgentMode.DISABLED }));
    expect(result.has("terminology")).toBe(false);
    expect(result.has("future_agent")).toBe(false);
  });

  it("returns the same empty-map reference across calls when nothing is unavailable", () => {
    // Stable identity matters for memoization deps and prop-equality checks.
    const a = computeAgentAvailability(null);
    const b = computeAgentAvailability(undefined);
    const c = computeAgentAvailability(config({ style_agent: StyleAgentMode.ENABLED }));
    expect(a).toBe(b);
    expect(b).toBe(c);
  });
});

describe("filterRunnableAgentIds", () => {
  it("returns the input unchanged when nothing is unavailable", () => {
    const result = filterRunnableAgentIds(["style_agent", "terminology"], new Map());
    expect(result).toEqual(["style_agent", "terminology"]);
  });

  it("drops agents present in the unavailability map", () => {
    const unavailable = new Map([["style_agent", { reason: "off" }]]);
    const result = filterRunnableAgentIds(["style_agent", "terminology"], unavailable);
    expect(result).toEqual(["terminology"]);
  });

  it("returns an empty array when every selection is unavailable", () => {
    const unavailable = new Map([["style_agent", { reason: "off" }]]);
    expect(filterRunnableAgentIds(["style_agent"], unavailable)).toEqual([]);
  });
});

describe("unavailabilityReasonsFor", () => {
  it("returns null when no selected agent is unavailable", () => {
    expect(unavailabilityReasonsFor(["style_agent"], new Map())).toBeNull();
  });

  it("returns the reason for an unavailable agent", () => {
    const unavailable = new Map([["style_agent", { reason: STYLE_AGENT_DISABLED_MESSAGE }]]);
    expect(unavailabilityReasonsFor(["style_agent"], unavailable)).toBe(
      STYLE_AGENT_DISABLED_MESSAGE,
    );
  });

  it("dedupes identical reasons across multiple unavailable agents", () => {
    const unavailable = new Map([
      ["style_agent", { reason: "Same reason." }],
      ["other_agent", { reason: "Same reason." }],
    ]);
    expect(unavailabilityReasonsFor(["style_agent", "other_agent"], unavailable)).toBe(
      "Same reason.",
    );
  });

  it("joins distinct reasons across multiple unavailable agents", () => {
    const unavailable = new Map([
      ["style_agent", { reason: "Reason A." }],
      ["other_agent", { reason: "Reason B." }],
    ]);
    expect(unavailabilityReasonsFor(["style_agent", "other_agent"], unavailable)).toBe(
      "Reason A. Reason B.",
    );
  });

  it("normalizes reasons missing terminal punctuation before joining", () => {
    const unavailable = new Map([
      ["style_agent", { reason: "Reason A" }],
      ["other_agent", { reason: "Reason B" }],
    ]);
    expect(unavailabilityReasonsFor(["style_agent", "other_agent"], unavailable)).toBe(
      "Reason A. Reason B.",
    );
  });

  it("preserves non-period terminal punctuation (! or ?)", () => {
    const unavailable = new Map([["agent_x", { reason: "Out of stock!" }]]);
    expect(unavailabilityReasonsFor(["agent_x"], unavailable)).toBe("Out of stock!");
  });
});
