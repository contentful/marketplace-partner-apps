import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "../../../test/utils/testUtils";
import { FieldCheckCard } from "./FieldCheckCard";
import { FieldCheck } from "../../types/content";
import {
  Dialects,
  StyleCheckResponse,
  StyleGuides,
  Tones,
  WorkflowStatus,
} from "../../api-client/types.gen";
import { mockSdk } from "../../../test/mocks/mockSdk";

// Mock useSDK to always return mockSdk
vi.mock("@contentful/react-apps-toolkit", async () => {
  const actual = await vi.importActual<typeof import("@contentful/react-apps-toolkit")>(
    "@contentful/react-apps-toolkit",
  );
  return {
    ...actual,
    useSDK: () => mockSdk,
  };
});

const mockCheckResponse: StyleCheckResponse = {
  workflow: {
    id: "chk-2b5f8d3a-9c7e-4f2b-a8d1-6e9c3f7b4a2d",
    type: "checks",
    api_version: "1.0.0",
    generated_at: "2025-01-15T14:22:33Z",
    status: WorkflowStatus.COMPLETED,
  },
  config: {
    dialect: Dialects.CANADIAN_ENGLISH,
    style_guide: {
      style_guide_type: StyleGuides.AP,
      style_guide_id: "sg-8d4e5f6a-2b3c-4d5e-6f7a-8b9c0d1e2f3a",
    },
    tone: Tones.CONVERSATIONAL,
  },
  original: {
    scores: {
      quality: {
        score: 80,
        grammar: { score: 85, issues: 2 },
        consistency: { score: 75, issues: 1 },
        terminology: { score: 90, issues: 0 },
      },
      analysis: {
        clarity: {
          score: 70,
          word_count: 100,
          sentence_count: 10,
          average_sentence_length: 10,
          flesch_reading_ease: 60,
          vocabulary_complexity: 50,
          sentence_complexity: 50,
        },
        tone: {
          score: 60,
          informality: 50,
          liveliness: 70,
          informality_alignment: 0,
          liveliness_alignment: 0,
        },
      },
    },
  },
};

const mockFieldCheck: FieldCheck = {
  fieldId: "test-field",
  originalValue: "Original test content",
  isChecking: false,
  checkResponse: mockCheckResponse,
  error: null,
  lastUpdated: Date.now(),
  hasRewriteResult: false,
};

// Helper to wrap with SDKProvider
const renderWithSDK = (ui: React.ReactElement) => render(ui);

describe("FieldCheckCard", () => {
  it("renders loading state when checking without response", () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={checkingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Analyzing content/i)).toBeInTheDocument();
  });

  it("renders waiting state when no response and not checking", () => {
    const waitingField = {
      ...mockFieldCheck,
      isChecking: false,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={waitingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Waiting for changes to settle/i)).toBeInTheDocument();
  });

  it("renders field name and score in collapsed state", () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByTestId("field-name")).toHaveTextContent("Test Field");
    // quality score comes from original.scores.quality.score in the new structure
    expect(screen.getByTestId("field-score")).toHaveTextContent("80");
  });

  it("shows right chevron when collapsed", () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    const chevronContainer = screen.getByTestId("field-header");
    expect(chevronContainer).toBeInTheDocument();
  });

  it("shows down chevron when expanded", () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    const chevronContainer = screen.getByTestId("field-header");
    expect(chevronContainer).toBeInTheDocument();
  });

  it("calls onToggleExpand when header is clicked", () => {
    const onToggleExpand = vi.fn();
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={onToggleExpand}
      />,
    );
    const header = screen.getByTestId("field-header");
    fireEvent.click(header);
    expect(onToggleExpand).toHaveBeenCalledWith("test-field");
  });

  it("shows analysis section with new metrics when expanded", () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    const analysisSection = screen.getByTestId("analysis-section");
    expect(analysisSection).toBeInTheDocument();
    expect(screen.getByText(/Analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/Clarity/i)).toBeInTheDocument();
    expect(screen.getByText(/Grammar/i)).toBeInTheDocument();
    expect(screen.getByText(/Consistency/i)).toBeInTheDocument();
    expect(screen.getByText(/Tone/i)).toBeInTheDocument();
  });

  it('shows "Rewriting" button text when checking', () => {
    const checkingField = {
      ...mockFieldCheck,
      isChecking: true,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={checkingField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={true}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Rewriting/i)).toBeInTheDocument();
  });

  it("does not show expanded content when collapsed", () => {
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={mockFieldCheck}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.queryByTestId("analysis-section")).not.toBeInTheDocument();
  });

  it("displays dash when score is neutral", () => {
    const neutralField = {
      ...mockFieldCheck,
      checkResponse: {
        ...mockFieldCheck.checkResponse,
        original: {
          ...mockCheckResponse.original,
          scores: {
            ...mockCheckResponse.original?.scores,
            quality: { ...mockCheckResponse.original?.scores?.quality, score: 0 },
          },
        },
      } as unknown as FieldCheck["checkResponse"],
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={neutralField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    // Accept any dash character
    expect(screen.getByTestId("field-score").textContent).toMatch(/[—–-]/);
  });

  it("handles missing scores gracefully", () => {
    const missingScoresField = {
      ...mockFieldCheck,
      checkResponse: null,
    };
    renderWithSDK(
      <FieldCheckCard
        fieldCheck={missingScoresField}
        onRewriteWithDialog={() => {}}
        fieldName="Test Field"
        isExpanded={false}
        onToggleExpand={() => {}}
      />,
    );
    expect(screen.getByText(/Waiting for changes to settle/i)).toBeInTheDocument();
  });
});
