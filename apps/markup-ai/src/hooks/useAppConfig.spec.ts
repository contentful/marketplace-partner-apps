import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAppConfig } from "./useAppConfig";
import { fetchAppConfig } from "../services/configService";

// Mock the configService
vi.mock("../services/configService", () => ({
  fetchAppConfig: vi.fn(),
  getApiBaseUrl: vi.fn(() => "https://api.test.com"),
}));

const mockFetchAppConfig = vi.mocked(fetchAppConfig);

describe("useAppConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch config successfully", async () => {
    const mockConfig = {
      auth0: {
        domain: "test-domain.auth0.com",
        clientId: "test-client-id",
        audience: "test-audience",
      },
    };

    mockFetchAppConfig.mockResolvedValueOnce(mockConfig);

    const { result } = renderHook(() => useAppConfig());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBe(null);
    expect(mockFetchAppConfig).toHaveBeenCalled();
  });

  it("should handle fetch error", async () => {
    const errorMessage = "Failed to fetch config";
    mockFetchAppConfig.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() => useAppConfig());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe(errorMessage);
  });

  it("should handle non-Error exceptions", async () => {
    mockFetchAppConfig.mockRejectedValueOnce("String error");

    const { result } = renderHook(() => useAppConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.config).toBe(null);
    expect(result.current.error).toBe("Failed to fetch configuration");
  });

  it("should provide refetch function", async () => {
    const mockConfig = {
      auth0: {
        domain: "test-domain.auth0.com",
        clientId: "test-client-id",
        audience: "test-audience",
      },
    };

    mockFetchAppConfig.mockResolvedValue(mockConfig);

    const { result } = renderHook(() => useAppConfig());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.refetch).toBeInstanceOf(Function);

    // Test refetch
    mockFetchAppConfig.mockResolvedValueOnce({
      ...mockConfig,
      auth0: { ...mockConfig.auth0, domain: "new-domain.auth0.com" },
    });

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.config?.auth0.domain).toBe("new-domain.auth0.com");
    });

    expect(mockFetchAppConfig).toHaveBeenCalledTimes(2);
  });
});
