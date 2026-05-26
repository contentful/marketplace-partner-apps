import { describe, expect, it, vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { mockUseAuth, render } from "../../../../../../test/utils/testUtils";
import { SuggestionsSidebar, type SuggestionsSidebarProps } from "./SuggestionsSidebar";
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

function defaultProps(overrides: Partial<SuggestionsSidebarProps> = {}): SuggestionsSidebarProps {
  const issues: CortexIssueWithId[] = [];
  const issueToOriginalIndex = new Map<CortexIssueWithId, number>();
  return {
    issues,
    filteredIssues: issues,
    issueToOriginalIndex,
    exitingIndices: new Set(),
    isLoading: false,
    hasRunScan: false,
    hasEnabledAgent: true,
    checkError: null,
    onDismissCheckError: vi.fn(),
    onCheck: vi.fn(),
    onOpenAgentSettings: vi.fn(),
    onApplyIssue: vi.fn(),
    onApplyAllMatching: vi.fn(),
    onDismissIssue: vi.fn(),
    onSelectIssue: vi.fn(),
    selectedIssueIndex: null,
    selectedSeverities: new Set(),
    onSeverityChange: vi.fn(),
    selectedAgentFilterIds: null,
    onAgentFilterChange: vi.fn(),
    viewMode: "list",
    onViewModeChange: vi.fn(),
    styleAgentApplyAllPeerCountByIssueId: new Map(),
    onSignOut: vi.fn(),
    totalIssueCount: 0,
    appliedCount: 0,
    dismissedCount: 0,
    ...overrides,
  };
}

describe("SuggestionsSidebar", () => {
  it("shows READY headline + Click Check subtext before any scan", () => {
    const { getByRole, getByText } = render(<SuggestionsSidebar {...defaultProps()} />);
    expect(getByRole("heading", { level: 3 })).toHaveTextContent("READY");
    expect(getByText(/click check to analyze/i)).toBeInTheDocument();
  });

  it("hint copy switches when no agent is enabled", () => {
    const { getByText } = render(
      <SuggestionsSidebar {...defaultProps({ hasEnabledAgent: false })} />,
    );
    expect(getByText(/enable an agent in settings to check/i)).toBeInTheDocument();
  });

  it("shows ANALYZING when isLoading", () => {
    const { getByRole } = render(<SuggestionsSidebar {...defaultProps({ isLoading: true })} />);
    expect(getByRole("heading", { level: 3 })).toHaveTextContent(/ANALYZING/);
  });

  it("shows CHECK FAILED when checkError is set", () => {
    const { getByRole } = render(
      <SuggestionsSidebar {...defaultProps({ checkError: "boom", hasRunScan: true })} />,
    );
    expect(getByRole("heading", { level: 3 })).toHaveTextContent(/CHECK FAILED/);
  });

  it("calls onCheck when the Check button is clicked", () => {
    const onCheck = vi.fn();
    const { getByRole } = render(<SuggestionsSidebar {...defaultProps({ onCheck })} />);
    fireEvent.click(getByRole("button", { name: /^check$/i }));
    expect(onCheck).toHaveBeenCalledTimes(1);
  });

  it("disables the Check button when no agent is enabled", () => {
    const onCheck = vi.fn();
    const { getByRole } = render(
      <SuggestionsSidebar {...defaultProps({ onCheck, hasEnabledAgent: false })} />,
    );
    fireEvent.click(getByRole("button", { name: /^check$/i }));
    expect(onCheck).not.toHaveBeenCalled();
  });

  it("calls onOpenAgentSettings when the gear is clicked", () => {
    const onOpenAgentSettings = vi.fn();
    const { getByRole } = render(<SuggestionsSidebar {...defaultProps({ onOpenAgentSettings })} />);
    fireEvent.click(getByRole("button", { name: /agent settings/i }));
    expect(onOpenAgentSettings).toHaveBeenCalledTimes(1);
  });

  it("forwards onOpenAbout to the footer user-profile menu", () => {
    // The footer UserProfileButton only shows the About item when the user is
    // signed in; override the auth hook for this test (and reset after) so the
    // authenticated dropdown renders.
    const previous = mockUseAuth.getMockImplementation();
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@markup.ai" },
      token: "tok",
      error: null,
      loginWithPopup: vi.fn().mockResolvedValue(null),
      getAccessToken: vi.fn().mockResolvedValue("tok"),
      logout: vi.fn().mockResolvedValue(undefined),
    });

    try {
      const onOpenAbout = vi.fn();
      const { getByRole, getByText } = render(
        <SuggestionsSidebar {...defaultProps({ onOpenAbout })} />,
      );
      fireEvent.click(getByRole("button", { name: /user profile/i }));
      fireEvent.click(getByText("About"));
      expect(onOpenAbout).toHaveBeenCalledTimes(1);
    } finally {
      if (previous) mockUseAuth.mockImplementation(previous);
    }
  });

  it("renders HIGH RISK when there's at least one high-severity issue", () => {
    const high = makeIssue({ id: "h", severity: "high" });
    const issues = [high];
    const map = new Map<CortexIssueWithId, number>([[high, 0]]);
    const { getByRole } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
        })}
      />,
    );
    expect(getByRole("heading", { level: 3 })).toHaveTextContent("HIGH RISK");
  });

  it("renders ALL CLEAR when scan completed with zero issues and no audit trail", () => {
    const { getByRole, getByText } = render(
      <SuggestionsSidebar {...defaultProps({ hasRunScan: true, totalIssueCount: 0 })} />,
    );
    expect(getByRole("heading", { level: 3 })).toHaveTextContent("ALL CLEAR");
    expect(getByText(/no issues detected/i)).toBeInTheDocument();
  });

  it("toggles severity pills via onSeverityChange", () => {
    const issues = [makeIssue({ id: "h", severity: "high" })];
    const map = new Map<CortexIssueWithId, number>([[issues[0], 0]]);
    const onSeverityChange = vi.fn();
    const { getByTitle } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
          onSeverityChange,
        })}
      />,
    );
    // Severity pills carry a `title` attribute like "High severity" alongside their visible text.
    fireEvent.click(getByTitle("High severity"));
    const next = onSeverityChange.mock.calls[0][0] as Set<string>;
    expect(next.has("high")).toBe(true);
  });

  it("toggles between Group and List via onViewModeChange", () => {
    const issues = [makeIssue({ id: "h", severity: "high" })];
    const map = new Map<CortexIssueWithId, number>([[issues[0], 0]]);
    const onViewModeChange = vi.fn();
    const { getByRole } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
          onViewModeChange,
        })}
      />,
    );
    fireEvent.click(getByRole("button", { name: /^group$/i }));
    expect(onViewModeChange).toHaveBeenCalledWith("grouped");
  });

  it("renders the error block with Try again + Dismiss when checkError is set", () => {
    const onCheck = vi.fn();
    const onDismissCheckError = vi.fn();
    const { getByRole } = render(
      <SuggestionsSidebar
        {...defaultProps({
          checkError: "Network error",
          hasRunScan: true,
          onCheck,
          onDismissCheckError,
        })}
      />,
    );
    fireEvent.click(getByRole("button", { name: /try again/i }));
    expect(onCheck).toHaveBeenCalledTimes(1);
    fireEvent.click(getByRole("button", { name: /dismiss/i }));
    expect(onDismissCheckError).toHaveBeenCalledTimes(1);
  });

  it("renders the 'Everything looks great!' empty state when scan finds zero issues", () => {
    const { getByText } = render(
      <SuggestionsSidebar
        {...defaultProps({ hasRunScan: true, issues: [], filteredIssues: [], totalIssueCount: 0 })}
      />,
    );
    expect(getByText(/everything looks great/i)).toBeInTheDocument();
    expect(getByText(/zero issues found/i)).toBeInTheDocument();
  });

  it("renders 'No suggestions match your filters' when filtering hides every issue", () => {
    const issues = [makeIssue({ id: "a", severity: "high" })];
    const map = new Map<CortexIssueWithId, number>([[issues[0], 0]]);
    const { getByText } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: [],
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
          selectedSeverities: new Set(["medium"]),
        })}
      />,
    );
    expect(getByText(/no suggestions match your filters/i)).toBeInTheDocument();
  });

  it("hides the progress bar and filter row when checkError is set", () => {
    const issues = [makeIssue({ id: "a", severity: "high" })];
    const map = new Map<CortexIssueWithId, number>([[issues[0], 0]]);
    const { queryByLabelText, queryByTitle } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
          checkError: "Network error",
        })}
      />,
    );
    expect(queryByLabelText("View audit trail")).toBeNull();
    expect(queryByTitle("High severity")).toBeNull();
  });

  it("clamps a negative dismissedCount so the dismissed stat does not render", () => {
    const issues = [makeIssue({ id: "a", severity: "high" })];
    const map = new Map<CortexIssueWithId, number>([[issues[0], 0]]);
    const { queryByTitle } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 1,
          hasRunScan: true,
          appliedCount: 1,
          dismissedCount: -1,
        })}
      />,
    );
    expect(queryByTitle("Dismissed")).toBeNull();
  });

  it("excludes exiting items from the remaining count and severity pills", () => {
    const a = makeIssue({ id: "a", severity: "high" });
    const b = makeIssue({ id: "b", severity: "medium" });
    const issues = [a, b];
    const map = new Map<CortexIssueWithId, number>([
      [a, 0],
      [b, 1],
    ]);
    const { getByText, getByTitle } = render(
      <SuggestionsSidebar
        {...defaultProps({
          issues,
          filteredIssues: issues,
          issueToOriginalIndex: map,
          totalIssueCount: 2,
          appliedCount: 1,
          dismissedCount: 0,
          hasRunScan: true,
          exitingIndices: new Set([0]),
        })}
      />,
    );
    // 1 issue still active, 1 exiting → "1 issue remaining"
    expect(getByText(/^1 issue remaining$/)).toBeInTheDocument();
    // Severity pills reflect the non-exiting set: High 0, Medium 1
    expect(getByTitle("High severity")).toHaveTextContent(/0/);
    expect(getByTitle("Medium severity")).toHaveTextContent(/1/);
  });
});
