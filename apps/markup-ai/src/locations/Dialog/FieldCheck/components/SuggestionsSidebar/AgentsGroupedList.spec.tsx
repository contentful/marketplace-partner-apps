import { describe, expect, it, vi } from "vitest";
import { useRef } from "react";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../../../test/utils/testUtils";
import { AgentsGroupedList } from "./AgentsGroupedList";
import type { CortexIssueWithId } from "../../../../../agents/types";

function makeIssue(overrides: Partial<CortexIssueWithId> = {}): CortexIssueWithId {
  return {
    id: "issue-1",
    groupKey: "group-1",
    status: "active",
    agent: "style_agent",
    category: "tone",
    confidence: 0.9,
    severity: "medium",
    explanation: "Why this matters",
    suggestion: "fixed",
    suggestions: undefined,
    position: { start: 0, end: 5, sentence: "Spain" },
    original: "Spain",
    ...overrides,
  };
}

function Harness({
  issues,
  onSelectIssue,
  onApplyIssue,
  onApplyAllMatching,
  onDismissIssue,
}: Readonly<{
  issues: CortexIssueWithId[];
  onSelectIssue?: (issue: CortexIssueWithId | null, index: number) => void;
  onApplyIssue?: (issue: CortexIssueWithId, index: number, suggestion?: string) => void;
  onApplyAllMatching?: (issue: CortexIssueWithId, suggestion?: string) => void;
  onDismissIssue?: (issue: CortexIssueWithId, index: number) => void;
}>) {
  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const issueToOriginalIndex = new Map<CortexIssueWithId, number>();
  issues.forEach((issue, idx) => issueToOriginalIndex.set(issue, idx));
  return (
    <AgentsGroupedList
      issues={issues}
      issueToOriginalIndex={issueToOriginalIndex}
      exitingIndices={new Set()}
      selectedIssueIndex={null}
      onSelectIssue={onSelectIssue ?? vi.fn()}
      onApplyIssue={onApplyIssue ?? vi.fn()}
      onApplyAllMatching={onApplyAllMatching ?? vi.fn()}
      onDismissIssue={onDismissIssue ?? vi.fn()}
      styleAgentApplyAllPeerCountByIssueId={new Map()}
      cardRefs={cardRefs}
    />
  );
}

describe("AgentsGroupedList", () => {
  it("renders an empty message when there are no issues", () => {
    const { getByText } = render(<Harness issues={[]} />);
    expect(getByText(/no suggestions match your filters/i)).toBeInTheDocument();
  });

  it("auto-opens the only agent section when there's a single agent", () => {
    const issues = [makeIssue({ id: "a", agent: "style_agent" })];
    const { getByText, getAllByText, queryByLabelText } = render(<Harness issues={issues} />);
    // Style Agent is in Brand category by default
    expect(getByText("Brand")).toBeInTheDocument();
    // In grouped view the per-card AgentBadge is hidden (the group header already names
    // the agent), so the agent name appears only in the section header.
    expect(getAllByText("Style Agent").length).toBe(1);
    // Body content (the SuggestionCard rendered when the section is open) is present.
    expect(queryByLabelText("Dismiss issue")).not.toBeNull();
  });

  it("shows '1 issue' / 'N issues' counters", () => {
    const issues = [makeIssue({ id: "a" }), makeIssue({ id: "b" }), makeIssue({ id: "c" })];
    const { getByText } = render(<Harness issues={issues} />);
    expect(getByText(/3 issues/)).toBeInTheDocument();
  });

  it("buckets unknown agents into the 'Other' category", () => {
    const issues = [makeIssue({ id: "a", agent: "made_up_agent" })];
    const { getByText } = render(<Harness issues={issues} />);
    expect(getByText("Other")).toBeInTheDocument();
  });

  it("starts collapsed when there are multiple agent sections", () => {
    const issues = [
      makeIssue({ id: "a", agent: "style_agent" }),
      makeIssue({ id: "b", agent: "made_up_agent" }),
    ];
    const { queryAllByLabelText, getAllByRole } = render(<Harness issues={issues} />);
    // With multiple agent sections, collapsed by default — no SuggestionCard dismiss buttons
    // are rendered because no card body is mounted.
    expect(queryAllByLabelText("Dismiss issue").length).toBe(0);
    // Two agent header buttons should still render (one per agent section).
    const agentHeaders = getAllByRole("button", { expanded: false });
    expect(agentHeaders.length).toBeGreaterThanOrEqual(2);
  });

  it("expands an agent section when its header is clicked", () => {
    const issues = [
      makeIssue({ id: "a", agent: "style_agent" }),
      makeIssue({ id: "b", agent: "made_up_agent" }),
    ];
    const { getByText, queryAllByLabelText } = render(<Harness issues={issues} />);
    expect(queryAllByLabelText("Dismiss issue").length).toBe(0);
    fireEvent.click(getByText("Style Agent"));
    expect(queryAllByLabelText("Dismiss issue").length).toBe(1);
  });
});
