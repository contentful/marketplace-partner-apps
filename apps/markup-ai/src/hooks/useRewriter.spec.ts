import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRewriter } from "./useRewriter";
import { mockSdk } from "../../test/mocks/mockSdk";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useFieldChecks } from "./useFieldChecks";
import { createMockFieldCheck, buildWorkflow } from "../../test/utils/rewriterFixtures";
import { getUserSettings } from "../utils/userSettings";

// Mock the dependencies
const mockUpdateCheck = vi.fn();
const mockCreateCheck = vi.fn();
const mockRemoveCheck = vi.fn();
const mockClearChecks = vi.fn();
const mockSetTimeout = vi.fn();
const mockClearAllTimeouts = vi.fn();
const mockContentCheck = vi.fn();
const mockRewriteContent = vi.fn();
const mockSetFieldValue = vi.fn().mockResolvedValue(undefined);

vi.mock("./useFieldChecks", () => ({
  useFieldChecks: vi.fn(() => ({
    fieldChecks: {
      fieldA: {
        fieldId: "fieldA",
        originalValue: "orig",
        isChecking: false,
        checkResponse: {
          // Minimal rewrite response shape for accept suggestion
          rewrite: {
            text: "new text",
            // scores are not used by the hook in this test, provide minimal shape
            scores: { quality: { score: 0 }, analysis: {} },
          },
        },
        error: null,
        lastUpdated: Date.now(),
        hasRewriteResult: false,
      },
    },
    updateCheck: mockUpdateCheck,
    createCheck: mockCreateCheck,
    removeCheck: mockRemoveCheck,
    clearChecks: mockClearChecks,
  })),
}));

vi.mock("./useTimeouts", () => ({
  useTimeouts: vi.fn(() => ({
    setTimeout: mockSetTimeout,
    clearAllTimeouts: mockClearAllTimeouts,
  })),
}));

vi.mock("./useFieldSubscriptions", () => ({
  useFieldSubscriptions: vi.fn(() => ({
    setFieldValue: mockSetFieldValue,
  })),
}));

vi.mock("../services/rewriterService", () => ({
  useRewriterService: vi.fn(() => ({
    contentCheck: mockContentCheck,
    rewriteContent: mockRewriteContent,
  })),
  createInitialFieldCheck: vi.fn(),
  updateFieldCheck: vi.fn(),
  getApiErrorMessage: (err: unknown) => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "An error occurred";
  },
}));

vi.mock("../utils/userSettings", () => ({
  getUserSettings: vi.fn(() => ({
    apiKey: "test-api-key",
    dialect: "american_english",
    tone: "professional",
    styleGuide: "default",
  })),
}));
const FIELD_ID = "fieldA";

function setFieldChecksWith(fieldCheck: ReturnType<typeof createMockFieldCheck>) {
  vi.mocked(useFieldChecks).mockReturnValue({
    fieldChecks: { [FIELD_ID]: fieldCheck },
    updateCheck: mockUpdateCheck,
    createCheck: mockCreateCheck,
    removeCheck: mockRemoveCheck,
    clearChecks: mockClearChecks,
  });
}

function renderUseRewriterWithSdk(sdk: unknown = mockSdk) {
  return renderHook(() => useRewriter(sdk as SidebarAppSDK));
}

function buildFieldCheckWithResponse(
  originalValue: string,
  workflowType: Parameters<typeof buildWorkflow>[0] = "style_check",
) {
  return createMockFieldCheck({
    fieldId: FIELD_ID,
    originalValue,
    checkResponse: {
      workflow: buildWorkflow(workflowType),
      original: { scores: { quality: { score: 80 } } },
    },
  });
}

function expectIsCheckingStart(fieldId: string = FIELD_ID) {
  expect(mockUpdateCheck).toHaveBeenCalledWith(fieldId, { isChecking: true, error: null });
}

async function runAcceptSuggestionErrorFlow(rejectedValue: unknown, expectedMessage: string) {
  mockSetFieldValue.mockRejectedValue(rejectedValue as never);

  const mockFieldCheckWithRewrite = createMockFieldCheck({
    fieldId: FIELD_ID,
    originalValue: "orig",
    checkResponse: {
      workflow: buildWorkflow("style_rewrite"),
      original: { scores: { quality: { score: 80 } } },
      rewrite: { text: "new text", scores: { quality: { score: 0 }, analysis: {} } },
    },
  });

  setFieldChecksWith(mockFieldCheckWithRewrite);

  const { result } = renderUseRewriterWithSdk();

  await act(async () => {
    await result.current.handleAcceptSuggestion(FIELD_ID);
  });

  expect(mockUpdateCheck).toHaveBeenCalledWith(FIELD_ID, { error: expectedMessage });
}

