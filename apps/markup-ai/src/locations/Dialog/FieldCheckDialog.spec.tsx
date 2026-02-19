import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "../../../test/utils/testUtils";
import FieldCheckDialog from "./FieldCheckDialog";
import { useSDK, useAutoResizer } from "@contentful/react-apps-toolkit";
import { useAuth } from "../../contexts/AuthContext";
import { useSuggestions } from "../../hooks/useSuggestions";
import { useConfigData } from "../../contexts/ConfigDataContext";
import { useUserSettings } from "../../hooks/useUserSettings";
import { useFieldCheckState } from "./FieldCheck/hooks";
import {
  Severity,
  Dialects,
  Tones,
  IssueCategory,
  GrammarCategory,
} from "../../api-client/types.gen";
import type { Suggestion, ScoreOutput } from "../../api-client/types.gen";

// Mock all the dependencies
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../../hooks/useSuggestions", () => ({
  useSuggestions: vi.fn(),
}));

vi.mock("../../contexts/ConfigDataContext", () => ({
  useConfigData: vi.fn(),
}));

vi.mock("../../hooks/useUserSettings", () => ({
  useUserSettings: vi.fn(),
}));

vi.mock("./FieldCheck/hooks", () => ({
  useFieldCheckState: vi.fn(),
}));

// Mock child components to simplify testing
vi.mock("./FieldCheck/components/EditorPanel", () => ({
  EditorPanel: ({
    initialContent,
    onCheck,
    isBusy,
    editorContentRef,
  }: {
    initialContent: string;
    onCheck: () => void;
    isBusy: boolean;
    editorContentRef: React.MutableRefObject<(() => string) | null>;
  }) => {
    // Set up the content ref
    editorContentRef.current = () => initialContent;
    return (
      <div data-testid="editor-panel">
        <span data-testid="editor-content">{initialContent}</span>
        <button data-testid="check-button" onClick={onCheck} disabled={isBusy}>
          Check
        </button>
        {isBusy && <span data-testid="busy-indicator">Loading...</span>}
      </div>
    );
  },
}));

vi.mock("./FieldCheck/components/SuggestionsSidebar", () => ({
  SuggestionsSidebar: ({
    suggestions,
    isLoading,
    onCheck,
  }: {
    suggestions: Suggestion[];
    isLoading: boolean;
    onCheck: () => void;
  }) => (
    <div data-testid="suggestions-sidebar">
      <span data-testid="suggestion-count">{suggestions.length}</span>
      {isLoading && <span data-testid="sidebar-loading">Loading...</span>}
      <button data-testid="sidebar-check-button" onClick={onCheck}>
        Run Check
      </button>
    </div>
  ),
}));

