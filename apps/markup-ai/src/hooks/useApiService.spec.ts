import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useApiService, validateConfig } from "./useApiService";
import type { PlatformConfig } from "../types/content";
import { Dialects, Tones } from "../api-client/types.gen";
import { WORKFLOW_POLLING_INTERVAL, WORKFLOW_TIMEOUT } from "../constants/app";

// ============================================================================
// Test Helper Functions
// ============================================================================

/**
 * Helper to ignore promise rejections (for cleanup in tests)
 */
const ignorePromise = (promise: Promise<unknown>): void => {
  void promise.catch(() => {});
};

async function advanceAndExpectReject(
  promise: Promise<unknown>,
  message: string,
  ms: number,
): Promise<void> {
  const rejection = expect(promise).rejects.toThrow(message);
  await vi.advanceTimersByTimeAsync(ms);
  await rejection;
}

async function runWithFakeTimers<T>(fn: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    return await fn();
  } finally {
    vi.useRealTimers();
  }
}

/**
 * Helper to test that a function throws error for invalid config
 */
async function testInvalidConfig(
  fn: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  mockConfig: PlatformConfig,
) {
  const { result } = renderHook(() => useApiService({ ...mockConfig, apiKey: "" }));
  await expect(fn(result)).rejects.toThrow(
    "Configuration is missing. Please configure the app first.",
  );
}

/**
 * Helper to test mutation failure scenarios
 */
async function testMutationFailure(
  mutationMock: { mutateAsync: unknown },
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
) {
  const mutationError = new Error("Mutation failed");
  (mutationMock.mutateAsync as ReturnType<typeof vi.fn>).mockRejectedValue(mutationError);

  const { result } = renderHook(() => useApiService(config));
  await expect(methodCall(result)).rejects.toThrow("Mutation failed");
}

/**
 * Generic helper to test workflow rejection scenarios (failure or timeout)
 */
async function testWorkflowRejection(
  mutationMock: { mutateAsync: unknown },
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  options: {
    workflowId: string;
    workflowStatus: string;
    expectedError: string;
    timeoutMs: number;
  },
) {
  (mutationMock.mutateAsync as ReturnType<typeof vi.fn>).mockResolvedValue({
    workflow_id: options.workflowId,
  });
  queryMockFn.mockReturnValue({
    data: { workflow: { status: options.workflowStatus } },
  } as never);

  await runWithFakeTimers(async () => {
    const { result } = renderHook(() => useApiService(config));
    let promise: Promise<unknown> | undefined;
    await act(async () => {
      promise = methodCall(result);
      await Promise.resolve();
    });
    if (!promise) throw new Error("Promise was not assigned");
    await advanceAndExpectReject(promise, options.expectedError, options.timeoutMs);
  });
}

/**
 * Helper to test workflow failure scenarios
 */
async function testWorkflowFailure(
  mutationMock: { mutateAsync: unknown },
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  workflowId: string,
) {
  await testWorkflowRejection(mutationMock, queryMockFn, config, methodCall, {
    workflowId,
    workflowStatus: "failed",
    expectedError: "Workflow failed",
    timeoutMs: WORKFLOW_POLLING_INTERVAL + 100, // Wait for one polling cycle
  });
}

/**
 * Helper to test workflow timeout scenarios
 */
async function testWorkflowTimeout(
  mutationMock: { mutateAsync: unknown },
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  workflowId: string,
) {
  await testWorkflowRejection(mutationMock, queryMockFn, config, methodCall, {
    workflowId,
    workflowStatus: "running",
    expectedError: "Workflow timed out",
    timeoutMs: WORKFLOW_TIMEOUT + 10, // Wait for timeout
  });
}

/**
 * Helper to test workflow completion scenarios
 */
