import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../../../test/utils/testUtils";
import { AgentFilterPopover } from "./AgentFilterPopover";
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
    explanation: "x",
    suggestion: "fixed",
    suggestions: undefined,
    position: { start: 0, end: 5, sentence: "Spain" },
    original: "Spain",
    ...overrides,
  };
}

describe("AgentFilterPopover", () => {
  it("disables the trigger when there are no active issues", () => {
    const { getByRole } = render(
      <AgentFilterPopover allActiveIssues={[]} selectedAgentFilterIds={null} onChange={vi.fn()} />,
    );
    const trigger = getByRole("button", { name: /all agents/i });
    expect(trigger).toBeDisabled();
  });

  it("renders 'All agents' when selectedAgentFilterIds is null", () => {
    const { getByRole } = render(
      <AgentFilterPopover
        allActiveIssues={[makeIssue()]}
        selectedAgentFilterIds={null}
        onChange={vi.fn()}
      />,
    );
    expect(getByRole("button", { name: /filter by agent/i })).toHaveTextContent("All agents");
  });

  it("shows 'N selected' when a strict subset is selected", () => {
    const issues = [
      makeIssue({ id: "a", agent: "style_agent" }),
      makeIssue({ id: "b", agent: "tone_agent" }),
    ];
    const { getByRole } = render(
      <AgentFilterPopover
        allActiveIssues={issues}
        selectedAgentFilterIds={new Set(["style_agent"])}
        onChange={vi.fn()}
      />,
    );
    expect(getByRole("button", { name: /filter by agent/i })).toHaveTextContent("1 selected");
  });

  it("opens the popover and lists agents derived from active issues when clicked", () => {
    const issues = [
      makeIssue({ id: "a", agent: "style_agent" }),
      makeIssue({ id: "b", agent: "style_agent" }),
      makeIssue({ id: "c", agent: "custom_unknown_agent" }),
    ];
    const { getByRole, getByText } = render(
      <AgentFilterPopover
        allActiveIssues={issues}
        selectedAgentFilterIds={null}
        onChange={vi.fn()}
      />,
    );
    fireEvent.click(getByRole("button", { name: /filter by agent/i }));
    expect(getByText("All Agents")).toBeInTheDocument();
    // style_agent → known catalog → "Brand" category
    expect(getByText("Brand")).toBeInTheDocument();
    expect(getByText("Style Agent")).toBeInTheDocument();
    // custom unknown → "Other" bucket
    expect(getByText("Other")).toBeInTheDocument();
  });

  it("calls onChange(empty Set) when toggling 'All Agents' off from null", () => {
    const onChange = vi.fn();
    const { getByRole, getByLabelText } = render(
      <AgentFilterPopover
        allActiveIssues={[makeIssue()]}
        selectedAgentFilterIds={null}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByRole("button", { name: /filter by agent/i }));
    fireEvent.click(getByLabelText("All Agents"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toBeInstanceOf(Set);
    expect((onChange.mock.calls[0][0] as Set<string>).size).toBe(0);
  });

  it("calls onChange(null) when toggling 'All Agents' on from an empty set", () => {
    const onChange = vi.fn();
    const { getByRole, getByLabelText } = render(
      <AgentFilterPopover
        allActiveIssues={[makeIssue()]}
        selectedAgentFilterIds={new Set()}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByRole("button", { name: /filter by agent/i }));
    fireEvent.click(getByLabelText("All Agents"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("toggles a single agent on and off", () => {
    const onChange = vi.fn();
    const issues = [
      makeIssue({ id: "a", agent: "style_agent" }),
      makeIssue({ id: "b", agent: "tone_agent" }),
    ];
    const { getByRole, getByText } = render(
      <AgentFilterPopover
        allActiveIssues={issues}
        selectedAgentFilterIds={null}
        onChange={onChange}
      />,
    );
    fireEvent.click(getByRole("button", { name: /filter by agent/i }));
    fireEvent.click(getByText("Style Agent"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0] as Set<string>;
    expect(next.has("style_agent")).toBe(false);
    expect(next.has("tone_agent")).toBe(true);
  });
});