vi.mock("../../components/UserSettings/SignInCard", () => ({
  __esModule: true,
  default: () => <div data-testid="sign-in-card">Please sign in</div>,
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

// Helper to create mock scores
function createMockScores(): ScoreOutput {
  return {
    quality: { score: 85 },
    analysis: {
      clarity: { score: 80 },
      grammar: { score: 90 },
    },
  } as ScoreOutput;
}

describe("FieldCheckDialog", () => {
  const mockClose = vi.fn();
  const mockUpdateHeight = vi.fn();
  const mockGetSuggestions = vi.fn();
  const mockSetActiveScores = vi.fn();
  const mockSetActiveSuggestions = vi.fn();
  const mockUpdateConfig = vi.fn();
  const mockResetAll = vi.fn();
  const mockUpdateDialect = vi.fn();
  const mockUpdateTone = vi.fn();
  const mockUpdateStyleGuide = vi.fn();
  const mockClipboardWriteText = vi.fn();

  const defaultSdkMock = {
    parameters: {
      invocation: {
        fieldContent: "This is test content for checking.",
        fieldId: "testField",
        fieldFormat: "Text",
        contentTypeId: "testContentType",
      },
    },
    window: {
      updateHeight: mockUpdateHeight,
    },
    close: mockClose,
  };

  const defaultAuthMock = {
    isAuthenticated: true,
    isLoading: false,
    user: { email: "test@example.com" },
  };

  const defaultUserSettingsMock = {
    effectiveSettings: {
      apiKey: "test-api-key",
      dialect: Dialects.AMERICAN_ENGLISH,
      tone: Tones.PROFESSIONAL,
      styleGuide: null,
    },
    updateDialect: mockUpdateDialect,
    updateTone: mockUpdateTone,
    updateStyleGuide: mockUpdateStyleGuide,
  };

  const defaultConfigDataMock = {
    constants: {
      dialects: [Dialects.AMERICAN_ENGLISH, Dialects.BRITISH_ENGLISH],
      tones: [Tones.PROFESSIONAL, Tones.CONVERSATIONAL],
    },
    styleGuides: [],
    isLoading: false,
    error: null,
  };

  const defaultFieldCheckStateMock = {
    activeScores: null,
    activeSuggestions: [] as Suggestion[],
    config: {
      dialect: Dialects.AMERICAN_ENGLISH,
      tone: Tones.PROFESSIONAL,
      styleGuide: undefined,
    },
    setActiveScores: mockSetActiveScores,
    setActiveSuggestions: mockSetActiveSuggestions,
    updateConfig: mockUpdateConfig,
    resetAll: mockResetAll,
  };

  const defaultSuggestionsMock = {
    getSuggestions: mockGetSuggestions,
    isPolling: false,
    lastWorkflowId: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mocks
    (useSDK as Mock).mockReturnValue(defaultSdkMock);
    (useAutoResizer as Mock).mockReturnValue(undefined);
    (useAuth as Mock).mockReturnValue(defaultAuthMock);
    (useUserSettings as Mock).mockReturnValue(defaultUserSettingsMock);
    (useConfigData as Mock).mockReturnValue(defaultConfigDataMock);
    (useFieldCheckState as Mock).mockReturnValue(defaultFieldCheckStateMock);
    (useSuggestions as Mock).mockReturnValue(defaultSuggestionsMock);

    // Mock localStorage
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });

    // Mock clipboard API
    mockClipboardWriteText.mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockClipboardWriteText,
      },
      writable: true,
    });
  });

  describe("Authentication", () => {
    it("renders sign-in card when not authenticated", () => {
      (useAuth as Mock).mockReturnValue({
        ...defaultAuthMock,
        isAuthenticated: false,
      });

      render(<FieldCheckDialog />);

      expect(screen.getByTestId("sign-in-card")).toBeInTheDocument();
    });

    it("renders main dialog when authenticated", () => {
      render(<FieldCheckDialog />);

      expect(screen.queryByTestId("sign-in-card")).not.toBeInTheDocument();
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
      expect(screen.getByTestId("suggestions-sidebar")).toBeInTheDocument();
    });
  });

  describe("Initial Content Loading", () => {
    it("displays text content in editor", () => {
      render(<FieldCheckDialog />);

      expect(screen.getByTestId("editor-content")).toHaveTextContent(
        "This is test content for checking.",
      );
    });

    it("auto-runs check on mount when authenticated", async () => {
      const mockSuggestions = [createMockSuggestion()];
      mockGetSuggestions.mockResolvedValue({
        original: {
          scores: createMockScores(),
          issues: mockSuggestions,
        },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalledWith(
          "This is test content for checking.",
          false, // isRichText = false for Text format
        );
      });

      await waitFor(() => {
        expect(mockSetActiveScores).toHaveBeenCalled();
        expect(mockSetActiveSuggestions).toHaveBeenCalledWith(mockSuggestions);
      });
    });

    it("handles RichText content format", async () => {
      // Properly structured Contentful RichText document with marks array
      const richTextContent = {
        nodeType: "document",
        data: {},
        content: [
          {
            nodeType: "paragraph",
            data: {},
            content: [{ nodeType: "text", value: "Rich text content", marks: [], data: {} }],
          },
        ],
      };

      (useSDK as Mock).mockReturnValue({
        ...defaultSdkMock,
        parameters: {
          invocation: {
            ...defaultSdkMock.parameters.invocation,
            fieldContent: richTextContent,
            fieldFormat: "RichText",
          },
        },
      });

      mockGetSuggestions.mockResolvedValue({
        original: {
          scores: createMockScores(),
          issues: [],
        },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalledWith(
          expect.any(String), // HTML converted content
          true, // isRichText = true
        );
      });
    });
  });

  describe("Loading State", () => {
    it("shows loading indicator during initial check", () => {
      (useSuggestions as Mock).mockReturnValue({
        ...defaultSuggestionsMock,
        isPolling: true,
      });

      render(<FieldCheckDialog />);

      expect(screen.getByTestId("busy-indicator")).toBeInTheDocument();
    });

    it("shows loading indicator in sidebar during polling", () => {
      (useSuggestions as Mock).mockReturnValue({
        ...defaultSuggestionsMock,
        isPolling: true,
      });

      render(<FieldCheckDialog />);

      expect(screen.getByTestId("sidebar-loading")).toBeInTheDocument();
    });
  });

  describe("Dialog Actions", () => {
    it("closes dialog on 'Reject and Close' button click", async () => {
      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      // Wait for initial load to complete
      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalled();
      });

      const rejectButton = screen.getByRole("button", { name: /reject and close/i });
      act(() => {
        fireEvent.click(rejectButton);
      });

      expect(mockClose).toHaveBeenCalled();
    });

    it("disables 'Accept and Save' button when no changes applied", async () => {
      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalled();
      });

      const acceptButton = screen.getByRole("button", { name: /accept and save/i });
      expect(acceptButton).toBeDisabled();
    });
  });

  describe("Workflow ID", () => {
    it("displays workflow ID button when lastWorkflowId is present", async () => {
      (useSuggestions as Mock).mockReturnValue({
        ...defaultSuggestionsMock,
        lastWorkflowId: "wf-12345",
      });

      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copy workflow id/i })).toBeInTheDocument();
      });
    });

    it("copies workflow ID to clipboard on button click", async () => {
      (useSuggestions as Mock).mockReturnValue({
        ...defaultSuggestionsMock,
        lastWorkflowId: "wf-12345",
      });

      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /copy workflow id/i })).toBeInTheDocument();
      });

      const copyButton = screen.getByRole("button", { name: /copy workflow id/i });
      act(() => {
        fireEvent.click(copyButton);
      });

      await waitFor(() => {
        expect(mockClipboardWriteText).toHaveBeenCalledWith("wf-12345");
      });
    });

    it("does not display workflow ID button when lastWorkflowId is null", async () => {
      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(mockGetSuggestions).toHaveBeenCalled();
      });

      expect(screen.queryByRole("button", { name: /copy workflow id/i })).not.toBeInTheDocument();
    });
  });

  describe("Content Preview Section", () => {
    it("renders preview title and subtitle", () => {
      render(<FieldCheckDialog />);

      expect(screen.getByText("Content Preview")).toBeInTheDocument();
      expect(
        screen.getByText("Click on highlighted text or sidebar cards to view suggestions"),
      ).toBeInTheDocument();
    });
  });

  describe("Config Initialization", () => {
    it("initializes config from effective settings", async () => {
      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: [] },
      });

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(mockUpdateConfig).toHaveBeenCalledWith({
          dialect: Dialects.AMERICAN_ENGLISH,
          tone: Tones.PROFESSIONAL,
          styleGuide: undefined, // Uses ?? undefined pattern from the component
        });
      });
    });
  });

  describe("Suggestions Display", () => {
    it("passes suggestions to sidebar", () => {
      const suggestions = [
        createMockSuggestion({ original: "First issue" }),
        createMockSuggestion({ original: "Second issue", severity: Severity.HIGH }),
      ];

      (useFieldCheckState as Mock).mockReturnValue({
        ...defaultFieldCheckStateMock,
        activeSuggestions: suggestions,
      });

      mockGetSuggestions.mockResolvedValue({
        original: { scores: null, issues: suggestions },
      });

      render(<FieldCheckDialog />);

      // The sidebar should show the suggestion count
      expect(screen.getByTestId("suggestion-count")).toHaveTextContent("2");
    });
  });

  describe("Error Handling", () => {
    it("logs error when initial check fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      mockGetSuggestions.mockRejectedValue(new Error("API Error"));

      render(<FieldCheckDialog />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith("Error running initial check:", expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Window Height", () => {
    it("updates window height on mount", () => {
      render(<FieldCheckDialog />);

      expect(mockUpdateHeight).toHaveBeenCalled();
    });
  });
});
