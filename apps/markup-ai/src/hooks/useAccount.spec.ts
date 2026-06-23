import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount } from "./useAccount";

vi.mock("./useApiClient", () => ({
  useApiClient: vi.fn(() => ({
    baseUrl: "https://api.example.com",
    auth: "test-token",
  })),
}));

const mockUseAuth = vi.fn();
vi.mock("../contexts/AuthContext", () => ({
  useAuth: (): unknown => mockUseAuth() as unknown,
}));

const mockAccountGetAccount = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  accountGetAccount: (options: unknown): unknown => mockAccountGetAccount(options),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useAccount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: "test-token" });
  });

  it("does not fire the request when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, token: null });
    const { result } = renderHook(() => useAccount(), { wrapper: createWrapper() });
    expect(result.current.account).toBeNull();
    expect(result.current.organization).toBeNull();
    expect(mockAccountGetAccount).not.toHaveBeenCalled();
  });

  it("does not fire while authenticated but token not yet populated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: null });
    renderHook(() => useAccount(), { wrapper: createWrapper() });
    expect(mockAccountGetAccount).not.toHaveBeenCalled();
  });

  it("exposes the current organization when authenticated", async () => {
    mockAccountGetAccount.mockResolvedValue({
      data: {
        organization: { id: "uuid-1", name: "acme", display_name: "Acme Inc" },
        user_profile: {},
      },
    });
    const { result } = renderHook(() => useAccount(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.organization?.display_name).toBe("Acme Inc");
  });

  it("surfaces errors via isError and keeps account null", async () => {
    mockAccountGetAccount.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useAccount(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.account).toBeNull();
  });
});
