import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useAgenticScan } from "./useAgenticScan";

const STYLE_BACKEND_ID = "ag_vYCPHsSQnnJj";

const mockClient = {
  getConfig: () => ({ baseUrl: "https://api.example.com" }),
};
vi.mock("./useApiClient", () => ({
  useApiClient: (): unknown => mockClient,
}));

const mockGetAccessToken = vi.fn(() => Promise.resolve("test-token"));
vi.mock("../contexts/AuthContext", () => ({
  useAuth: (): unknown => ({ getAccessToken: mockGetAccessToken }),
}));

const mockCortexAgentsRunAgent = vi.fn();
const mockCortexWorkflowsCancelWorkflow = vi.fn();
vi.mock("../api-client/sdk.gen", () => ({
  cortexAgentsRunAgent: (opts: unknown): unknown => mockCortexAgentsRunAgent(opts),
  cortexWorkflowsCancelWorkflow: (opts: unknown): unknown =>
    mockCortexWorkflowsCancelWorkflow(opts),
}));

// SSE mock: drains queued events to onMessage, then resolves immediately.
// Tests that need to hold the stream open (cancel / unmount) call `holdStreamOpen()` first.
let queuedSseEvents: Array<Record<string, unknown>> = [];
let extraRawSseMessages: string[] = [];
let hangStream = false;
let activeSignal: AbortSignal | null = null;
let streamResolver: (() => void) | null = null;

function queueSseEvents(events: Array<Record<string, unknown>>): void {
  queuedSseEvents.push(...events);
}

function queueRawSseMessages(raws: string[]): void {
  extraRawSseMessages.push(...raws);
}

function holdStreamOpen(): void {
  hangStream = true;
}

function endStream(): void {
  streamResolver?.();
  streamResolver = null;
}

const mockFetchEventSource = vi.fn(
  async ({
    onMessage,
    signal,
  }: {
    onMessage: (raw: string) => void;
    signal?: AbortSignal;
  }): Promise<void> => {
    activeSignal = signal ?? null;
    // Deliver raw (potentially malformed) messages first so terminal events
    // queued after them — like completion — don't short-circuit handleStreamMessage.
    for (const raw of extraRawSseMessages) {
      onMessage(raw);
    }
    for (const event of queuedSseEvents) {
      onMessage(JSON.stringify(event));
    }
    queuedSseEvents = [];
    extraRawSseMessages = [];
    if (hangStream) {
      return new Promise<void>((resolve) => {
        streamResolver = resolve;
      });
    }
  },
);
vi.mock("../agents/fetchEventSource", () => ({
  fetchEventSource: (opts: unknown): unknown => mockFetchEventSource(opts as never),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAccessToken.mockResolvedValue("test-token");
  mockCortexAgentsRunAgent.mockResolvedValue({ data: { workflow_id: "wf-abc" } });
  mockCortexWorkflowsCancelWorkflow.mockResolvedValue({});
  queuedSseEvents = [];
  extraRawSseMessages = [];
  hangStream = false;
  activeSignal = null;
  streamResolver = null;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAgenticScan — initial state", () => {
  it("returns idle state with no issues / no workflow", () => {
    const { result } = renderHook(() => useAgenticScan("api-key"));
    expect(result.current.scanState).toBe("idle");
    expect(result.current.issues).toEqual([]);
    expect(result.current.workflowId).toBeNull();
    expect(result.current.scanInFlight).toBe(false);
    expect(result.current.completedAgents.size).toBe(0);
  });
});

describe("useAgenticScan — prepareScan", () => {
  it("transitions to scanning and clears prior state", () => {
    const { result } = renderHook(() => useAgenticScan("api-key"));
    act(() => {
      result.current.prepareScan();
    });
    expect(result.current.scanState).toBe("scanning");
    expect(result.current.scanInFlight).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.issues).toEqual([]);
  });

  it("is a no-op if a scan is already in flight", () => {
    const { result } = renderHook(() => useAgenticScan("api-key"));
    act(() => {
      result.current.prepareScan();
    });
    const stateBefore = result.current.scanState;
    act(() => {
      result.current.prepareScan();
    });
    expect(result.current.scanState).toBe(stateBefore);
  });
});

