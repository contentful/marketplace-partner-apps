import { describe, expect, it } from "vitest";
import type { CortexIssueWithId, SSEEvent } from "./types";
import { compareByPosition, isAgentResultEvent } from "./types";

function issue(start: number, end: number): CortexIssueWithId {
  return {
    id: `i-${String(start)}-${String(end)}`,
    groupKey: "g",
    agent: "style_agent",
    confidence: 1,
    severity: "low",
    explanation: "",
    original: "",
    status: "active",
    position: { start, end, sentence: "" },
  };
}

describe("isAgentResultEvent", () => {
  it("narrows to agent_result events", () => {
    const event: SSEEvent = {
      type: "agent_result",
      agent_name: "style",
      result: null,
      success: true,
    };
    expect(isAgentResultEvent(event)).toBe(true);
  });

  it("returns false for other event types", () => {
    expect(isAgentResultEvent({ type: "completion", result: null })).toBe(false);
    expect(isAgentResultEvent({ type: "error", error: "nope" })).toBe(false);
    expect(isAgentResultEvent({ type: "status", status: "running" })).toBe(false);
  });
});

describe("compareByPosition", () => {
  it("sorts by start offset ascending", () => {
    const a = issue(10, 20);
    const b = issue(5, 8);
    const c = issue(30, 40);
    expect([a, b, c].sort(compareByPosition).map((i) => i.position.start)).toEqual([5, 10, 30]);
  });

  it("uses end offset as a tiebreaker when starts are equal", () => {
    const shorter = issue(5, 7);
    const longer = issue(5, 15);
    expect([longer, shorter].sort(compareByPosition).map((i) => i.position.end)).toEqual([7, 15]);
  });
});
