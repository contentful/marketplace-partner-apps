import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, mockUseAuth } from "../../../test/utils/testUtils";
import {
  sharedOriginalScores,
  createMockFieldCheck,
  buildWorkflow,
} from "../../../test/utils/rewriterFixtures";
import {
  createMockAuthReturn,
  createAuthenticatedMock,
  createLoadingAuthMock,
} from "../../../test/utils/authTestHelpers";
import Sidebar from "./Sidebar";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Dialects, StyleGuides, Tones } from "../../api-client/types.gen";
import { useRewriter } from "../../hooks/useRewriter";
import { useUserSettings } from "../../hooks/useUserSettings";
import { mockSdk } from "../../../test/mocks/mockSdk";

// Mock the SDK and hooks
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
  useAutoResizer: vi.fn(),
}));

vi.mock("../../hooks/useRewriter", () => ({
  useRewriter: vi.fn(),
}));

vi.mock("../../hooks/useUserSettings", () => ({
  useUserSettings: vi.fn(),
}));

const mockOriginalScores = sharedOriginalScores;

const createTestFieldCheck = (overrides?: Partial<ReturnType<typeof createMockFieldCheck>>) =>
  createMockFieldCheck({
    originalValue: "Original test content",
    checkResponse: {
      workflow: buildWorkflow("checks", undefined, "chk-1"),
      config: {
        dialect: Dialects.AMERICAN_ENGLISH,
        style_guide: { style_guide_type: StyleGuides.AP, style_guide_id: "sg-1" },
        tone: Tones.PROFESSIONAL,
      },
      original: { issues: [], scores: mockOriginalScores },
    },
    ...overrides,
  });

const mockFieldCheck = createTestFieldCheck();

// Create persistent mock functions that won't be recreated
const mockRewriterFunctions = {
  handleAcceptSuggestion: vi.fn(),
  clearError: vi.fn(),
  handleRewrite: vi.fn(),
  setOnFieldChange: vi.fn(),
  updateCheck: vi.fn(),
  clearFieldCooldown: vi.fn(),
  isFieldInCooldown: vi.fn(),
  resetAcceptingSuggestionFlag: vi.fn(),
};

type MockRewriter = typeof mockRewriterFunctions & {
  fieldChecks: Record<string, ReturnType<typeof createTestFieldCheck>>;
};

const createMockRewriter = (overrides?: Partial<MockRewriter>): MockRewriter => ({
  fieldChecks: { field1: mockFieldCheck },
  ...mockRewriterFunctions,
  ...overrides,
});

const mockRewriter = createMockRewriter();

const mockUserSettings = {
  effectiveSettings: {
    dialect: "american_english",
    tone: "professional",
    styleGuide: "default",
    apiKey: "test-api-key",
  },
  fieldSettings: {
    dialect: null,
    tone: null,
    styleGuide: null,
  },
  settings: {
    dialect: "american_english",
    tone: "professional",
    styleGuide: "default",
  },
  updateDialect: vi.fn(),
  updateTone: vi.fn(),
  updateStyleGuide: vi.fn(),
};

// Mock SDK with field information
const mockSdkWithFields = {
  ...mockSdk,
  entry: {
    ...mockSdk.entry,
    fields: {
      field1: {
        id: "field1",
        name: "Field 1",
        type: "Text",
        getValue: vi.fn(),
        setValue: vi.fn(),
      },
    },
  },
};

