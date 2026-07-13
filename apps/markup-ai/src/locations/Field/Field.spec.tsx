import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, mockUseAuth } from "../../../test/utils/testUtils";
import Field from "./Field";
import { useSDK } from "@contentful/react-apps-toolkit";

// Mock the SDK
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

// Mock the getField utility
vi.mock("./utils", () => ({
  default: vi.fn(() => <div data-testid="field-content">Field Content</div>),
}));

// Mock the ConfigDataContext
vi.mock("../../contexts/ConfigDataContext", () => ({
  useConfigData: vi.fn(() => ({
    constants: { dialects: ["american_english"], tones: ["formal"] },
    styleGuides: [{ id: "microsoft", name: "Microsoft" }],
    isLoading: false,
    error: null,
  })),
}));

// Mock useUserSettings
vi.mock("../../hooks/useUserSettings", () => ({
  useUserSettings: vi.fn(() => ({
    effectiveSettings: {
      dialect: "american_english",
      tone: null,
      styleGuide: "microsoft",
      apiKey: "test-key",
    },
    fieldSettings: {
      dialect: null,
      tone: null,
      styleGuide: null,
    },
    updateDialect: vi.fn(),
    updateTone: vi.fn(),
    updateStyleGuide: vi.fn(),
  })),
}));

// Mock useContentTypeDefaults
vi.mock("../../hooks/useContentTypeDefaults", () => ({
  useContentTypeDefaults: vi.fn(() => ({
    defaults: { styleGuide: null, dialect: null, tone: null },
    isLoading: false,
    contentTypeId: "blogPost",
    fieldId: "title",
  })),
}));

const mockUseAgentAvailability = vi.fn(() => ({
  unavailable: new Map(),
  isLoading: false,
  isError: false,
}));
vi.mock("../../hooks/useAgentAvailability", () => ({
  useAgentAvailability: () => mockUseAgentAvailability(),
}));

vi.mock("../../hooks/useAgentSelection", () => ({
  useAgentSelection: () => ({
    selectedAgentIds: ["style_agent"],
    toggleAgent: vi.fn(),
    setSelectedAgentIds: vi.fn(),
  }),
}));

const createMockSdk = () => ({
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
  },
  field: {
    id: "title",
    type: "Symbol",
    getValue: vi.fn(() => "Test content"),
    setValue: vi.fn(),
  },
  entry: {
    getSys: vi.fn(() => ({
      contentType: {
        sys: { id: "blogPost" },
      },
    })),
    fields: {
      title: { getValue: vi.fn(() => "My Article") },
    },
  },
  contentType: {
    displayField: "title",
  },
  dialogs: {
    openCurrentApp: vi.fn(),
  },
  parameters: {
    installation: {},
  },
  ids: {
    space: "space-test",
    environment: "master",
    environmentAlias: undefined,
  },
});

