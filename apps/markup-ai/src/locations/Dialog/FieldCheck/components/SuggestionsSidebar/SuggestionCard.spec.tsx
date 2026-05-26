import { describe, it, expect, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { render } from "../../../../../../test/utils/testUtils";
import { SuggestionCard } from "./SuggestionCard";
import type { CortexIssueWithId } from "../../../../../agents/types";

function makeIssue(overrides: Partial<CortexIssueWithId> = {}): CortexIssueWithId {
  return {
    id: "issue-1",
    groupKey: "group-1",
    status: "active",
    agent: "style_agent",
    category: "scannability",
    confidence: 0.9,
    severity: "medium",
    explanation: "Why this matters: shorter words read better.",
    suggestion: "Spain",
    suggestions: undefined,
    position: { start: 0, end: 5, sentence: "Spain is a country." },
    original: "Spain",
    ...overrides,
  };
}

describe("SuggestionCard", () => {
  it("expands when clicking anywhere on a collapsed card", () => {
    const onExpand = vi.fn();
    const { container } = render(
      <SuggestionCard
        issue={makeIssue()}
        isExpanded={false}
        onExpand={onExpand}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);
    expect(onExpand).toHaveBeenCalledTimes(1);
  });

  it("is keyboard-focusable when collapsed and expands on Enter / Space", () => {
    const onExpand = vi.fn();
    const { container } = render(
      <SuggestionCard
        issue={makeIssue()}
        isExpanded={false}
        onExpand={onExpand}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute("tabindex")).toBe("0");
    expect(card.getAttribute("role")).toBe("button");
    fireEvent.keyDown(card, { key: "Enter" });
    expect(onExpand).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(card, { key: " " });
    expect(onExpand).toHaveBeenCalledTimes(2);
  });

  it("is not focusable nor interactive via aria when expanded", () => {
    const { container } = render(
      <SuggestionCard
        issue={makeIssue()}
        isExpanded
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.getAttribute("tabindex")).toBeNull();
    expect(card.getAttribute("role")).toBeNull();
    expect(card.getAttribute("aria-label")).toBeNull();
  });

  it("does not call onExpand when clicking an expanded card", () => {
    const onExpand = vi.fn();
    const { container } = render(
      <SuggestionCard
        issue={makeIssue()}
        isExpanded
        onExpand={onExpand}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    fireEvent.click(card);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("dismiss button does not bubble up to the card-expand handler", () => {
    const onExpand = vi.fn();
    const onDismiss = vi.fn();
    const { getByRole } = render(
      <SuggestionCard
        issue={makeIssue()}
        isExpanded={false}
        onExpand={onExpand}
        onApply={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(getByRole("button", { name: /dismiss issue/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onExpand).not.toHaveBeenCalled();
  });

  it("renders all suggestion rows when issue.suggestions has 3 items", () => {
    const issue = makeIssue({ suggestions: ["one", "two", "three"], suggestion: undefined });
    const { getByText, queryByText } = render(
      <SuggestionCard
        issue={issue}
        isExpanded
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(getByText("one")).toBeInTheDocument();
    expect(getByText("two")).toBeInTheDocument();
    expect(getByText("three")).toBeInTheDocument();
    expect(queryByText(/show more/i)).not.toBeInTheDocument();
  });

  it("shows 'Show more (+2)' when there are 5 suggestions", () => {
    const issue = makeIssue({
      suggestions: ["a", "b", "c", "d", "e"],
      suggestion: undefined,
    });
    const { getByText, queryByText } = render(
      <SuggestionCard
        issue={issue}
        isExpanded
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(getByText("a")).toBeInTheDocument();
    expect(getByText("c")).toBeInTheDocument();
    expect(queryByText("d")).not.toBeInTheDocument();
    expect(getByText(/show more \(\+2\)/i)).toBeInTheDocument();
  });

  it("calls onApply with the chosen suggestion text", () => {
    const onApply = vi.fn();
    const issue = makeIssue({ suggestions: ["alpha", "beta"], suggestion: undefined });
    const { getByText } = render(
      <SuggestionCard
        issue={issue}
        isExpanded
        onExpand={vi.fn()}
        onApply={onApply}
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.click(getByText("beta"));
    expect(onApply).toHaveBeenCalledWith("beta");
  });

  it("does not truncate short issue text", () => {
    const short = "Spain";
    const { getByText } = render(
      <SuggestionCard
        issue={makeIssue({ original: short })}
        isExpanded={false}
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(getByText(short)).toBeInTheDocument();
  });

  it("truncates long issue text in the middle (head … tail)", () => {
    const long =
      "Spain officially the Kingdom of Spain is an interesting country in Southern and Western Europe with territories in North Africa";
    const { container, queryByText } = render(
      <SuggestionCard
        issue={makeIssue({ original: long })}
        isExpanded={false}
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(queryByText(long)).not.toBeInTheDocument();
    const html = container.innerHTML;
    expect(html).toContain("…");
    expect(html).toContain("Spain");
    expect(html).toContain("North Africa");
  });

  it("renders apply-all-occurrences checkbox for style_agent clusters of 2+", () => {
    const issue = makeIssue({ suggestions: ["fixed"], suggestion: undefined });
    const onApplyAllMatching = vi.fn();
    const { getByText } = render(
      <SuggestionCard
        issue={issue}
        isExpanded
        onExpand={vi.fn()}
        onApply={vi.fn()}
        onDismiss={vi.fn()}
        styleAgentApplyAllPeerCount={3}
        onApplyAllMatching={onApplyAllMatching}
      />,
    );
    expect(getByText(/apply to all 3 occurrences/i)).toBeInTheDocument();
  });
});