describe("Sidebar", () => {
  const openSettingsPanel = () => {
    (useUserSettings as Mock).mockReturnValue({
      ...mockUserSettings,
      settings: { dialect: null, tone: null, styleGuide: null },
    });
    render(<Sidebar />);

    const settingsButton = screen.getByLabelText("Open settings");
    fireEvent.click(settingsButton);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as Mock).mockReturnValue(mockSdkWithFields);
    (useRewriter as Mock).mockReturnValue(mockRewriter);
    (useUserSettings as Mock).mockReturnValue(mockUserSettings);
    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({ accepted: false });

    // Mock authenticated state by default
    mockUseAuth.mockReturnValue(createAuthenticatedMock());

    // Set up user settings in localStorage
    globalThis.localStorage.setItem("markupai.dialect", "american_english");
    globalThis.localStorage.setItem("markupai.tone", "neutral");
    globalThis.localStorage.setItem("markupai.styleGuide", "default");
  });

  it("renders sign-in card when not authenticated", () => {
    mockUseAuth.mockReturnValue(createMockAuthReturn());

    render(<Sidebar />);
    expect(screen.getByText("Sign in to Markup AI")).toBeInTheDocument();
    expect(
      screen.getByText("Check, score, and improve your content with Markup AI."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("renders loading state when authentication is loading", () => {
    mockUseAuth.mockReturnValue(createLoadingAuthMock());

    render(<Sidebar />);
    expect(screen.getByText("Sign in to Markup AI")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });

  it("renders the sidebar container when authenticated", () => {
    render(<Sidebar />);
    const container = document.querySelector('div[class*="css-"]');
    expect(container).toBeInTheDocument();
  });

  it("renders field check cards for valid fields", () => {
    render(<Sidebar />);
    expect(screen.getByText("Field 1")).toBeInTheDocument();
  });

  it("renders error card when there is an error", () => {
    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: {
          field1: {
            ...mockFieldCheck,
            error: "Test error",
          },
        },
      }),
    );

    render(<Sidebar />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("renders start block waiting when no field checks", () => {
    (useRewriter as Mock).mockReturnValue(createMockRewriter({ fieldChecks: {} }));

    render(<Sidebar />);
    expect(
      screen.getByText("Waiting for user to write, add, or update content"),
    ).toBeInTheDocument();
  });

  it("shows the Rewrite button and opens dialog when clicked", async () => {
    render(<Sidebar />);

    const header = screen.getByText("Field 1").closest("[data-clickable]");
    if (!header) throw new Error("Header element not found");
    fireEvent.click(header);

    const rewriteButton = screen.getByText("Rewrite");
    expect(rewriteButton).toBeInTheDocument();
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrent).toHaveBeenCalled();
    });
  });

  it("calls onClose when close button is clicked", () => {
    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: {
          field1: {
            ...mockFieldCheck,
            error: "Test error",
          },
        },
      }),
    );

    render(<Sidebar />);
    const closeButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeButton);
    expect(mockRewriterFunctions.clearError).toHaveBeenCalledWith("field1");
  });

  it("shows loading state when checking", () => {
    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: {
          field1: {
            ...mockFieldCheck,
            isChecking: true,
            checkResponse: null,
          },
        },
      }),
    );

    render(<Sidebar />);
    expect(screen.getByText("Analyzing content")).toBeInTheDocument();
  });

  it("shows waiting state when no response and not checking", () => {
    const waitingField = createTestFieldCheck({ checkResponse: null });

    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: { field1: waitingField },
      }),
    );

    render(<Sidebar />);
    expect(screen.getByText("Waiting for changes to settle")).toBeInTheDocument();
  });

  it("shows error state when error exists", () => {
    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: {
          field1: {
            ...mockFieldCheck,
            error: "Test error",
          },
        },
      }),
    );

    render(<Sidebar />);
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it('shows "Rewriting" button text when checking', () => {
    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: {
          field1: {
            ...mockFieldCheck,
            isChecking: true,
          },
        },
      }),
    );

    render(<Sidebar />);

    const header = screen.getByText("Field 1").closest("[data-clickable]");
    if (!header) throw new Error("Header element not found");
    fireEvent.click(header);

    expect(screen.getByText("Rewriting")).toBeInTheDocument();
  });

  it("displays dash when score is neutral", () => {
    const neutralScoreField = createTestFieldCheck({
      checkResponse: {
        workflow: buildWorkflow("checks", undefined, "chk-1"),
        config: {
          dialect: Dialects.AMERICAN_ENGLISH,
          style_guide: { style_guide_type: StyleGuides.AP, style_guide_id: "sg-1" },
          tone: Tones.PROFESSIONAL,
        },
        original: {
          issues: [],
          scores: { ...mockOriginalScores, quality: { ...mockOriginalScores.quality, score: 0 } },
        },
      },
    });

    (useRewriter as Mock).mockReturnValue(
      createMockRewriter({
        fieldChecks: { field1: neutralScoreField },
      }),
    );

    render(<Sidebar />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("handles dialog acceptance with rewrite response", async () => {
    const mockRewriteResponse = {
      workflow_id: "rewrite-123",
      status: "completed",
      rewrite: {
        text: "Improved text",
        scores: { quality: { score: 90 } },
      },
    };

    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({
      accepted: true,
      fieldId: "field1",
      rewriteResponse: mockRewriteResponse,
    });

    render(<Sidebar />);

    const header = screen.getByText("Field 1").closest("[data-clickable]");
    if (!header) throw new Error("Header element not found");
    fireEvent.click(header);
    const rewriteButton = screen.getByText("Rewrite");
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(mockRewriterFunctions.updateCheck).toHaveBeenCalledWith("field1", {
        checkResponse: mockRewriteResponse,
        hasRewriteResult: true,
      });
      expect(mockRewriterFunctions.handleAcceptSuggestion).toHaveBeenCalledWith(
        "field1",
        mockRewriteResponse,
      );
    });
  });

  it("handles dialog acceptance without rewrite response", async () => {
    mockSdk.dialogs.openCurrent = vi.fn().mockResolvedValue({
      accepted: true,
      fieldId: "field1",
    });

    render(<Sidebar />);

    const header = screen.getByText("Field 1").closest("[data-clickable]");
    if (!header) throw new Error("Header element not found");
    fireEvent.click(header);
    const rewriteButton = screen.getByText("Rewrite");
    fireEvent.click(rewriteButton);

    await waitFor(() => {
      expect(mockRewriterFunctions.handleAcceptSuggestion).toHaveBeenCalledWith("field1");
    });
  });

  it("renders settings panel when settings button is clicked", () => {
    openSettingsPanel();
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("calls user settings update functions", () => {
    render(<Sidebar />);

    expect(useUserSettings).toHaveBeenCalled();
    expect(mockUserSettings.updateDialect).toBeDefined();
    expect(mockUserSettings.updateTone).toBeDefined();
    expect(mockUserSettings.updateStyleGuide).toBeDefined();
  });

  it("handles field change callback to reset expanded state", () => {
    render(<Sidebar />);

    expect(mockRewriterFunctions.setOnFieldChange).toHaveBeenCalled();

    const setOnFieldChangeCall = mockRewriterFunctions.setOnFieldChange.mock.calls[0]?.[0] as
      | (() => void)
      | undefined;
    expect(typeof setOnFieldChangeCall).toBe("function");
  });
});
