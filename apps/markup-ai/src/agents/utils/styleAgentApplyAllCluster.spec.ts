import { describe, expect, it } from "vitest";
import {
  buildStyleAgentApplyAllPeerCountByIssueId,
  getStyleAgentApplyAllClusterKey,
  styleAgentIssueAcceptsSuggestion,
} from "./styleAgentApplyAllCluster";
import type { CortexIssueWithId } from "../types";

function makeIssue(overrides: Partial<CortexIssueWithId> = {}): CortexIssueWithId {
  return {
    id: "issue-1",
    groupKey: "group-1",
    status: "active",
    agent: "style_agent",
    category: "tone",
    confidence: 0.9,
    severity: "medium",
    explanation: "x",
    suggestion: "fixed",
    suggestions: undefined,
    position: { start: 0, end: 5, sentence: "Spain" },
    original: "Spain",
    ...overrides,
  };
}

describe("getStyleAgentApplyAllClusterKey", () => {
  it("returns the same key for two issues with the same category, original, and suggestion", () => {
    const a = makeIssue({ id: "a" });
    const b = makeIssue({ id: "b" });
    expect(getStyleAgentApplyAllClusterKey(a)).toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("returns different keys when the original text differs", () => {
    const a = makeIssue({ original: "Spain" });
    const b = makeIssue({ original: "France" });
    expect(getStyleAgentApplyAllClusterKey(a)).not.toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("returns different keys when the category differs", () => {
    const a = makeIssue({ category: "tone" });
    const b = makeIssue({ category: "clarity" });
    expect(getStyleAgentApplyAllClusterKey(a)).not.toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("treats suggestion order as irrelevant in the cluster key", () => {
    const a = makeIssue({ suggestions: ["alpha", "beta"], suggestion: undefined });
    const b = makeIssue({ suggestions: ["beta", "alpha"], suggestion: undefined });
    expect(getStyleAgentApplyAllClusterKey(a)).toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("treats suggestion case + whitespace as irrelevant in the cluster key", () => {
    const a = makeIssue({ suggestions: ["Alpha"], suggestion: undefined });
    const b = makeIssue({ suggestions: [" alpha "], suggestion: undefined });
    expect(getStyleAgentApplyAllClusterKey(a)).toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("returns different keys when suggestion sets differ", () => {
    const a = makeIssue({ suggestions: ["alpha"], suggestion: undefined });
    const b = makeIssue({ suggestions: ["alpha", "beta"], suggestion: undefined });
    expect(getStyleAgentApplyAllClusterKey(a)).not.toBe(getStyleAgentApplyAllClusterKey(b));
  });

  it("handles missing category as empty string without throwing", () => {
    const issue = makeIssue({ category: undefined });
    expect(typeof getStyleAgentApplyAllClusterKey(issue)).toBe("string");
  });
});

describe("styleAgentIssueAcceptsSuggestion", () => {
  it("accepts an exact suggestion match", () => {
    expect(styleAgentIssueAcceptsSuggestion(makeIssue({ suggestion: "fixed" }), "fixed")).toBe(
      true,
    );
  });

  it("accepts a case-insensitive trimmed match", () => {
    const issue = makeIssue({ suggestion: "Fixed" });
    expect(styleAgentIssueAcceptsSuggestion(issue, " fixed ")).toBe(true);
  });

  it("accepts a match against any element of suggestions[]", () => {
    const issue = makeIssue({ suggestions: ["alpha", "beta"], suggestion: undefined });
    expect(styleAgentIssueAcceptsSuggestion(issue, "beta")).toBe(true);
  });

  it("rejects when nothing matches", () => {
    const issue = makeIssue({ suggestion: "fixed" });
    expect(styleAgentIssueAcceptsSuggestion(issue, "different")).toBe(false);
  });

  it("rejects when issue has no suggestions at all", () => {
    const issue = makeIssue({ suggestion: undefined, suggestions: undefined });
    expect(styleAgentIssueAcceptsSuggestion(issue, "anything")).toBe(false);
  });
});

describe("buildStyleAgentApplyAllPeerCountByIssueId", () => {
  it("counts active style_agent peers in the same cluster", () => {
    const a = makeIssue({ id: "a" });
    const b = makeIssue({ id: "b" });
    const c = makeIssue({ id: "c" });
    const map = buildStyleAgentApplyAllPeerCountByIssueId([a, b, c]);
    expect(map.get("a")).toBe(3);
    expect(map.get("b")).toBe(3);
    expect(map.get("c")).toBe(3);
  });

  it("does not include resolved or dismissed issues in the count", () => {
    const active = makeIssue({ id: "a" });
    const resolved = makeIssue({ id: "b", status: "resolved" });
    const dismissed = makeIssue({ id: "c", status: "dismissed" });
    const map = buildStyleAgentApplyAllPeerCountByIssueId([active, resolved, dismissed]);
    expect(map.get("a")).toBe(1);
    expect(map.has("b")).toBe(false);
    expect(map.has("c")).toBe(false);
  });

  it("does not include non-style_agent issues", () => {
    const styleA = makeIssue({ id: "a" });
    const tone = makeIssue({ id: "b", agent: "tone_agent" });
    const map = buildStyleAgentApplyAllPeerCountByIssueId([styleA, tone]);
    expect(map.get("a")).toBe(1);
    expect(map.has("b")).toBe(false);
  });

  it("separates issues into different clusters when their cluster key differs", () => {
    const spain1 = makeIssue({ id: "a", original: "Spain" });
    const spain2 = makeIssue({ id: "b", original: "Spain" });
    const france = makeIssue({ id: "c", original: "France" });
    const map = buildStyleAgentApplyAllPeerCountByIssueId([spain1, spain2, france]);
    expect(map.get("a")).toBe(2);
    expect(map.get("b")).toBe(2);
    expect(map.get("c")).toBe(1);
  });

  it("returns an empty map for an empty input", () => {
    expect(buildStyleAgentApplyAllPeerCountByIssueId([]).size).toBe(0);
  });
});
