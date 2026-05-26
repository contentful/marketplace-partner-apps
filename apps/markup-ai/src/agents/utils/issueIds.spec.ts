import { describe, expect, it } from "vitest";
import {
  generateGroupKey,
  generateIssueId,
  normalizeCortexSeverity,
  toIssuesWithIds,
} from "./issueIds";
import type { CortexIssueIngest } from "../types";

function makeIssue(overrides: Partial<CortexIssueIngest> = {}): CortexIssueIngest {
  return {
    agent: "style_agent",
    category: "clarity",
    confidence: 0.9,
    severity: "medium",
    explanation: "Wordy sentence",
    suggestion: "short",
    position: { start: 0, end: 5, sentence: "Hello world" },
    ...overrides,
  };
}

describe("normalizeCortexSeverity", () => {
  it("returns the value when it is a valid severity", () => {
    expect(normalizeCortexSeverity("high")).toBe("high");
    expect(normalizeCortexSeverity("medium")).toBe("medium");
    expect(normalizeCortexSeverity("low")).toBe("low");
  });

  it("falls back to 'low' for unknown values", () => {
    expect(normalizeCortexSeverity("critical")).toBe("low");
    expect(normalizeCortexSeverity(null)).toBe("low");
    expect(normalizeCortexSeverity(undefined)).toBe("low");
  });
});

describe("generateIssueId / generateGroupKey", () => {
  it("produces a stable id for the same issue fields", () => {
    const issue = makeIssue();
    expect(generateIssueId(issue)).toBe(generateIssueId({ ...issue }));
  });

  it("differentiates issues at different offsets", () => {
    const a = makeIssue({ position: { start: 0, end: 5, sentence: "Hello" } });
    const b = makeIssue({ position: { start: 10, end: 15, sentence: "Hello" } });
    expect(generateIssueId(a)).not.toBe(generateIssueId(b));
  });

  it("groups issues with the same explanation and sentence", () => {
    const a = makeIssue({ position: { start: 0, end: 5, sentence: "Same sentence" } });
    const b = makeIssue({ position: { start: 10, end: 15, sentence: "Same sentence" } });
    expect(generateGroupKey(a)).toBe(generateGroupKey(b));
  });
});

describe("toIssuesWithIds", () => {
  it("attaches ids, groupKey, status, and original text", () => {
    const content = "Hello world and goodbye";
    const issues = toIssuesWithIds(
      [makeIssue({ position: { start: 6, end: 11, sentence: "Hello world" } })],
      content,
    );

    expect(issues).toHaveLength(1);
    const [issue] = issues;
    expect(issue.id).toMatch(/^issue-/);
    expect(issue.groupKey).toMatch(/^group-/);
    expect(issue.status).toBe("active");
    expect(issue.original).toBe("world");
    expect(issue.severity).toBe("medium");
  });

  it("deduplicates by id", () => {
    const issue = makeIssue();
    const result = toIssuesWithIds([issue, issue], "Hello world");
    expect(result).toHaveLength(1);
  });

  it("clamps offsets to content length", () => {
    const content = "short";
    const [issue] = toIssuesWithIds(
      [makeIssue({ position: { start: 0, end: 999, sentence: "" } })],
      content,
    );
    expect(issue.original).toBe("short");
  });
});