async function testWorkflowCompletion(
  mutationMock: { mutateAsync: unknown },
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  workflowId: string,
) {
  (mutationMock.mutateAsync as ReturnType<typeof vi.fn>).mockResolvedValue({
    workflow_id: workflowId,
  });
  queryMockFn.mockReturnValue({
    data: { workflow: { status: "completed" } },
    isLoading: false,
    error: null,
  } as never);

  await runWithFakeTimers(async () => {
    const { result } = renderHook(() => useApiService(config));
    let promise: Promise<unknown> | undefined;
    await act(async () => {
      promise = methodCall(result);
      await Promise.resolve();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(WORKFLOW_POLLING_INTERVAL + 100); // Wait for one polling cycle
    });
    if (!promise) throw new Error("Promise was not assigned");
    await expect(promise).resolves.toBeDefined();
  });
}

/**
 * Helper to test data fetch error scenarios (not loaded)
 */
async function testDataNotLoaded(
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  expectedError: string,
) {
  queryMockFn.mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
  } as never);

  const { result } = renderHook(() => useApiService(config));
  await expect(methodCall(result)).rejects.toThrow(expectedError);
}

/**
 * Helper to test data fetch error scenarios (query error)
 */
async function testQueryError(
  queryMockFn: ReturnType<typeof vi.fn>,
  config: PlatformConfig,
  methodCall: (
    result: ReturnType<
      typeof renderHook<ReturnType<typeof useApiService>, PlatformConfig>
    >["result"],
  ) => Promise<unknown>,
  errorMessage: string,
) {
  const queryError = new Error(errorMessage);
  queryMockFn.mockReturnValue({
    data: null,
    isLoading: false,
    error: queryError,
  } as never);

  const { result } = renderHook(() => useApiService(config));
  await expect(methodCall(result)).rejects.toThrow(errorMessage);
}

// Mock the hooks from useStyleAndBrandAgent
vi.mock("./useStyleAndBrandAgent", () => ({
  useGetAdminConstants: vi.fn(),
  useListStyleGuides: vi.fn(),
  useCreateStyleCheck: vi.fn(),
  useGetStyleCheck: vi.fn(),
  useCreateStyleRewrite: vi.fn(),
  useGetStyleRewrite: vi.fn(),
}));

import {
  useGetAdminConstants,
  useListStyleGuides,
  useCreateStyleCheck,
  useGetStyleCheck,
  useCreateStyleRewrite,
  useGetStyleRewrite,
} from "./useStyleAndBrandAgent";

