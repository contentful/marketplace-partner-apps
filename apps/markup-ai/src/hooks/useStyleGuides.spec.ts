import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStyleGuides } from "./useStyleGuides";
import type { TargetResponse } from "../api-client/types.gen";

vi.mock("./useApiClient", () => ({
  useApiClient: vi.fn(() => ({
    baseUrl: "https://api.example.com",
    auth: "test-token",
  })),
}));

// We build the query inline (no longer via the generated
// `internalListTargetsOptions`) so the queryKey can include an auth
// fingerprint. Tests stub the SDK-level fetch instead.
const mockInternalListTargets = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  internalListTargets: (options: unknown): unknown => mockInternalListTargets(options),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

function styleGuide(overrides: Partial<TargetResponse> = {}): TargetResponse {
  return {
    id: overrides.id ?? "t-1",
    display_name: overrides.display_name ?? "Guide 1",
    is_default: overrides.is_default ?? false,
    enabled: overrides.enabled ?? true,
  };
}

function mockStyleGuides(styleGuides: TargetResponse[]): void {
  mockInternalListTargets.mockResolvedValue({ data: styleGuides });
}

describe("useStyleGuides", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear the cross-iframe localStorage cache so tests don't leak state.
    localStorage.clear();
  });

  it("returns empty style guides and null default when no apiKey is provided (query disabled)", () => {
    const { result } = renderHook(() => useStyleGuides(), { wrapper: createWrapper() });
    expect(result.current.styleGuides).toEqual([]);
    expect(result.current.defaultStyleGuideId).toBeNull();
    expect(mockInternalListTargets).not.toHaveBeenCalled();
  });

  it("exposes loaded style guides and picks the is_default style guide as defaultStyleGuideId", async () => {
    mockStyleGuides([
      styleGuide({ id: "ap", display_name: "AP", is_default: false }),
      styleGuide({ id: "microsoft", display_name: "Microsoft", is_default: true }),
    ]);

    const { result } = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.styleGuides.map((g) => g.id)).toEqual(["ap", "microsoft"]);
    expect(result.current.defaultStyleGuideId).toBe("microsoft");
  });

  it("prefers a style guide named 'Main' over the API-default style guide", async () => {
    mockStyleGuides([
      styleGuide({ id: "ap", display_name: "AP", is_default: true }),
      styleGuide({ id: "main", display_name: "Main", is_default: false }),
    ]);

    const { result } = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.defaultStyleGuideId).toBe("main");
  });

  it("falls back to the first enabled style guide when no style guide is flagged default", async () => {
    mockStyleGuides([
      styleGuide({ id: "disabled", enabled: false }),
      styleGuide({ id: "first-enabled", enabled: true }),
      styleGuide({ id: "second-enabled", enabled: true }),
    ]);

    const { result } = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.defaultStyleGuideId).toBe("first-enabled");
  });

  it("returns defaultStyleGuideId=null when the list is empty", async () => {
    mockStyleGuides([]);
    const { result } = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.styleGuides).toEqual([]);
    expect(result.current.defaultStyleGuideId).toBeNull();
  });

  it("surfaces query errors via isError", async () => {
    mockInternalListTargets.mockRejectedValue(new Error("401"));
    const { result } = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.styleGuides).toEqual([]);
  });

  it("re-reads the cache and refetches when apiKey changes within the same hook instance", async () => {
    // user A has cached style guides in localStorage (would normally come from
    // a prior fetch). We seed the cache directly to simulate that.
    const userAStyleGuides = [
      styleGuide({ id: "a-1", display_name: "User A guide", is_default: true }),
    ];
    const userBStyleGuides = [
      styleGuide({ id: "b-1", display_name: "User B guide", is_default: true }),
    ];

    mockStyleGuides(userAStyleGuides);
    const wrapper = createWrapper();
    const { result, rerender } = renderHook(({ key }: { key: string }) => useStyleGuides(key), {
      wrapper,
      initialProps: { key: "tokenA" },
    });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.styleGuides.map((g) => g.id)).toEqual(["a-1"]);

    // Simulate user B signing in within the same iframe. The cache for B
    // doesn't exist yet, so a fresh fetch must fire.
    mockInternalListTargets.mockClear();
    mockStyleGuides(userBStyleGuides);
    rerender({ key: "tokenB" });

    await waitFor(() => {
      expect(result.current.styleGuides.map((g) => g.id)).toEqual(["b-1"]);
    });
    expect(mockInternalListTargets).toHaveBeenCalled();
  });

  it("caches an empty style guide list (so accounts with zero style guides don't keep refetching)", async () => {
    mockStyleGuides([]);

    // First mount triggers a fetch — empty array is now cached.
    const first = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });
    await waitFor(() => {
      expect(first.result.current.isLoading).toBe(false);
    });
    expect(mockInternalListTargets).toHaveBeenCalledTimes(1);

    // A fresh mount in a different react tree (simulating another iframe)
    // hydrates from localStorage and skips the network entirely.
    mockInternalListTargets.mockClear();
    const second = renderHook(() => useStyleGuides("token"), { wrapper: createWrapper() });
    expect(second.result.current.styleGuides).toEqual([]);
    expect(mockInternalListTargets).not.toHaveBeenCalled();
  });
});
