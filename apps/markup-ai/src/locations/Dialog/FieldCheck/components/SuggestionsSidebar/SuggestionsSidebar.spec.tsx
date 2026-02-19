import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestionsSidebar, SuggestionsSidebarProps } from "./SuggestionsSidebar";
import {
  Severity,
  Dialects,
  Tones,
  IssueCategory,
  GrammarCategory,
} from "../../../../../api-client/types.gen";
import type {
  Suggestion,
  ConstantsResponse,
  StyleGuideResponse,
} from "../../../../../api-client/types.gen";

// Mock the UserProfileButton component
vi.mock("../../../../ConfigScreen/components/UserProfileButton", () => ({
  UserProfileButton: ({ onSignOut }: { onSignOut: () => void }) => (
    <button data-testid="user-profile-button" onClick={onSignOut}>
      Sign Out
    </button>
  ),
}));

// Helper to create mock suggestion
function createMockSuggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    original: "Sample issue text",
    suggestion: "Sample replacement",
    explanation: "Sample explanation",
    position: {
      start_index: 0,
    },
    severity: Severity.MEDIUM,
    category: IssueCategory.GRAMMAR,
    subcategory: GrammarCategory.SPELLING,
    ...overrides,
  } as Suggestion;
}

describe("SuggestionsSidebar", () => {
  const mockOnCheck = vi.fn();
  const mockOnApplySuggestion = vi.fn();
  const mockOnDismissSuggestion = vi.fn();
  const mockOnSelectSuggestion = vi.fn();
  const mockOnCategoryChange = vi.fn();
  const mockOnSeverityChange = vi.fn();
  const mockOnConfigChange = vi.fn();
  const mockOnSignOut = vi.fn();

  const defaultProps: SuggestionsSidebarProps = {
    suggestions: [],
    filteredSuggestions: [],
    suggestionToOriginalIndex: new Map(),
    exitingIndices: new Set(),
    isLoading: false,
    onCheck: mockOnCheck,
    onApplySuggestion: mockOnApplySuggestion,
    onDismissSuggestion: mockOnDismissSuggestion,
    onSelectSuggestion: mockOnSelectSuggestion,
    selectedSuggestionIndex: null,
    selectedCategories: new Set(["grammar", "consistency", "terminology", "clarity", "tone"]),
    selectedSeverities: new Set([Severity.HIGH, Severity.MEDIUM, Severity.LOW]),
    onCategoryChange: mockOnCategoryChange,
    onSeverityChange: mockOnSeverityChange,
    config: {
      dialect: Dialects.AMERICAN_ENGLISH,
      tone: Tones.PROFESSIONAL,
    },
    onConfigChange: mockOnConfigChange,
    constants: {
      dialects: [Dialects.AMERICAN_ENGLISH, Dialects.BRITISH_ENGLISH],
      tones: [Tones.PROFESSIONAL, Tones.CONVERSATIONAL],
    } as ConstantsResponse,
    styleGuides: [],
    onSignOut: mockOnSignOut,
    totalIssueCount: 0,
    appliedCount: 0,
    dismissedCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Header and Branding", () => {
    it("renders the Markup AI logo and title", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      expect(screen.getByAltText("Markup AI")).toBeInTheDocument();
      expect(screen.getByText("Markup AI")).toBeInTheDocument();
    });
  });

  describe("Risk Level Display", () => {
    it("displays 'ALL CLEAR' when no suggestions", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      expect(screen.getByText("ALL CLEAR")).toBeInTheDocument();
      expect(screen.getByText("No issues detected")).toBeInTheDocument();
    });

    it("displays 'HIGH RISK' when high severity suggestions exist", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.HIGH })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      expect(screen.getByText("HIGH RISK")).toBeInTheDocument();
      expect(screen.getByText("1 issue detected")).toBeInTheDocument();
    });

    it("displays 'MEDIUM RISK' when medium severity suggestions exist (no high)", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.MEDIUM })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      expect(screen.getByText("MEDIUM RISK")).toBeInTheDocument();
    });

    it("displays 'LOW RISK' when only low severity suggestions exist", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.LOW })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      expect(screen.getByText("LOW RISK")).toBeInTheDocument();
    });

    it("displays 'ANALYZING...' when loading", () => {
      render(<SuggestionsSidebar {...defaultProps} isLoading={true} />);

      expect(screen.getByText("ANALYZING...")).toBeInTheDocument();
    });

    it("displays plural 'issues' for multiple suggestions", () => {
      const suggestions = [
        createMockSuggestion({ severity: Severity.HIGH }),
        createMockSuggestion({
          severity: Severity.MEDIUM,
          position: { start_index: 20 },
        }),
      ];
      const suggestionMap = new Map<Suggestion, number>();
      suggestions.forEach((s, i) => suggestionMap.set(s, i));

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      expect(screen.getByText("2 issues detected")).toBeInTheDocument();
    });
  });

  describe("Loading State", () => {
    it("shows spinner and message when loading", () => {
      render(<SuggestionsSidebar {...defaultProps} isLoading={true} />);

      expect(screen.getByText("Analyzing content...")).toBeInTheDocument();
    });

    it("disables check button when loading", () => {
      render(<SuggestionsSidebar {...defaultProps} isLoading={true} />);

      const checkButton = screen.getByRole("button", { name: /check/i });
      expect(checkButton).toBeDisabled();
    });
  });

  describe("Empty State", () => {
    it("shows 'Everything looks great!' when no suggestions", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      expect(screen.getByText("Everything looks great!")).toBeInTheDocument();
      expect(screen.getByText("Your content is polished and ready.")).toBeInTheDocument();
      expect(screen.getByText("Zero issues found.")).toBeInTheDocument();
    });

    it("shows filter empty state when suggestions exist but none match filters", () => {
      const suggestions = [createMockSuggestion()];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={[]} // All filtered out
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      expect(screen.getByText("No suggestions match your filters.")).toBeInTheDocument();
    });
  });

  describe("Check Button", () => {
    it("calls onCheck when clicked", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const checkButton = screen.getByRole("button", { name: /check/i });
      fireEvent.click(checkButton);

      expect(mockOnCheck).toHaveBeenCalledTimes(1);
    });
  });

  describe("Severity Filter Pills", () => {
    it("renders all severity pills", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      expect(screen.getByTitle("High severity")).toBeInTheDocument();
      expect(screen.getByTitle("Medium severity")).toBeInTheDocument();
      expect(screen.getByTitle("Low severity")).toBeInTheDocument();
    });

    it("shows severity counts", () => {
      const suggestions = [
        createMockSuggestion({ severity: Severity.HIGH }),
        createMockSuggestion({
          severity: Severity.HIGH,
          position: { start_index: 10 },
        }),
        createMockSuggestion({
          severity: Severity.MEDIUM,
          position: { start_index: 30 },
        }),
      ];
      const suggestionMap = new Map<Suggestion, number>();
      suggestions.forEach((s, i) => suggestionMap.set(s, i));

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      // High: 2, Medium: 1, Low: 0
      expect(screen.getByText(/High.*2/)).toBeInTheDocument();
      expect(screen.getByText(/Medium.*1/)).toBeInTheDocument();
      expect(screen.getByText(/Low.*0/)).toBeInTheDocument();
    });

    it("calls onSeverityChange when severity pill is clicked", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const highPill = screen.getByTitle("High severity");
      fireEvent.click(highPill);

      expect(mockOnSeverityChange).toHaveBeenCalled();
    });

    it("does not call onSeverityChange when disabled (loading)", () => {
      render(<SuggestionsSidebar {...defaultProps} isLoading={true} />);

      const highPill = screen.getByTitle("High severity");
      fireEvent.click(highPill);

      expect(mockOnSeverityChange).not.toHaveBeenCalled();
    });
  });

  describe("Category Filter", () => {
    it("opens category filter popover on button click", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const filterButton = screen.getByRole("button", { name: /filter by category/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText("Suggestion Type")).toBeInTheDocument();
      });
    });

    it("shows all category options in filter", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const filterButton = screen.getByRole("button", { name: /filter by category/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText("Grammar")).toBeInTheDocument();
        expect(screen.getByText("Consistency")).toBeInTheDocument();
        expect(screen.getByText("Terminology")).toBeInTheDocument();
        expect(screen.getByText("Clarity")).toBeInTheDocument();
        expect(screen.getByText("Tone")).toBeInTheDocument();
      });
    });

    it("calls onCategoryChange when checkbox is toggled", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const filterButton = screen.getByRole("button", { name: /filter by category/i });
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getByText("Grammar")).toBeInTheDocument();
      });

      const grammarCheckbox = screen.getByLabelText("Grammar");
      fireEvent.click(grammarCheckbox);

      expect(mockOnCategoryChange).toHaveBeenCalled();
    });
  });

  describe("Suggestion Cards", () => {
    it("renders suggestion cards for filtered suggestions", () => {
      const suggestions = [
        createMockSuggestion({ original: "First issue text" }),
        createMockSuggestion({
          original: "Second issue text",
          position: { start_index: 20 },
        }),
      ];
      const suggestionMap = new Map<Suggestion, number>();
      suggestions.forEach((s, i) => suggestionMap.set(s, i));

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      // The component renders cards with Issue: labels - verify cards are rendered
      // Cards show category badges (e.g. "Grammar") and severity
      const grammarBadges = screen.getAllByText("Grammar");
      expect(grammarBadges.length).toBe(2); // Two cards, each with Grammar category

      // Also verify the "medium" severity badges are shown
      const mediumBadges = screen.getAllByText("medium");
      expect(mediumBadges.length).toBe(2);
    });

    it("sorts suggestions by start position", () => {
      const suggestion1 = createMockSuggestion({
        original: "Later issue",
        position: { start_index: 50 },
        category: IssueCategory.CONSISTENCY,
      });
      const suggestion2 = createMockSuggestion({
        original: "Earlier issue",
        position: { start_index: 10 },
        category: IssueCategory.TERMINOLOGY,
      });
      const suggestions = [suggestion1, suggestion2];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestion1, 0);
      suggestionMap.set(suggestion2, 1);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
        />,
      );

      // Get all category badges - they should be in position order
      // Earlier (position 10) should be first with "Terminology"
      // Later (position 50) should be second with "Consistency"
      const categoryBadges = screen.getAllByText(/^(Terminology|Consistency)$/);
      expect(categoryBadges[0]).toHaveTextContent("Terminology"); // Earlier
      expect(categoryBadges[1]).toHaveTextContent("Consistency"); // Later
    });
  });

  describe("Settings Popover", () => {
    it("opens settings popover on gear icon click", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText("Style Guide")).toBeInTheDocument();
        expect(screen.getByText("Dialect")).toBeInTheDocument();
        expect(screen.getByText("Tone")).toBeInTheDocument();
      });
    });

    it("shows save settings button in popover", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /save settings/i })).toBeInTheDocument();
      });
    });

    it("calls onConfigChange when dialect is changed", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText("Dialect")).toBeInTheDocument();
      });

      // The dialect select should be available
      const dialectSelect = screen.getAllByRole("combobox")[1]; // Second select is Dialect
      fireEvent.change(dialectSelect, { target: { value: Dialects.BRITISH_ENGLISH } });

      expect(mockOnConfigChange).toHaveBeenCalledWith({ dialect: Dialects.BRITISH_ENGLISH });
    });

    it("calls onConfigChange when tone is changed", async () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText("Tone")).toBeInTheDocument();
      });

      // Get the tone select - it's the third combobox in the settings popover
      const comboboxes = screen.getAllByRole("combobox");
      expect(comboboxes).toHaveLength(3); // Style Guide, Dialect, Tone
      fireEvent.change(comboboxes[2], { target: { value: Tones.CONVERSATIONAL } });

      // The component passes empty string as null, check it was called
      expect(mockOnConfigChange).toHaveBeenCalled();
    });
  });

  describe("Footer", () => {
    it("renders user profile button", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      expect(screen.getByTestId("user-profile-button")).toBeInTheDocument();
    });

    it("calls onSignOut when sign out is clicked", () => {
      render(<SuggestionsSidebar {...defaultProps} />);

      const signOutButton = screen.getByTestId("user-profile-button");
      fireEvent.click(signOutButton);

      expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("Issue Progress Bar", () => {
    it("does not render progress bar when totalIssueCount is 0", () => {
      render(<SuggestionsSidebar {...defaultProps} totalIssueCount={0} />);

      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    });

    it("does not render progress bar when loading", () => {
      render(<SuggestionsSidebar {...defaultProps} isLoading={true} totalIssueCount={5} />);

      expect(screen.queryByText(/remaining/)).not.toBeInTheDocument();
    });

    it("shows remaining issues count when issues exist", () => {
      const suggestions = [
        createMockSuggestion({ severity: Severity.HIGH }),
        createMockSuggestion({
          severity: Severity.MEDIUM,
          position: { start_index: 20 },
        }),
      ];
      const suggestionMap = new Map<Suggestion, number>();
      suggestions.forEach((s, i) => suggestionMap.set(s, i));

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={5}
          appliedCount={2}
          dismissedCount={1}
        />,
      );

      expect(screen.getByText("2 issues remaining")).toBeInTheDocument();
    });

    it("shows applied count with checkmark", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.HIGH })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={3}
          appliedCount={2}
          dismissedCount={0}
        />,
      );

      // Applied count should be displayed
      const appliedStat = screen.getByTitle("Applied");
      expect(appliedStat).toHaveTextContent("2");
    });

    it("shows dismissed count", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.MEDIUM })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={5}
          appliedCount={1}
          dismissedCount={3}
        />,
      );

      const dismissedStat = screen.getByTitle("Dismissed");
      expect(dismissedStat).toHaveTextContent("3");
    });

    it("shows 'No issues remaining' when all issues are resolved", () => {
      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={[]}
          filteredSuggestions={[]}
          totalIssueCount={5}
          appliedCount={3}
          dismissedCount={2}
        />,
      );

      expect(screen.getByText("No issues remaining")).toBeInTheDocument();
    });

    it("shows singular 'issue' for single remaining issue", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.LOW })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={3}
          appliedCount={1}
          dismissedCount={1}
        />,
      );

      expect(screen.getByText("1 issue remaining")).toBeInTheDocument();
    });

    it("does not show applied count when appliedCount is 0", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.HIGH })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={1}
          appliedCount={0}
          dismissedCount={0}
        />,
      );

      expect(screen.queryByTitle("Applied")).not.toBeInTheDocument();
    });

    it("does not show dismissed count when dismissedCount is 0", () => {
      const suggestions = [createMockSuggestion({ severity: Severity.HIGH })];
      const suggestionMap = new Map<Suggestion, number>();
      suggestionMap.set(suggestions[0], 0);

      render(
        <SuggestionsSidebar
          {...defaultProps}
          suggestions={suggestions}
          filteredSuggestions={suggestions}
          suggestionToOriginalIndex={suggestionMap}
          totalIssueCount={1}
          appliedCount={0}
          dismissedCount={0}
        />,
      );

      expect(screen.queryByTitle("Dismissed")).not.toBeInTheDocument();
    });
  });

  describe("Style Guides", () => {
    it("renders style guide options when available", async () => {
      const styleGuides: StyleGuideResponse[] = [
        { id: "sg1", name: "Marketing Guide" } as StyleGuideResponse,
        { id: "sg2", name: "Technical Guide" } as StyleGuideResponse,
      ];

      render(
        <SuggestionsSidebar
          {...defaultProps}
          styleGuides={styleGuides}
          config={{ ...defaultProps.config, styleGuide: "sg1" }}
        />,
      );

      const settingsButton = screen.getByRole("button", { name: /settings/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText("Style Guide")).toBeInTheDocument();
      });

      // Style guide select should have the guides as options
      const styleGuideSelect = screen.getAllByRole("combobox")[0];
      expect(styleGuideSelect).toBeInTheDocument();
    });
  });
});
