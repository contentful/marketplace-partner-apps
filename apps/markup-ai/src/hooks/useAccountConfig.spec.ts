import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccountConfig } from "./useAccountConfig";
import { StyleAgentMode } from "../api-client/types.gen";

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

const mockStyleAgentGetConfig = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  styleAgentGetStyleAgentConfig: (options: unknown): unknown => mockStyleAgentGetConfig(options),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe("useAccountConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: "test-token" });
  });

  it("returns null config without firing the request when unauthenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, token: null });
    const { result } = renderHook(() => useAccountConfig(), { wrapper: createWrapper() });
    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockStyleAgentGetConfig).not.toHaveBeenCalled();
  });

  it("does not fire the request during the auth tick when token is not yet populated", () => {
    // Silent-restore in AuthContext briefly has isAuthenticated=true with
    // token=null. We must not 401 in that window.
    mockUseAuth.mockReturnValue({ isAuthenticated: true, token: null });
    const { result } = renderHook(() => useAccountConfig(), { wrapper: createWrapper() });
    expect(result.current.config).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockStyleAgentGetConfig).not.toHaveBeenCalled();
  });

  it("exposes the loaded config when authenticated", async () => {
    mockStyleAgentGetConfig.mockResolvedValue({
      data: {
        is_acrolinx_classic: false,
        style_agent: StyleAgentMode.ENABLED,
        style_agent_numeric_scoring: false,
      },
    });
    const { result } = renderHook(() => useAccountConfig(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.config?.style_agent).toBe(StyleAgentMode.ENABLED);
  });

  it("surfaces errors via isError and keeps config null (fail-open)", async () => {
    mockStyleAgentGetConfig.mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useAccountConfig(), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.config).toBeNull();
  });
});
