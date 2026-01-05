import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, mockUseAuth } from "../../../test/utils/testUtils";
import {
  createMockAuthReturn,
  createLoadingAuthMock,
  createErrorAuthMock,
} from "../../../test/utils/authTestHelpers";
import SignInCard from "./SignInCard";

describe("SignInCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign-in card with correct content", () => {
    mockUseAuth.mockReturnValue(createMockAuthReturn());

    render(<SignInCard />);

    expect(screen.getByText("Sign in to Markup AI")).toBeInTheDocument();
    expect(
      screen.getByText("Check, score, and improve your content with Markup AI."),
    ).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("shows loading state when authentication is loading", () => {
    mockUseAuth.mockReturnValue(createLoadingAuthMock());

    render(<SignInCard />);

    const signInButton = screen.getByRole("button", { name: /sign in/i });
    expect(signInButton).toBeDisabled();
  });

  it("shows error message when authentication fails", () => {
    const errorMessage = "Authentication failed";
    mockUseAuth.mockReturnValue(createErrorAuthMock(errorMessage));

    render(<SignInCard />);

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("calls loginWithPopup when sign-in button is clicked", async () => {
    const mockLoginWithPopup = vi.fn().mockResolvedValue("mock-token");
    mockUseAuth.mockReturnValue(
      createMockAuthReturn({
        loginWithPopup: mockLoginWithPopup,
      }),
    );

    render(<SignInCard />);

    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLoginWithPopup).toHaveBeenCalledTimes(1);
    });
  });

  it("handles login errors gracefully", async () => {
    const mockLoginWithPopup = vi.fn().mockRejectedValue(new Error("Login failed"));
    mockUseAuth.mockReturnValue(
      createMockAuthReturn({
        loginWithPopup: mockLoginWithPopup,
      }),
    );

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<SignInCard />);

    const signInButton = screen.getByText("Sign In");
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLoginWithPopup).toHaveBeenCalledTimes(1);
    });

    expect(consoleSpy).toHaveBeenCalledWith("[SignInCard] Login failed:", expect.any(Error));

    consoleSpy.mockRestore();
  });
});
