import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, waitFor } from "@testing-library/react";
import { render, mockUseAuth } from "../../../../test/utils/testUtils";
import { UserProfileButton } from "./UserProfileButton";
import { MARKUP_CONSOLE_URL, MARKUP_DEVELOPER_PORTAL_URL } from "../../../utils/markupUrls";

function setAuthenticated(overrides: Record<string, unknown> = {}) {
  mockUseAuth.mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    user: { email: "test@markup.ai" },
    token: "tok",
    error: null,
    loginWithPopup: vi.fn().mockResolvedValue(null),
    getAccessToken: vi.fn().mockResolvedValue("tok"),
    logout: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  });
}

function setUnauthenticated() {
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
}

describe("UserProfileButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the dropdown and shows the signed-in email when clicked", () => {
    setAuthenticated();
    const { getByRole, getByText } = render(<UserProfileButton />);
    fireEvent.click(getByRole("button", { name: /user profile/i }));
    expect(getByText("test@markup.ai")).toBeInTheDocument();
  });

  it("renders Open Console + Developer Portal links with correct external href", () => {
    setAuthenticated();
    const { getByRole, getByText } = render(<UserProfileButton />);
    fireEvent.click(getByRole("button", { name: /user profile/i }));

    const console_ = getByText("Open Console").closest("a");
    expect(console_).not.toBeNull();
    expect(console_).toHaveAttribute("href", MARKUP_CONSOLE_URL);
    expect(console_).toHaveAttribute("target", "_blank");
    expect(console_).toHaveAttribute("rel", "noopener noreferrer");

    const docs = getByText("Developer Portal").closest("a");
    expect(docs).not.toBeNull();
    expect(docs).toHaveAttribute("href", MARKUP_DEVELOPER_PORTAL_URL);
    expect(docs).toHaveAttribute("target", "_blank");
  });

  it("hides the About item when no onOpenAbout callback is supplied", () => {
    setAuthenticated();
    const { getByRole, queryByText } = render(<UserProfileButton />);
    fireEvent.click(getByRole("button", { name: /user profile/i }));
    expect(queryByText("About")).toBeNull();
  });

  it("calls onOpenAbout when the About item is clicked", () => {
    setAuthenticated();
    const onOpenAbout = vi.fn();
    const { getByRole, getByText } = render(<UserProfileButton onOpenAbout={onOpenAbout} />);
    fireEvent.click(getByRole("button", { name: /user profile/i }));
    fireEvent.click(getByText("About"));
    expect(onOpenAbout).toHaveBeenCalledTimes(1);
  });

  it("Sign out triggers logout and onSignOut callback", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    setAuthenticated({ logout });
    const onSignOut = vi.fn();
    const { getByRole, findByRole } = render(<UserProfileButton onSignOut={onSignOut} />);
    fireEvent.click(getByRole("button", { name: /user profile/i }));
    const signOut = await findByRole("button", { name: /sign out/i });
    fireEvent.click(signOut);
    // Use waitFor instead of `await Promise.resolve()` chains so this stays
    // correct even if `handleSignOut` grows additional `await`s downstream.
    await waitFor(() => {
      expect(logout).toHaveBeenCalledTimes(1);
      expect(onSignOut).toHaveBeenCalledTimes(1);
    });
  });

  it("shows the sign-in prompt when not authenticated", () => {
    setUnauthenticated();
    const { getByRole, getByText } = render(<UserProfileButton />);
    fireEvent.click(getByRole("button", { name: /sign in/i }));
    expect(getByText(/sign in to markup ai/i)).toBeInTheDocument();
  });

  it("hides the sign-in prompt when hideSignInPrompt is set", () => {
    setUnauthenticated();
    const { getByRole, queryByText } = render(<UserProfileButton hideSignInPrompt />);
    fireEvent.click(getByRole("button", { name: /sign in/i }));
    expect(queryByText(/sign in to markup ai/i)).toBeNull();
  });
});