describe("useAgenticScan — startScan validation", () => {
  it("sets an error and returns idle when backendIds is empty", async () => {
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [] });
    });
    expect(result.current.error).toBe("Select at least one agent to run.");
    expect(result.current.scanState).toBe("idle");
    expect(mockCortexAgentsRunAgent).not.toHaveBeenCalled();
  });

  it("sets an error when the API returns no workflow_id", async () => {
    mockCortexAgentsRunAgent.mockResolvedValueOnce({ data: {} });
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.error).toMatch(/did not return a workflow ID/);
    expect(result.current.scanState).toBe("error");
  });

  it("captures a thrown error from the run-agent API as a scan error", async () => {
    mockCortexAgentsRunAgent.mockRejectedValueOnce(new Error("network down"));
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.error).toBe("network down");
    expect(result.current.scanState).toBe("error");
  });

  it("ignores aborted errors (AbortError) from the run-agent API", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    mockCortexAgentsRunAgent.mockRejectedValueOnce(abortErr);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.scanState).not.toBe("error");
  });
});

describe("useAgenticScan — request body", () => {
  it("sends both document_name and document_ref when provided", async () => {
    queueSseEvents([{ type: "completion" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({
        text: "hello",
        documentName: "My Article",
        documentRef: "My-Article_body.md",
        backendIds: [STYLE_BACKEND_ID],
      });
    });
    expect(mockCortexAgentsRunAgent).toHaveBeenCalledTimes(1);
    const callBody = (mockCortexAgentsRunAgent.mock.calls[0][0] as { body: unknown }).body;
    expect(callBody).toMatchObject({
      text: "hello",
      document_name: "My Article",
      document_ref: "My-Article_body.md",
    });
  });

  it("omits document_name and document_ref when not provided", async () => {
    queueSseEvents([{ type: "completion" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [STYLE_BACKEND_ID] });
    });
    const callBody = (
      mockCortexAgentsRunAgent.mock.calls[0][0] as { body: Record<string, unknown> }
    ).body;
    expect(callBody).not.toHaveProperty("document_name");
    expect(callBody).not.toHaveProperty("document_ref");
  });

  it("passes style_guide_id from agentConfig through into the request body", async () => {
    queueSseEvents([{ type: "completion" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({
        text: "hello",
        backendIds: [STYLE_BACKEND_ID],
        agentConfig: { style_guide_id: "ap" },
      });
    });
    const callBody = (mockCortexAgentsRunAgent.mock.calls[0][0] as { body: unknown }).body;
    expect(callBody).toMatchObject({ style_guide_id: "ap" });
  });
});

describe("useAgenticScan — SSE event handling", () => {
  it("transitions to complete on a completion SSE event", async () => {
    queueSseEvents([{ type: "completion" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "hello", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.scanState).toBe("complete");
    expect(result.current.workflowId).toBe("wf-abc");
  });

  it("accumulates issues and marks the agent complete on success agent_result events", async () => {
    queueSseEvents([
      {
        type: "agent_result",
        agent_name: "style_agent",
        success: true,
        result: {
          issues: [
            {
              agent: "style_agent",
              severity: "medium",
              category: "tone",
              confidence: 0.9,
              explanation: "Try formal",
              suggestion: "Hello",
              original: "hello",
              position: { start: 0, end: 5, sentence: "Hello world" },
            },
          ],
        },
      },
    ]);
    const onAgentResult = vi.fn();
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({
        text: "Hello world",
        backendIds: [STYLE_BACKEND_ID],
        onAgentResult,
      });
    });
    expect(result.current.issues).toHaveLength(1);
    expect(result.current.issues[0].agent).toBe("style_agent");
    expect(result.current.completedAgents.has("style_agent")).toBe(true);
    expect(onAgentResult).toHaveBeenCalledWith("style_agent", expect.any(Array));
    // Since the only requested agent has reported, the run is fully reported.
    expect(result.current.scanState).toBe("complete");
  });

  it("captures agent quality from a successful agent_result", async () => {
    queueSseEvents([
      {
        type: "agent_result",
        agent_name: "style_agent",
        success: true,
        result: { quality: { score: 87 }, issues: [] },
      },
    ]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.agentQualityByAgentId.style_agent).toBeDefined();
  });

  it("marks the agent complete but adds no issues on success=false events", async () => {
    queueSseEvents([{ type: "agent_result", agent_name: "style_agent", success: false }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.issues).toEqual([]);
    expect(result.current.completedAgents.has("style_agent")).toBe(true);
  });

  it("transitions to error on an error SSE event", async () => {
    queueSseEvents([{ type: "error", error: "stream blew up" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.scanState).toBe("error");
    expect(result.current.error).toBe("stream blew up");
  });

  it("logs and ignores malformed SSE messages", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    queueRawSseMessages(["{not-json"]);
    queueSseEvents([{ type: "completion" }]);
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(warnSpy).toHaveBeenCalledWith("Skipping malformed SSE message:", "{not-json");
    expect(result.current.scanState).toBe("complete");
  });

  it("transitions to complete when the stream resolves without an explicit completion event", async () => {
    // No queued events — the SSE mock resolves immediately, falling through to the
    // post-loop fallback in startScan that transitions to "complete".
    const { result } = renderHook(() => useAgenticScan("api-key"));
    await act(async () => {
      await result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    expect(result.current.scanState).toBe("complete");
  });
});

describe("useAgenticScan — cancelScan", () => {
  it("transitions to cancelled and fires the cancel API when a workflow is in flight", async () => {
    holdStreamOpen();
    const { result } = renderHook(() => useAgenticScan("api-key"));
    let startPromise: Promise<void> | undefined;
    act(() => {
      startPromise = result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    await waitFor(() => {
      expect(result.current.scanState).toBe("streaming");
    });

    act(() => {
      result.current.cancelScan();
    });
    expect(result.current.scanState).toBe("cancelled");
    expect(mockCortexWorkflowsCancelWorkflow).toHaveBeenCalledWith(
      expect.objectContaining({ path: { workflow_id: "wf-abc" } }),
    );

    // Cleanup: resolve the held stream so the startScan promise settles.
    endStream();
    await startPromise;
  });

  it("with an error message, transitions to idle and surfaces the error", async () => {
    holdStreamOpen();
    const { result } = renderHook(() => useAgenticScan("api-key"));
    let startPromise: Promise<void> | undefined;
    act(() => {
      startPromise = result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    await waitFor(() => {
      expect(result.current.scanState).toBe("streaming");
    });

    act(() => {
      result.current.cancelScan("user pressed cancel");
    });
    expect(result.current.scanState).toBe("idle");
    expect(result.current.error).toBe("user pressed cancel");

    endStream();
    await startPromise;
  });

  it("does not call the cancel API when there is no active workflow id", () => {
    const { result } = renderHook(() => useAgenticScan("api-key"));
    act(() => {
      result.current.cancelScan();
    });
    expect(mockCortexWorkflowsCancelWorkflow).not.toHaveBeenCalled();
  });
});

describe("useAgenticScan — unmount cleanup", () => {
  it("aborts the active fetchEventSource signal when the consumer unmounts mid-stream", async () => {
    holdStreamOpen();
    const { result, unmount } = renderHook(() => useAgenticScan("api-key"));
    let startPromise: Promise<void> | undefined;
    act(() => {
      startPromise = result.current.startScan({ text: "x", backendIds: [STYLE_BACKEND_ID] });
    });
    await waitFor(() => {
      expect(activeSignal).not.toBeNull();
    });

    const signal = activeSignal;
    if (!signal) throw new Error("activeSignal was not captured");
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);

    endStream();
    await startPromise;
  });
});
