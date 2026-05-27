import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOrganizations } from "./useOrganizations";

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

const mockGetUserOrganizations = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  authenticationGetUserOrganizations: (options: unknown): unknown =>
    mockGetUserOrganizations(options),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useOrganizations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: "test-token" });
  });

  it("returns an empty list and skips the request when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, token: null });
    const { result } = renderHook(() => useOrganizations(), { wrapper: createWrapper() });
    expect(result.current.organizations).toEqual([]);
    expect(mockGetUserOrganizations).not.toHaveBeenCalled();
  });

  it("exposes the loaded organizations when authenticated", async () => {
    mockGetUserOrganizations.mockResolvedValue({
      data: [
        { id: "org_a", name: "acme", display_name: "Acme Inc", picture: "" },
        { id: "org_b", name: "beta", display_name: "Beta LLC", picture: "" },
      ],
    });
    const { result } = renderHook(() => useOrganizations(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.organizations).toHaveLength(2);
    expect(result.current.organizations[1].display_name).toBe("Beta LLC");
  });

  it("surfaces errors via isError and keeps the list empty", async () => {
    mockGetUserOrganizations.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useOrganizations(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.organizations).toEqual([]);
  });
});
