import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { act } from "react";
import { render, screen, fireEvent, waitFor } from "../../../test/utils/testUtils";
import Dialog from "./Dialog";
import { useSDK } from "@contentful/react-apps-toolkit";
import { mockSdk } from "../../../test/mocks/mockSdk";
import { WorkflowStatus } from "../../api-client/types.gen";

// Mock the SDK
vi.mock("@contentful/react-apps-toolkit", () => ({
  useSDK: vi.fn(),
}));

// Mock the rewriter service
vi.mock("../../services/rewriterService", () => ({
  useRewriterService: vi.fn(() => ({
    rewriteContent: vi.fn(),
  })),
}));

import { useRewriterService } from "../../services/rewriterService";

describe("Dialog", () => {
  const mockContentCheck = vi.fn();
  const mockRewriteContent = vi.fn();
  const mockSdkInstance = {
    ...mockSdk,
    parameters: {
      invocation: {
        fieldId: "field1",
        original: "Original text",
        originalScore: 75,
        startRewrite: true,
        previewFormat: "markdown" as const,
      },
      installation: {
        apiKey: "dummy-key",
      },
    },
  };

  const mockFieldCheck = {
    fieldId: "field1",
    originalValue: "Original text",
    isChecking: false,
    checkResponse: {
      workflow_id: "workflow-123",
      status: WorkflowStatus.COMPLETED,
      original: {
        scores: {
          quality: { score: 75 },
          analysis: { clarity: { score: 70 } },
        },
      },
      rewrite: {
        text: "Improved text",
        scores: {
          quality: { score: 85 },
          analysis: { clarity: { score: 80 } },
        },
      },
      workflow: {
        id: "workflow-123",
        status: "completed",
      },
      config: {
        dialect: "american_english",
        tone: "professional",
        style_guide: "default",
      },
    },
    error: null,
    lastUpdated: Date.now(),
    hasRewriteResult: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as Mock).mockReturnValue(mockSdkInstance);
    vi.mocked(useRewriterService).mockReturnValue({
      contentCheck: mockContentCheck,
      rewriteContent: mockRewriteContent,
    });

    // Mock localStorage
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: vi.fn((key: string) => {
          if (key === "markupai.dialect") return "american_english";
          if (key === "markupai.tone") return "professional";
          if (key === "markupai.styleGuide") return "default";
          return null;
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      },
      writable: true,
    });
  });

  it("renders loading state when startRewrite is true", () => {
    mockRewriteContent.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dialog />);

    expect(screen.getByText("Markup AI is rewriting the content")).toBeInTheDocument();
    expect(mockRewriteContent).toHaveBeenCalledWith("field1", "Original text");
  });

  it("renders error state when rewrite fails", async () => {
    const errorMessage = "Rewrite failed";
    mockRewriteContent.mockRejectedValue(new Error(errorMessage));

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("renders success state with improvement summary when rewrite succeeds", async () => {
    mockRewriteContent.mockResolvedValue(mockFieldCheck);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("Improvement Summary")).toBeInTheDocument();
    });
    expect(screen.getByText("Accept & Insert")).toBeInTheDocument();
    expect(screen.getByText("Reject & Close")).toBeInTheDocument();
  });

  it("calls SDK close with correct parameters on accept", async () => {
    mockRewriteContent.mockResolvedValue(mockFieldCheck);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("Accept & Insert")).toBeInTheDocument();
    });

    const acceptButton = screen.getByText("Accept & Insert");
    act(() => {
      fireEvent.click(acceptButton);
    });

    expect(mockSdk.close).toHaveBeenCalledWith({
      accepted: true,
      value: mockFieldCheck.checkResponse.rewrite,
      fieldId: "field1",
      rewriteResponse: mockFieldCheck.checkResponse,
    });
  });

  it("calls SDK close with correct parameters on reject", async () => {
    mockRewriteContent.mockResolvedValue(mockFieldCheck);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("Reject & Close")).toBeInTheDocument();
    });

    const rejectButton = screen.getByText("Reject & Close");
    act(() => {
      fireEvent.click(rejectButton);
    });

    expect(mockSdk.close).toHaveBeenCalledWith({ accepted: false });
  });

  it("handles rewrite again button click", async () => {
    mockRewriteContent.mockResolvedValue(mockFieldCheck);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("Improvement Summary")).toBeInTheDocument();
    });

    const rewriteAgainButton = screen.getByText("Retry");
    act(() => {
      fireEvent.click(rewriteAgainButton);
    });

    expect(mockRewriteContent).toHaveBeenCalledTimes(2);
  });

  it("handles retry button click in error state", async () => {
    const errorMessage = "Rewrite failed";
    mockRewriteContent.mockRejectedValue(new Error(errorMessage));

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    const retryButton = screen.getByText("Retry");
    act(() => {
      fireEvent.click(retryButton);
    });

    expect(mockRewriteContent).toHaveBeenCalledTimes(2);
  });

  it("updates window height when loading state changes", () => {
    mockRewriteContent.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<Dialog />);

    expect(mockSdk.window.updateHeight).toHaveBeenCalled();
  });

  it("handles case when no rewrite result is received", async () => {
    const fieldCheckWithoutRewrite = {
      ...mockFieldCheck,
      hasRewriteResult: false,
      checkResponse: null,
    };
    mockRewriteContent.mockResolvedValue(fieldCheckWithoutRewrite);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("No rewrite result received")).toBeInTheDocument();
    });
  });

  it("handles case when rewrite response is missing", async () => {
    const fieldCheckWithoutResponse = {
      ...mockFieldCheck,
      checkResponse: null,
    };
    mockRewriteContent.mockResolvedValue(fieldCheckWithoutResponse);

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("No rewrite result received")).toBeInTheDocument();
    });
  });

  it("handles non-Error exceptions", async () => {
    mockRewriteContent.mockRejectedValue("String error");

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("An error occurred while rewriting content")).toBeInTheDocument();
    });
  });

  it("does not start rewrite when startRewrite is false", () => {
    const sdkWithoutStartRewrite = {
      ...mockSdkInstance,
      parameters: {
        ...mockSdkInstance.parameters,
        invocation: {
          ...mockSdkInstance.parameters.invocation,
          startRewrite: false,
        },
      },
    };
    (useSDK as Mock).mockReturnValue(sdkWithoutStartRewrite);

    render(<Dialog />);

    expect(mockRewriteContent).not.toHaveBeenCalled();
  });

  it("uses localStorage values for configuration", () => {
    const getItemMock = vi.fn((key: string) => {
      if (key === "markupai.dialect") return "american_english";
      if (key === "markupai.tone") return "professional";
      if (key === "markupai.styleGuide") return "default";
      return null;
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: { getItem: getItemMock },
      writable: true,
    });
    act(() => {
      render(<Dialog />);
    });
    expect(getItemMock).toHaveBeenCalledWith("markupai.dialect");
    expect(getItemMock).toHaveBeenCalledWith("markupai.tone");
    expect(getItemMock).toHaveBeenCalledWith("markupai.styleGuide");
  });

  it("handles missing fieldId gracefully", async () => {
    const sdkWithoutFieldId = {
      ...mockSdkInstance,
      parameters: {
        ...mockSdkInstance.parameters,
        invocation: {
          ...mockSdkInstance.parameters.invocation,
          fieldId: undefined,
        },
      },
    };
    (useSDK as Mock).mockReturnValue(sdkWithoutFieldId);

    mockRewriteContent.mockRejectedValue(new Error("Field ID is required"));

    render(<Dialog />);

    await waitFor(() => {
      expect(screen.getByText("Field ID is required")).toBeInTheDocument();
    });
  });
});