describe("useApiService", () => {
  const mockConfig: PlatformConfig = {
    apiKey: "test-api-key",
    dialect: "american_english",
    tone: "professional",
    styleGuide: "test-style-guide",
  };

  const mockConstantsData = {
    dialects: ["american_english", "british_english"],
    tones: ["professional", "casual"],
    style_guides: { default: "Default Style Guide" },
  };

  const mockStyleGuidesData = [
    { id: "1", name: "Style Guide 1", created_at: "2023-01-01" },
    { id: "2", name: "Style Guide 2", created_at: "2023-01-02" },
  ];

  let mockCreateStyleCheckMutation: ReturnType<typeof useCreateStyleCheck>;
  let mockCreateStyleRewriteMutation: ReturnType<typeof useCreateStyleRewrite>;
  let mockCheckQuery: ReturnType<typeof useGetStyleCheck>;
  let mockRewriteQuery: ReturnType<typeof useGetStyleRewrite>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock create mutations
    const mutateAsyncCheckMock = vi.fn();
    mockCreateStyleCheckMutation = { mutateAsync: mutateAsyncCheckMock } as unknown as ReturnType<
      typeof useCreateStyleCheck
    >;

    const mutateAsyncRewriteMock = vi.fn();
    mockCreateStyleRewriteMutation = {
      mutateAsync: mutateAsyncRewriteMock,
    } as unknown as ReturnType<typeof useCreateStyleRewrite>;

    // Mock queries
    mockCheckQuery = { data: null, isLoading: false, error: null } as unknown as ReturnType<
      typeof useGetStyleCheck
    >;

    mockRewriteQuery = { data: null, isLoading: false, error: null } as unknown as ReturnType<
      typeof useGetStyleRewrite
    >;

    // Setup default mocks
    vi.mocked(useGetAdminConstants).mockReturnValue({
      data: mockConstantsData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetAdminConstants>);

    vi.mocked(useListStyleGuides).mockReturnValue({
      data: mockStyleGuidesData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useListStyleGuides>);

    vi.mocked(useCreateStyleCheck).mockReturnValue(mockCreateStyleCheckMutation);
    vi.mocked(useCreateStyleRewrite).mockReturnValue(mockCreateStyleRewriteMutation);
    vi.mocked(useGetStyleCheck).mockReturnValue(mockCheckQuery);
    vi.mocked(useGetStyleRewrite).mockReturnValue(mockRewriteQuery);
  });

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateConfig", () => {
    it("should not throw for valid config", () => {
      expect(() => {
        validateConfig(mockConfig);
      }).not.toThrow();
    });

    it("should throw for undefined config", () => {
      expect(() => {
        validateConfig(undefined);
      }).toThrow("Configuration is missing. Please configure the app first.");
    });

    it("should throw for config without apiKey", () => {
      const invalidConfig = { ...mockConfig, apiKey: "" };
      expect(() => {
        validateConfig(invalidConfig);
      }).toThrow("Configuration is missing. Please configure the app first.");
    });
  });

  describe("hook initialization", () => {
    it("should return correct initial state", () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toEqual({
        dialects: ["american_english", "british_english"],
        tones: ["professional", "casual"],
        style_guides: { default: "Default Style Guide" },
      });
      expect(result.current.styleGuides).toEqual(mockStyleGuidesData);
      expect(result.current.constantsLoading).toBe(false);
      expect(result.current.styleGuidesLoading).toBe(false);
      expect(result.current.constantsError).toBe(null);
      expect(result.current.styleGuidesError).toBe(null);
      expect(result.current.checkContent).toBeInstanceOf(Function);
      expect(result.current.contentRewrite).toBeInstanceOf(Function);
      expect(result.current.fetchAdminConstants).toBeInstanceOf(Function);
      expect(result.current.fetchStyleGuides).toBeInstanceOf(Function);
    });

    it("should handle loading states", () => {
      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      vi.mocked(useListStyleGuides).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useListStyleGuides>);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toBe(null);
      expect(result.current.styleGuides).toBe(null);
      expect(result.current.constantsLoading).toBe(true);
      expect(result.current.styleGuidesLoading).toBe(true);
    });

    it("should handle error states", () => {
      const constantsError = new Error("Constants error");
      const styleGuidesError = new Error("Style guides error");

      const constantsMockValue = {
        data: null,
        isLoading: false,
        error: constantsError,
      } as unknown as ReturnType<typeof useGetAdminConstants>;
      vi.mocked(useGetAdminConstants).mockReturnValue(constantsMockValue);

      const styleGuidesMockValue = {
        data: null,
        isLoading: false,
        error: styleGuidesError,
      } as unknown as ReturnType<typeof useListStyleGuides>;
      vi.mocked(useListStyleGuides).mockReturnValue(styleGuidesMockValue);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toBe(null);
      expect(result.current.styleGuides).toBe(null);
      expect(result.current.constantsError).toBe(constantsError);
      expect(result.current.styleGuidesError).toBe(styleGuidesError);
    });
  });

  describe("checkContent", () => {
    it("should throw error for invalid config", async () => {
      await testInvalidConfig((result) => result.current.checkContent("test content"), mockConfig);
    });

    it("should throw error when mutation fails", async () => {
      await testMutationFailure(mockCreateStyleCheckMutation, mockConfig, (result) =>
        result.current.checkContent("test content"),
      );
    });

    it("should call mutation with correct parameters", () => {
      (
        mockCreateStyleCheckMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        workflow_id: "check-workflow-123",
      });

      const { result } = renderHook(() => useApiService(mockConfig));

      // Start the check (this will timeout, but we can verify the mutation call)
      const checkPromise = result.current.checkContent("test content");

      // Verify the mutation was called with correct parameters
      expect(mockCreateStyleCheckMutation.mutateAsync).toHaveBeenCalled();
      const callArgs = (mockCreateStyleCheckMutation.mutateAsync as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as
        | { body: { dialect: string; tone: string; style_guide: string; file_upload: Blob } }
        | undefined;
      expect(callArgs?.body.dialect).toBe(Dialects.AMERICAN_ENGLISH);
      expect(callArgs?.body.tone).toBe(Tones.PROFESSIONAL);
      expect(callArgs?.body.style_guide).toBe("test-style-guide");
      expect(callArgs?.body.file_upload).toBeInstanceOf(Blob);

      // Clean up the promise to avoid unhandled rejection
      ignorePromise(checkPromise);
    });

    it("should use default values when config values are missing", () => {
      const configWithoutDefaults = {
        apiKey: "test-api-key",
        dialect: undefined,
        tone: undefined,
        styleGuide: undefined,
      };

      (
        mockCreateStyleCheckMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        workflow_id: "check-workflow-123",
      });

      const { result } = renderHook(() => useApiService(configWithoutDefaults));

      // Start the check (this will timeout, but we can verify the mutation call)
      const checkPromise = result.current.checkContent("test content");

      // Verify the mutation was called with default values
      expect(mockCreateStyleCheckMutation.mutateAsync).toHaveBeenCalled();
      const callArgs = (mockCreateStyleCheckMutation.mutateAsync as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as
        | { body: { dialect: string; tone: null; style_guide: string; file_upload: Blob } }
        | undefined;
      expect(callArgs?.body.dialect).toBe(Dialects.AMERICAN_ENGLISH);
      expect(callArgs?.body.tone).toBeNull();
      expect(callArgs?.body.style_guide).toBe("");
      expect(callArgs?.body.file_upload).toBeInstanceOf(Blob);

      // Clean up the promise to avoid unhandled rejection
      ignorePromise(checkPromise);
    });

    it("rejects when style check workflow fails", async () => {
      await testWorkflowFailure(
        mockCreateStyleCheckMutation,
        vi.mocked(useGetStyleCheck),
        mockConfig,
        (result) => result.current.checkContent("content"),
        "wf-fail",
      );
    });

    it("resolves when style check workflow completes", async () => {
      await testWorkflowCompletion(
        mockCreateStyleCheckMutation,
        vi.mocked(useGetStyleCheck),
        mockConfig,
        (result) => result.current.checkContent("content"),
        "wf-ok",
      );
    });

    it("rejects on timeout and clears workflow id", async () => {
      await testWorkflowTimeout(
        mockCreateStyleCheckMutation,
        vi.mocked(useGetStyleCheck),
        mockConfig,
        (result) => result.current.checkContent("content"),
        "wf-timeout",
      );
    });
  });

  describe("contentRewrite", () => {
    it("should throw error for invalid config", async () => {
      await testInvalidConfig(
        (result) => result.current.contentRewrite("test content"),
        mockConfig,
      );
    });

    it("should throw error when mutation fails", async () => {
      await testMutationFailure(mockCreateStyleRewriteMutation, mockConfig, (result) =>
        result.current.contentRewrite("test content"),
      );
    });

    it("should call mutation with correct parameters", () => {
      (
        mockCreateStyleRewriteMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>
      ).mockResolvedValue({
        workflow_id: "rewrite-workflow-456",
      });

      const { result } = renderHook(() => useApiService(mockConfig));

      // Start the rewrite (this will timeout, but we can verify the mutation call)
      const rewritePromise = result.current.contentRewrite("test content");

      // Verify the mutation was called with correct parameters
      expect(mockCreateStyleRewriteMutation.mutateAsync).toHaveBeenCalled();
      const callArgs = (mockCreateStyleRewriteMutation.mutateAsync as ReturnType<typeof vi.fn>).mock
        .calls[0]?.[0] as
        | { body: { dialect: string; tone: string; style_guide: string; file_upload: Blob } }
        | undefined;
      expect(callArgs?.body.dialect).toBe(Dialects.AMERICAN_ENGLISH);
      expect(callArgs?.body.tone).toBe(Tones.PROFESSIONAL);
      expect(callArgs?.body.style_guide).toBe("test-style-guide");
      expect(callArgs?.body.file_upload).toBeInstanceOf(Blob);

      // Clean up the promise to avoid unhandled rejection
      ignorePromise(rewritePromise);
    });

    it("rejects when rewrite workflow fails", async () => {
      await testWorkflowFailure(
        mockCreateStyleRewriteMutation,
        vi.mocked(useGetStyleRewrite),
        mockConfig,
        (result) => result.current.contentRewrite("content"),
        "rw-fail",
      );
    });

    it("resolves when rewrite workflow completes", async () => {
      await testWorkflowCompletion(
        mockCreateStyleRewriteMutation,
        vi.mocked(useGetStyleRewrite),
        mockConfig,
        (result) => result.current.contentRewrite("content"),
        "rw-ok",
      );
    });

    it("rejects on timeout and clears rewrite workflow id", async () => {
      await testWorkflowTimeout(
        mockCreateStyleRewriteMutation,
        vi.mocked(useGetStyleRewrite),
        mockConfig,
        (result) => result.current.contentRewrite("content"),
        "rw-timeout",
      );
    });
  });

  describe("fetchAdminConstants", () => {
    it("should return constants when loaded", async () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      const constants = await result.current.fetchAdminConstants();

      expect(constants).toEqual({
        dialects: ["american_english", "british_english"],
        tones: ["professional", "casual"],
        style_guides: { default: "Default Style Guide" },
      });
    });

    it("should throw error for invalid config", async () => {
      await testInvalidConfig((result) => result.current.fetchAdminConstants(), mockConfig);
    });

    it("should throw error when constants are not loaded", async () => {
      await testDataNotLoaded(
        vi.mocked(useGetAdminConstants),
        mockConfig,
        (result) => result.current.fetchAdminConstants(),
        "Constants not loaded",
      );
    });

    it("should throw error when constants query has error", async () => {
      await testQueryError(
        vi.mocked(useGetAdminConstants),
        mockConfig,
        (result) => result.current.fetchAdminConstants(),
        "Constants error",
      );
    });
  });

  describe("fetchStyleGuides", () => {
    it("should return style guides when loaded", async () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      const styleGuides = await result.current.fetchStyleGuides();

      expect(styleGuides).toEqual(mockStyleGuidesData);
    });

    it("should throw error for invalid config", async () => {
      await testInvalidConfig((result) => result.current.fetchStyleGuides(), mockConfig);
    });

    it("should throw error when style guides are not loaded", async () => {
      await testDataNotLoaded(
        vi.mocked(useListStyleGuides),
        mockConfig,
        (result) => result.current.fetchStyleGuides(),
        "Style guides not loaded",
      );
    });

    it("should throw error when style guides query has error", async () => {
      await testQueryError(
        vi.mocked(useListStyleGuides),
        mockConfig,
        (result) => result.current.fetchStyleGuides(),
        "Style guides error",
      );
    });
  });

  describe("data transformation", () => {
    it("should handle missing data in constants response", () => {
      const incompleteConstantsData = {
        dialects: undefined,
        tones: undefined,
        style_guides: undefined,
      };

      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: incompleteConstantsData,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toEqual({
        dialects: [],
        tones: [],
        style_guides: {},
      });
    });
  });
});
