import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SuggestionCard } from "./SuggestionCard";
import {
  IssueCategory,
  GrammarCategory,
  type Suggestion,
  type Severity,
} from "../../../../../api-client/types.gen";

const createMockSuggestion = (overrides: Partial<Suggestion> = {}): Suggestion => ({
  original: "test text",
  suggestion: "better text",
  explanation: "This is a test explanation for the suggestion.",
  category: IssueCategory.GRAMMAR,
  subcategory: GrammarCategory.SPELLING,
  severity: "high" as Severity,
  position: { start_index: 0 },
  ...overrides,
});

describe("SuggestionCard", () => {
  const defaultProps = {
    suggestion: createMockSuggestion(),
    isExpanded: false,
    onToggle: vi.fn(),
    onApply: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("collapsed state", () => {
    it("renders category and subcategory", () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByText("Grammar")).toBeInTheDocument();
      expect(screen.getByText("Spelling")).toBeInTheDocument();
    });

    it("renders severity badge", () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("renders issue text", () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByText("Issue:")).toBeInTheDocument();
      expect(screen.getByText("test text")).toBeInTheDocument();
    });

    it("does not render suggestion and explanation when collapsed", () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.queryByText("Suggestion:")).not.toBeInTheDocument();
      expect(screen.queryByText("Explanation:")).not.toBeInTheDocument();
    });

    it("renders dismiss button", () => {
      render(<SuggestionCard {...defaultProps} />);

      expect(screen.getByRole("button", { name: "Dismiss suggestion" })).toBeInTheDocument();
    });

    it("calls onToggle when card is clicked", () => {
      const onToggle = vi.fn();
      render(<SuggestionCard {...defaultProps} onToggle={onToggle} />);

      // Click the card container
      fireEvent.click(screen.getByText("test text"));

      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onDismiss when dismiss button is clicked", () => {
      const onDismiss = vi.fn();
      render(<SuggestionCard {...defaultProps} onDismiss={onDismiss} />);

      fireEvent.click(screen.getByRole("button", { name: "Dismiss suggestion" }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it("stops propagation when dismiss button is clicked", () => {
      const onDismiss = vi.fn();
      const onToggle = vi.fn();
      render(<SuggestionCard {...defaultProps} onDismiss={onDismiss} onToggle={onToggle} />);

      fireEvent.click(screen.getByRole("button", { name: "Dismiss suggestion" }));

      expect(onDismiss).toHaveBeenCalledTimes(1);
      expect(onToggle).not.toHaveBeenCalled();
    });
  });

  describe("expanded state", () => {
    it("renders suggestion text when expanded", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByText("Suggestion:")).toBeInTheDocument();
      expect(screen.getByText("better text")).toBeInTheDocument();
    });

    it("renders explanation when expanded", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByText("Explanation:")).toBeInTheDocument();
      expect(
        screen.getByText("This is a test explanation for the suggestion."),
      ).toBeInTheDocument();
    });

    it("renders Apply button when expanded", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByRole("button", { name: "Apply" })).toBeInTheDocument();
    });

    it("renders feedback buttons when expanded", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      expect(screen.getByRole("button", { name: "Helpful" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Not helpful" })).toBeInTheDocument();
    });

    it("calls onApply when Apply button is clicked", () => {
      const onApply = vi.fn();
      render(<SuggestionCard {...defaultProps} isExpanded={true} onApply={onApply} />);

      fireEvent.click(screen.getByRole("button", { name: "Apply" }));

      expect(onApply).toHaveBeenCalledTimes(1);
    });

    it("stops propagation when Apply button is clicked", () => {
      const onApply = vi.fn();
      const onToggle = vi.fn();
      render(
        <SuggestionCard
          {...defaultProps}
          isExpanded={true}
          onApply={onApply}
          onToggle={onToggle}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Apply" }));

      expect(onApply).toHaveBeenCalledTimes(1);
      expect(onToggle).not.toHaveBeenCalled();
    });

    it("shows feedback panel when thumbs up is clicked", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

      // Feedback panel should appear with textarea and submit button
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("shows feedback panel when thumbs down is clicked", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));

      // Feedback panel should appear with textarea and submit button
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
    });

    it("collapses feedback panel when clicking same thumb again", () => {
      render(<SuggestionCard {...defaultProps} isExpanded={true} />);

      // Click thumbs up to open panel
      fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
      expect(screen.getByRole("textbox")).toBeInTheDocument();

      // Click thumbs up again to close panel
      fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("calls onSubmitFeedback when submit button is clicked", async () => {
      const onSubmitFeedback = vi.fn().mockResolvedValue(undefined);
      render(
        <SuggestionCard {...defaultProps} isExpanded={true} onSubmitFeedback={onSubmitFeedback} />,
      );

      // Click thumbs up to open panel
      fireEvent.click(screen.getByRole("button", { name: "Helpful" }));

      // Enter feedback text
      const textarea = screen.getByRole("textbox");
      fireEvent.change(textarea, { target: { value: "Great suggestion!" } });

      // Click submit
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));

      await waitFor(() => {
        expect(onSubmitFeedback).toHaveBeenCalledWith({
          helpful: true,
          feedbackText: "Great suggestion!",
          original: "test text",
          suggestion: "better text",
          category: "grammar",
        });
      });
    });
  });

  describe("severity levels", () => {
    it("renders high severity", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({ severity: "high" as Severity })}
        />,
      );

      expect(screen.getByText("high")).toBeInTheDocument();
    });

    it("renders medium severity", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({ severity: "medium" as Severity })}
        />,
      );

      expect(screen.getByText("medium")).toBeInTheDocument();
    });

    it("renders low severity", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({ severity: "low" as Severity })}
        />,
      );

      expect(screen.getByText("low")).toBeInTheDocument();
    });
  });

  describe("category formatting", () => {
    it("capitalizes category names", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({ category: IssueCategory.CONSISTENCY })}
        />,
      );

      expect(screen.getByText("Consistency")).toBeInTheDocument();
    });

    it("formats tone category", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({ category: IssueCategory.TONE })}
        />,
      );

      expect(screen.getByText("Tone")).toBeInTheDocument();
    });
  });

  describe("empty or null values", () => {
    it("shows (delete) when suggestion is empty", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          isExpanded={true}
          suggestion={createMockSuggestion({ suggestion: "" })}
        />,
      );

      expect(screen.getByText("(delete)")).toBeInTheDocument();
    });

    it("handles null explanation gracefully", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          isExpanded={true}
          suggestion={createMockSuggestion({ explanation: undefined })}
        />,
      );

      // Should still render without crashing
      expect(screen.getByText("Explanation:")).toBeInTheDocument();
    });
  });

  describe("HTML stripping", () => {
    it("strips HTML tags from original text", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          suggestion={createMockSuggestion({
            original: "<p>This is <strong>bold</strong> text</p>",
          })}
        />,
      );

      expect(screen.getByText("This is bold text")).toBeInTheDocument();
    });

    it("strips HTML tags from suggestion text", () => {
      render(
        <SuggestionCard
          {...defaultProps}
          isExpanded={true}
          suggestion={createMockSuggestion({
            suggestion: "<span>Improved text</span>",
          })}
        />,
      );

      expect(screen.getByText("Improved text")).toBeInTheDocument();
    });
  });

  describe("exiting animation", () => {
    it("applies exiting state when isExiting is true", () => {
      const { container } = render(<SuggestionCard {...defaultProps} isExiting={true} />);

      // The container should have the animation class applied
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });
  });

  describe("ref forwarding", () => {
    it("forwards ref to the card container", () => {
      const ref = { current: null as HTMLDivElement | null };
      render(<SuggestionCard {...defaultProps} ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });
});
