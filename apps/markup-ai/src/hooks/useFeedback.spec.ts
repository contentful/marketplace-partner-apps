import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFeedback, SubmitFeedbackParams } from "./useFeedback";

// Mock the API client
vi.mock("./useApiClient", () => ({
  useApiClient: vi.fn(() => ({
    baseUrl: "https://api.example.com",
    auth: "test-token",
  })),
}));

// Capture the mutation call to verify payload formatting
const mockMutateAsync = vi.fn();

vi.mock("../api-client/@tanstack/react-query.gen", () => ({
  internalSubmitFeedbackMutation: vi.fn(() => ({
    mutationFn: mockMutateAsync,
  })),
}));

// Wrapper for react-query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useFeedback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ success: true });
  });

  it("returns the expected interface", () => {
    const { result } = renderHook(() => useFeedback(), {
      wrapper: createWrapper(),
    });

    expect(result.current.submitFeedback).toBeDefined();
    expect(typeof result.current.submitFeedback).toBe("function");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSuccess).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.reset).toBeDefined();
  });

  describe("submitFeedback payload formatting", () => {
    it("transforms camelCase params to snake_case body fields", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const params: SubmitFeedbackParams = {
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: true,
        feedback: "Great suggestion!",
        original: "Original text",
        suggestion: "Suggested text",
        category: "grammar",
      };

      await result.current.submitFeedback(params);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          workflow_id: "wf-123",
          request_id: "req-456",
          helpful: true,
          feedback: "Great suggestion!",
          original: "Original text",
          suggestion: "Suggested text",
          category: "grammar",
        },
      });
    });

    it("normalizes undefined optional fields to null", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const params: SubmitFeedbackParams = {
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: false,
        // optional fields omitted
      };

      await result.current.submitFeedback(params);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          workflow_id: "wf-123",
          request_id: "req-456",
          helpful: false,
          feedback: null,
          original: null,
          suggestion: null,
          category: null,
        },
      });
    });

    it("normalizes empty string optional fields to null", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const params: SubmitFeedbackParams = {
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: true,
        feedback: "",
        original: "",
        suggestion: "",
        category: "",
      };

      await result.current.submitFeedback(params);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          workflow_id: "wf-123",
          request_id: "req-456",
          helpful: true,
          feedback: null,
          original: null,
          suggestion: null,
          category: null,
        },
      });
    });

    it("preserves helpful=false correctly", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const params: SubmitFeedbackParams = {
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: false,
        feedback: "Not helpful because...",
      };

      await result.current.submitFeedback(params);

      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          workflow_id: "wf-123",
          request_id: "req-456",
          helpful: false,
          feedback: "Not helpful because...",
          original: null,
          suggestion: null,
          category: null,
        },
      });
    });

    it("handles whitespace-only feedback as valid content", async () => {
      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const params: SubmitFeedbackParams = {
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: true,
        feedback: "   ", // whitespace only
      };

      await result.current.submitFeedback(params);

      // Whitespace-only strings are truthy, so they're preserved
      expect(mockMutateAsync).toHaveBeenCalledWith({
        body: {
          workflow_id: "wf-123",
          request_id: "req-456",
          helpful: true,
          feedback: "   ",
          original: null,
          suggestion: null,
          category: null,
        },
      });
    });
  });

  describe("mutation state handling", () => {
    it("calls mutateAsync when submitFeedback is invoked", async () => {
      mockMutateAsync.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      await result.current.submitFeedback({
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: true,
      });

      // Verify the mutation was called
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    it("returns the mutation result on success", async () => {
      const mockResponse = { id: "feedback-123", created: true };
      mockMutateAsync.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      const submitPromise = result.current.submitFeedback({
        workflowId: "wf-123",
        requestId: "req-456",
        helpful: true,
      });

      await expect(submitPromise).resolves.toEqual(mockResponse);
    });

    it("throws on mutation error", async () => {
      const mockError = new Error("API error");
      mockMutateAsync.mockRejectedValue(mockError);

      const { result } = renderHook(() => useFeedback(), {
        wrapper: createWrapper(),
      });

      await expect(
        result.current.submitFeedback({
          workflowId: "wf-123",
          requestId: "req-456",
          helpful: true,
        }),
      ).rejects.toThrow("API error");
    });
  });
});