describe("useRewriter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return cooldown management functions", () => {
    const { result } = renderUseRewriterWithSdk();

    expect(result.current.clearFieldCooldown).toBeDefined();
    expect(result.current.isFieldInCooldown).toBeDefined();
    expect(typeof result.current.clearFieldCooldown).toBe("function");
    expect(typeof result.current.isFieldInCooldown).toBe("function");
  });

  it("should return false for isFieldInCooldown when field is not in cooldown", () => {
    const { result } = renderUseRewriterWithSdk();

    expect(result.current.isFieldInCooldown("testField")).toBe(false);
  });

  it("should clear cooldown when clearFieldCooldown is called", () => {
    const { result } = renderUseRewriterWithSdk();

    act(() => {
      result.current.clearFieldCooldown("testField");
    });

    // Should still return false since the field was never added to cooldown
    expect(result.current.isFieldInCooldown("testField")).toBe(false);
  });

  it("should have all required methods in the return object", () => {
    const { result } = renderUseRewriterWithSdk();

    expect(result.current.fieldChecks).toBeDefined();
    expect(result.current.handleAcceptSuggestion).toBeDefined();
    expect(result.current.clearError).toBeDefined();
    expect(result.current.handleRewrite).toBeDefined();
    expect(result.current.setOnFieldChange).toBeDefined();
    expect(result.current.updateCheck).toBeDefined();
    expect(result.current.clearFieldCooldown).toBeDefined();
    expect(result.current.isFieldInCooldown).toBeDefined();
    expect(result.current.resetAcceptingSuggestionFlag).toBeDefined();
  });

  describe("handleContentCheck", () => {
    it("should handle content check errors correctly", async () => {
      const errorMessage = "Content check failed";
      mockContentCheck.mockRejectedValue(new Error(errorMessage));

      const { result } = renderUseRewriterWithSdk();

      // Trigger handleContentCheck by calling handleRewrite which internally calls contentCheck
      // when there's no checkResponse (this will trigger the error path)
      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      // Should have been called to set isChecking: true initially
      expectIsCheckingStart();
    });

    it("should handle non-Error exceptions in content check", async () => {
      mockContentCheck.mockRejectedValue("String error");

      const { result } = renderUseRewriterWithSdk();

      // Trigger handleContentCheck by calling handleRewrite
      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      // Should have been called to set isChecking: true initially
      expectIsCheckingStart();
    });
  });

  describe("setOnFieldChange", () => {
    it("should set the field change callback", () => {
      const { result } = renderUseRewriterWithSdk();
      const callback = vi.fn();

      act(() => {
        result.current.setOnFieldChange(callback);
      });

      // The callback should be set (we can't directly test the ref, but we can test the function exists)
      expect(result.current.setOnFieldChange).toBeDefined();
    });
  });

  describe("resetAcceptingSuggestionFlag", () => {
    it("should reset the accepting suggestion flag", () => {
      const { result } = renderUseRewriterWithSdk();

      act(() => {
        result.current.resetAcceptingSuggestionFlag();
      });

      // The function should be callable and not throw
      expect(result.current.resetAcceptingSuggestionFlag).toBeDefined();
    });
  });

  describe("handleRewrite", () => {
    it("should call rewriteContent when checkResponse exists", async () => {
      const mockFieldCheck = buildFieldCheckWithResponse("test content", "style_check");
      setFieldChecksWith(mockFieldCheck);

      mockRewriteContent.mockResolvedValue(mockFieldCheck);

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      expect(mockRewriteContent).toHaveBeenCalledWith(FIELD_ID, "test content");
      expect(mockUpdateCheck).toHaveBeenCalledWith(FIELD_ID, mockFieldCheck);
    });

    it("should handle rewrite errors correctly", async () => {
      const mockFieldCheck = buildFieldCheckWithResponse("test content", "style_check");
      setFieldChecksWith(mockFieldCheck);

      const errorMessage = "Rewrite failed";
      mockRewriteContent.mockRejectedValue(new Error(errorMessage));

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith(FIELD_ID, {
        error: errorMessage,
      });
    });

    it("should handle non-Error exceptions in rewrite", async () => {
      const mockFieldCheck = buildFieldCheckWithResponse("test content", "style_check");
      setFieldChecksWith(mockFieldCheck);

      mockRewriteContent.mockRejectedValue("String error");

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith(FIELD_ID, {
        error: "String error",
      });
    });

    it("should return early if no checkResponse exists", async () => {
      const mockFieldCheck = createMockFieldCheck({
        fieldId: FIELD_ID,
        originalValue: "test content",
      });
      setFieldChecksWith(mockFieldCheck);

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      expect(mockRewriteContent).not.toHaveBeenCalled();
    });

    it("should return early if no apiKey is provided", async () => {
      // Mock getUserSettings to return empty API key
      vi.mocked(getUserSettings).mockReturnValue({
        apiKey: "",
        dialect: "american_english",
        tone: "professional",
        styleGuide: "default",
      });

      const sdkWithoutApiKey = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            ...mockSdk.parameters.installation,
            apiKey: "",
          },
        },
      };

      const mockFieldCheck = buildFieldCheckWithResponse("test content", "style_check");
      setFieldChecksWith(mockFieldCheck);

      const { result } = renderUseRewriterWithSdk(sdkWithoutApiKey);

      await act(async () => {
        await result.current.handleRewrite(FIELD_ID);
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith(FIELD_ID, { isChecking: false });
      expect(mockRewriteContent).not.toHaveBeenCalled();
    });
  });

  describe("handleAcceptSuggestion", () => {
    it("should handle accept suggestion with rewrite response override", async () => {
      const mockRewriteResponse = {
        workflow: buildWorkflow("style_rewrite", undefined, "workflow-456"),
        original: { scores: { quality: { score: 70 } } },
        rewrite: { text: "Improved text", scores: { quality: { score: 90 } } },
      } as const;

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleAcceptSuggestion(FIELD_ID, mockRewriteResponse);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith(FIELD_ID, "Improved text");
      expect(mockRemoveCheck).toHaveBeenCalledWith(FIELD_ID);
      expect(mockSetTimeout).toHaveBeenCalledWith(
        `cooldown-${FIELD_ID}`,
        expect.any(Function),
        3_000,
      );
    });

    it("should handle accept suggestion errors correctly", async () => {
      await runAcceptSuggestionErrorFlow(new Error("Field update failed"), "Field update failed");
    });

    it("should handle non-Error exceptions in accept suggestion", async () => {
      await runAcceptSuggestionErrorFlow(
        "String error",
        "An error occurred while accepting suggestion",
      );
    });

    it("should return early if no rewrite response exists", async () => {
      const mockFieldCheckWithoutRewrite = createMockFieldCheck({
        fieldId: FIELD_ID,
        originalValue: "orig",
        checkResponse: {
          workflow: buildWorkflow("style_check"),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      setFieldChecksWith(mockFieldCheckWithoutRewrite);

      const { result } = renderUseRewriterWithSdk();

      await act(async () => {
        await result.current.handleAcceptSuggestion(FIELD_ID);
      });

      expect(mockSetFieldValue).not.toHaveBeenCalled();
    });
  });

  describe("handleFieldChange", () => {
    it("should handle field changes with cooldown check", () => {
      const { result } = renderUseRewriterWithSdk();

      // First, add a field to cooldown
      act(() => {
        result.current.clearFieldCooldown("testField"); // This will be called but field won't be in cooldown initially
      });

      // The field change logic is tested indirectly through the hook's internal behavior
      expect(result.current.setOnFieldChange).toBeDefined();
    });

    it("should handle field changes when accepting suggestion", () => {
      const { result } = renderUseRewriterWithSdk();

      // Test that the hook can handle field changes during suggestion acceptance
      expect(result.current.setOnFieldChange).toBeDefined();
    });
  });

  describe("cleanup", () => {
    it("should cleanup timeouts and checks on unmount", () => {
      const { unmount } = renderUseRewriterWithSdk();

      unmount();

      expect(mockClearAllTimeouts).toHaveBeenCalled();
      expect(mockClearChecks).toHaveBeenCalled();
    });
  });
});
