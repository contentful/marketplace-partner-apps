import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, mockUseAuth } from "../../../test/utils/testUtils";
import UserSettingsPanel from "./UserSettingsPanel";

vi.mock("@contentful/react-apps-toolkit", () => ({ useSDK: vi.fn(() => ({})) }));

describe("UserSettingsPanel", () => {
  const baseProps = {
    isOpen: true,
    forceOpen: false,
    onClose: vi.fn(),
    dialect: null as string | null,
    tone: null as string | null,
    styleGuide: null as string | null,
    onDialectChange: vi.fn(),
    onToneChange: vi.fn(),
    onStyleGuideChange: vi.fn(),
  };

  beforeEach(() => {
    // Mock authenticated state by default
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com", name: "Test User" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn().mockResolvedValue("test-token"),
      getAccessToken: vi.fn().mockResolvedValue("test-token"),
      logout: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders when open and shows configuration tab", () => {
    render(<UserSettingsPanel {...baseProps} />);
    expect(screen.getByText("Configuration")).toBeInTheDocument();
  });

  it("does not render when not open and not forced", () => {
    const { container } = render(<UserSettingsPanel {...baseProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("blocks closing when config incomplete (no callback called)", () => {
    const onClose = vi.fn();
    render(<UserSettingsPanel {...baseProps} onClose={onClose} />);
    const closeBtn = screen.getByLabelText("Close settings");
    fireEvent.click(closeBtn);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes when config is complete without requiring tone", () => {
    const onClose = vi.fn();
    render(
      <UserSettingsPanel
        {...baseProps}
        onClose={onClose}
        dialect="en-US"
        tone={null}
        styleGuide="default"
      />,
    );
    const closeBtn = screen.getByLabelText("Close settings");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("shows user info tab and sign out button", () => {
    render(<UserSettingsPanel {...baseProps} />);

    // Click on User Info tab
    const userInfoTab = screen.getByText("User Info");
    fireEvent.click(userInfoTab);

    // Check that user info is displayed
    expect(screen.getByText("Signed in as:")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    // Check that sign out button is present
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls logout when sign out button is clicked", () => {
    const mockLogout = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      user: { email: "test@example.com", name: "Test User" },
      token: "test-token",
      error: null,
      loginWithPopup: vi.fn().mockResolvedValue("test-token"),
      getAccessToken: vi.fn().mockResolvedValue("test-token"),
      logout: mockLogout,
    });

    render(<UserSettingsPanel {...baseProps} />);

    // Click on User Info tab
    const userInfoTab = screen.getByText("User Info");
    fireEvent.click(userInfoTab);

    // Click sign out button
    const signOutButton = screen.getByText("Sign out");
    fireEvent.click(signOutButton);

    expect(mockLogout).toHaveBeenCalled();
  });
});
