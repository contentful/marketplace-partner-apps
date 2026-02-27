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
  },
  dialogs: {
    openCurrentApp: vi.fn(),
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
          }) as object,
          width: 1200,
        }),
      );
    });
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
});
