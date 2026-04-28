import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, mockUseAuth } from "../../../test/utils/testUtils";
import SignInDialog from "./SignInDialog";
import { useSDK } from "@contentful/react-apps-toolkit";

// Mock the SDK
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

const createMockDialogSdk = () => ({
  close: vi.fn(),
  parameters: {
    invocation: { signIn: true },
  },
});

describe("SignInDialog", () => {
  let mockSdk: ReturnType<typeof createMockDialogSdk>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk = createMockDialogSdk();
    (useSDK as unknown as Mock).mockReturnValue(mockSdk);

    // Default: not authenticated
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

  it("renders sign-in UI", () => {
    render(<SignInDialog />);

    expect(screen.getByText("Sign in to Markup AI")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SignInDialog />);

    expect(screen.getByRole("button", { name: /Close/i })).toBeInTheDocument();
  });

  it("closes dialog with signedIn: false when close button clicked", () => {
    render(<SignInDialog />);

    const closeButton = screen.getByRole("button", { name: /Close/i });
    fireEvent.click(closeButton);

    expect(mockSdk.close).toHaveBeenCalledWith({ signedIn: false });
  });

  it("calls loginWithPopup when sign in button clicked", async () => {
    const mockLoginWithPopup = vi.fn().mockResolvedValue(null);
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      loginWithPopup: mockLoginWithPopup,
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    render(<SignInDialog />);

    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLoginWithPopup).toHaveBeenCalled();
    });
  });

  it("closes dialog with signedIn: true when authentication succeeds", async () => {
    // Start with not authenticated
    const { rerender } = render(<SignInDialog />);

    // Simulate authentication success
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

    // Rerender to trigger the effect
    rerender(<SignInDialog />);

    await waitFor(() => {
      expect(mockSdk.close).toHaveBeenCalledWith({ signedIn: true });
    });
  });

  it("shows loading state while authenticating", () => {
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

    render(<SignInDialog />);

    const signInButton = screen.getByRole("button", { name: /Sign In/i });
    expect(signInButton).toBeDisabled();
  });

  it("displays error message when login fails", () => {
    mockUseAuth.mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      error: "Login failed",
      loginWithPopup: vi.fn(),
      getAccessToken: vi.fn(),
      logout: vi.fn(),
    });

    render(<SignInDialog />);

    expect(screen.getByText("Login failed")).toBeInTheDocument();
  });

  it("renders Markup AI logo", () => {
    render(<SignInDialog />);

    const logo = screen.getByAltText("Markup AI");
    expect(logo).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<SignInDialog />);

    expect(
      screen.getByText(/Sign in to check, score, and improve your content/i),
    ).toBeInTheDocument();
  });

  it("renders secure sign-in microcopy", () => {
    render(<SignInDialog />);

    expect(screen.getByText(/Sign in securely using/i)).toBeInTheDocument();
  });
});
