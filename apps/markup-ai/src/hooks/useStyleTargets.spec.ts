import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStyleTargets } from "./useStyleTargets";
import type { TargetResponse } from "../api-client/types.gen";

vi.mock("./useApiClient", () => ({
  useApiClient: vi.fn(() => ({
    baseUrl: "https://api.example.com",
    auth: "test-token",
  })),
}));

// We build the query inline (no longer via the generated
// `styleAgentListStyleAgentTargetsOptions`) so the queryKey can include an auth
// fingerprint. Tests stub the SDK-level fetch instead.
const mockStyleAgentListTargets = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  styleAgentListStyleAgentTargets: (options: unknown): unknown =>
    mockStyleAgentListTargets(options),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function target(overrides: Partial<TargetResponse> = {}): TargetResponse {
  return {
    id: overrides.id ?? "t-1",
    display_name: overrides.display_name ?? "Guide 1",
    is_default: overrides.is_default ?? false,
    enabled: overrides.enabled ?? true,
  };
}

function mockTargets(targets: TargetResponse[]): void {
  mockStyleAgentListTargets.mockResolvedValue({ data: targets });
}

describe("useStyleTargets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cross-iframe localStorage cache so tests don't leak state.
    localStorage.clear();
  });

  it("returns empty targets and null default when no apiKey is provided (query disabled)", () => {
    const { result } = renderHook(() => useStyleTargets(), { wrapper: createWrapper() });
    expect(result.current.targets).toEqual([]);
    expect(result.current.defaultTargetId).toBeNull();
    expect(mockStyleAgentListTargets).not.toHaveBeenCalled();
  });

  it("exposes loaded targets and picks the is_default target as defaultTargetId", async () => {
    mockTargets([
      target({ id: "ap", display_name: "AP", is_default: false }),
      target({ id: "microsoft", display_name: "Microsoft", is_default: true }),
    ]);

    const { result } = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.targets.map((t) => t.id)).toEqual(["ap", "microsoft"]);
    expect(result.current.defaultTargetId).toBe("microsoft");
  });

  it("falls back to the first enabled target when no target is flagged default", async () => {
    mockTargets([
      target({ id: "disabled", enabled: false }),
      target({ id: "first-enabled", enabled: true }),
      target({ id: "second-enabled", enabled: true }),
    ]);

    const { result } = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.defaultTargetId).toBe("first-enabled");
  });

  it("returns defaultTargetId=null when the list is empty", async () => {
    mockTargets([]);
    const { result } = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.targets).toEqual([]);
    expect(result.current.defaultTargetId).toBeNull();
  });

  it("surfaces query errors via isError", async () => {
    mockStyleAgentListTargets.mockRejectedValue(new Error("401"));
    const { result } = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.targets).toEqual([]);
  });

  it("re-reads the cache and refetches when apiKey changes within the same hook instance", async () => {
    // user A has cached targets in localStorage (would normally come from a
    // prior fetch). We seed the cache directly to simulate that.
    const userATargets = [target({ id: "a-1", display_name: "User A guide", is_default: true })];
    const userBTargets = [target({ id: "b-1", display_name: "User B guide", is_default: true })];

    mockTargets(userATargets);
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(({ key }: { key: string }) => useStyleTargets(key), {
      wrapper,
      initialProps: { key: "tokenA" },
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.targets.map((t) => t.id)).toEqual(["a-1"]);

    // Simulate user B signing in within the same iframe. The cache for B
    // doesn't exist yet, so a fresh fetch must fire.
    mockStyleAgentListTargets.mockClear();
    mockTargets(userBTargets);
    rerender({ key: "tokenB" });

    await waitFor(() => {
      expect(result.current.targets.map((t) => t.id)).toEqual(["b-1"]);
    });
    expect(mockStyleAgentListTargets).toHaveBeenCalled();
  });

  it("caches an empty target list (so accounts with zero targets don't keep refetching)", async () => {
    mockTargets([]);

    // First mount triggers a fetch — empty array is now cached.
    const first = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(first.result.current.isLoading).toBe(false);
    });
    expect(mockStyleAgentListTargets).toHaveBeenCalledTimes(1);

    // A fresh mount in a different react tree (simulating another iframe)
    // hydrates from localStorage and skips the network entirely.
    mockStyleAgentListTargets.mockClear();
    const second = renderHook(() => useStyleTargets("token"), { wrapper: createWrapper() });
    expect(second.result.current.targets).toEqual([]);
    expect(mockStyleAgentListTargets).not.toHaveBeenCalled();
  });
});
