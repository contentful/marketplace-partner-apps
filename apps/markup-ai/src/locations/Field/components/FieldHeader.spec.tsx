import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, mockUseAuth } from "../../../../test/utils/testUtils";
import { FieldHeader } from "./FieldHeader";

// Mock the hooks
vi.mock("../../../hooks/useUserSettings", () => ({
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

vi.mock("../../../hooks/useContentTypeDefaults", () => ({
  useContentTypeDefaults: vi.fn(() => ({
    defaults: { styleGuide: null, dialect: null, tone: null },
    isLoading: false,
    contentTypeId: "blogPost",
    fieldId: "title",
  })),
}));

vi.mock("../../../contexts/ConfigDataContext", () => ({
  useConfigData: vi.fn(() => ({
    constants: {
      dialects: ["american_english", "british_english"],
      tones: ["formal", "casual"],
    },
    styleGuides: [
      { id: "microsoft", name: "Microsoft" },
      { id: "ap", name: "AP Style" },
    ],
    isLoading: false,
    error: null,
  })),
}));

describe("FieldHeader", () => {
  const mockOnCheckClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up authenticated state for most tests
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn().mockResolvedValue(null),
      getAccessToken: vi.fn().mockResolvedValue("test-token"),
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders the Markup AI button", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    expect(screen.getByText("Markup AI")).toBeInTheDocument();
  });

  it("calls onCheckClick when button is clicked", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    const button = screen.getByText("Markup AI");
    fireEvent.click(button);

    expect(mockOnCheckClick).toHaveBeenCalledTimes(1);
  });

  it("disables the button when isDisabled is true", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} isDisabled={true} />);

    const button = screen.getByRole("button", { name: /Markup AI/i });
    expect(button).toBeDisabled();
  });

  it("shows gear icon for configuration", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    const configButton = screen.getByRole("button", { name: /configuration/i });
    expect(configButton).toBeInTheDocument();
  });

  it("toggles configuration controls when gear icon is clicked", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    // Configuration should be hidden initially
    expect(screen.queryByText("Style Guide")).not.toBeVisible();

    // Click gear icon
    const configButton = screen.getByRole("button", { name: /configuration/i });
    fireEvent.click(configButton);

    // Configuration should now be visible
    expect(screen.getByText("Style Guide")).toBeVisible();
  });

  it("renders style guide dropdown when config is expanded", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    // Expand config
    const configButton = screen.getByRole("button", { name: /configuration/i });
    fireEvent.click(configButton);

    // Check that style guide dropdown exists
    expect(screen.getByText("Style Guide")).toBeInTheDocument();
  });

  it("renders dialect dropdown when config is expanded", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    // Expand config
    const configButton = screen.getByRole("button", { name: /configuration/i });
    fireEvent.click(configButton);

    // Check that dialect label exists
    expect(screen.getByText("Dialect")).toBeInTheDocument();
  });

  it("renders tone dropdown when config is expanded", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    // Expand config
    const configButton = screen.getByRole("button", { name: /configuration/i });
    fireEvent.click(configButton);

    // Check that tone label exists
    expect(screen.getByText("Tone")).toBeInTheDocument();
  });

  it("displays logo image", () => {
    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    const logo = screen.getByAltText("Markup AI");
    expect(logo).toBeInTheDocument();
  });

  it("disables gear icon when user is not authenticated", () => {
    // Set up unauthenticated state
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

    render(<FieldHeader onCheckClick={mockOnCheckClick} />);

    const configButton = screen.getByRole("button", { name: /configuration/i });
    expect(configButton).toBeDisabled();
  });
});