describe("Field", () => {
  let mockSdk: ReturnType<typeof createMockSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockSdk();
    (useSDK as unknown as Mock).mockReturnValue(mockSdk);

    // Default: not authenticated, not loading
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      loginWithPopup: vi.fn().mockResolvedValue(null),
      getAccessToken: vi.fn().mockResolvedValue(null),
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders the field header and content", () => {
    render(<Field />);

    expect(screen.getByText("Markup AI")).toBeInTheDocument();
    expect(screen.getByTestId("field-content")).toBeInTheDocument();
  });

  it("starts auto resizer on mount", () => {
    render(<Field />);

    expect(mockSdk.window.startAutoResizer).toHaveBeenCalled();
  });

  it("opens sign-in dialog when not authenticated and button clicked", async () => {
    mockSdk.dialogs.openCurrentApp.mockResolvedValue({ signedIn: false });

    render(<Field />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            signIn: true,
          }) as object,
          width: 420,
        }),
      );
    });
  });

  it("opens editor dialog directly when authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    mockSdk.dialogs.openCurrentApp.mockResolvedValue(null);

    render(<Field />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith(
        expect.objectContaining({
          parameters: expect.objectContaining({
            fieldCheck: true,
            contentTypeId: "blogPost",
            fieldId: "title",
            entryTitle: "My Article",
          }) as object,
          width: 1200,
        }),
      );
    });
  });

  it("omits entryTitle when displayField is unset", async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    mockSdk.contentType.displayField = "";
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(null);

    render(<Field />);
    fireEvent.click(screen.getByText("Markup AI"));

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalled();
    });
    const firstCall = mockSdk.dialogs.openCurrentApp.mock.calls[0] as unknown as [
      { parameters: Record<string, unknown> },
    ];
    expect(firstCall[0].parameters).not.toHaveProperty("entryTitle");
  });

  it("omits entryTitle when the entry title is whitespace", async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    mockSdk.entry.fields.title.getValue.mockReturnValueOnce("   ");
    mockSdk.dialogs.openCurrentApp.mockResolvedValue(null);

    render(<Field />);
    fireEvent.click(screen.getByText("Markup AI"));

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalled();
    });
    const firstCall = mockSdk.dialogs.openCurrentApp.mock.calls[0] as unknown as [
      { parameters: Record<string, unknown> },
    ];
    expect(firstCall[0].parameters).not.toHaveProperty("entryTitle");
  });

  it("opens editor dialog after successful sign-in", async () => {
    // First call returns sign-in success, second call is for the editor
    mockSdk.dialogs.openCurrentApp
      .mockResolvedValueOnce({ signedIn: true })
      .mockResolvedValueOnce("Updated content");

    render(<Field />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    await waitFor(() => {
      // Should have been called twice: sign-in dialog and then editor dialog
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(2);
    });

    // First call should be sign-in dialog
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        parameters: expect.objectContaining({ signIn: true }) as object,
      }),
    );

    // Second call should be editor dialog
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        parameters: expect.objectContaining({ fieldCheck: true }) as object,
      }),
    );
  });

  it("does not open editor dialog when sign-in cancelled", async () => {
    mockSdk.dialogs.openCurrentApp.mockResolvedValueOnce({ signedIn: false });

    render(<Field />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledTimes(1);
    });

    // Should only have called once for the sign-in dialog
    expect(mockSdk.dialogs.openCurrentApp).toHaveBeenCalledWith(
      expect.objectContaining({
        parameters: expect.objectContaining({ signIn: true }) as object,
      }),
    );
  });

  it("updates field value when editor dialog returns content", async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    mockSdk.dialogs.openCurrentApp.mockResolvedValue("Updated content");

    render(<Field />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSdk.field.setValue).toHaveBeenCalledWith("Updated content");
    });
  });

  it("disables button while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    render(<Field />);

    const button = screen.getByRole("button", { name: /Markup AI/i });
    expect(button).toBeDisabled();
  });

  it("disables button when style_agent is the only selection and is unavailable", async () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });
    const reason = "Style agent is disabled for your organization. Contact support to enable it.";
    mockUseAgentAvailability.mockReturnValue({
      unavailable: new Map([["style_agent", { reason }]]),
      isLoading: false,
      isError: false,
    });

    render(<Field />);

    // Two role="button" elements now: the DisabledTooltipTarget wrapper span
    // and the inner native button. Pick the native one for the disabled
    // assertion.
    const buttons = screen.getAllByRole("button", { name: /Markup AI/i });
    const button = buttons.find((b) => b.tagName === "BUTTON") as HTMLButtonElement;
    expect(button).toBeDisabled();
    // Confirm the gate prevents the dialog from opening even if the user
    // tries to click. The Tooltip popover is f36's responsibility and isn't
    // reliable under jsdom, so we don't assert on its visible text here.
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockSdk.dialogs.openCurrentApp).not.toHaveBeenCalled();
    });
  });
});
