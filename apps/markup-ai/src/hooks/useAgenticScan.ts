import { useCallback, useEffect, useRef, useState } from "react";
import { cortexAgentsRunAgent, cortexWorkflowsCancelWorkflow } from "../api-client/sdk.gen";
import type { AgentRunRequest } from "../api-client/types.gen";
import { useApiClient } from "./useApiClient";
import { useAuth } from "../contexts/AuthContext";
import {
  normalizeAgentId,
  normalizedCatalogAgentIdsFromBackendIds,
  PARALLEL_EXECUTOR_AGENT_ID,
  sanitizeAgentConfig,
} from "../agents/agenticConfig";
import { fetchEventSource } from "../agents/fetchEventSource";
import type {
  AgenticScanState,
  AgentQualityByAgentId,
  CortexIssueWithId,
  SSEEvent,
} from "../agents/types";
import { parseAgentResultQuality } from "../agents/utils/agentResultQuality";
import { runCatalogAgentsFullyReported } from "../agents/utils/agenticScanProgress";
import { toIssuesWithIds } from "../agents/utils/issueIds";
import { INTEGRATION_ID } from "../constants/app";

export interface ScanOptions {
  text: string;
  /** Human-readable document title; mapped to API `document_name`. */
  documentName?: string;
  /** Caller-built unique document identifier; mapped to API `document_ref`. */
  documentRef?: string;
  backendIds: string[];
  /** Flat agent config passed through to the parallel executor (e.g. target_id, domain_ids). */
  agentConfig?: Record<string, unknown>;
  onAgentResult?: (agentName: string, issues: CortexIssueWithId[]) => void;
  onStreamComplete?: () => void;
}

export interface UseAgenticScanResult {
  issues: CortexIssueWithId[];
  /** Latest overall `quality.score` per catalog agent id from `agent_result` payloads (when present). */
  agentQualityByAgentId: AgentQualityByAgentId;
  workflowId: string | null;
  scanState: AgenticScanState;
  error: string | undefined;
  completedAgents: Set<string>;
  scanInFlight: boolean;
  /** Immediately transition to "scanning" so UI feedback starts before slow async work. */
  prepareScan: () => void;
  startScan: (options: ScanOptions) => Promise<void>;
  cancelScan: (errorMessage?: string) => void;
}

export function useAgenticScan(apiKey?: string | null): UseAgenticScanResult {
  const client = useApiClient({ apiKey: apiKey ?? "" });
  const { getAccessToken } = useAuth();

  const [issues, setIssues] = useState<CortexIssueWithId[]>([]);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [scanState, setScanState] = useState<AgenticScanState>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [agentQualityByAgentId, setAgentQualityByAgentId] = useState<AgentQualityByAgentId>({});

  const scanInFlightRef = useRef(false);
  const activeAbortRef = useRef<AbortController | null>(null);
  const cancelledRef = useRef<boolean>(false);
  const workflowIdRef = useRef<string | null>(null);
  const runRequestedCatalogAgentIdsRef = useRef<readonly string[]>([]);

  useEffect(() => {
    return () => {
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
    };
  }, []);

  const prepareScan = useCallback(() => {
    if (scanInFlightRef.current) return;
    scanInFlightRef.current = true;
    cancelledRef.current = false;
    runRequestedCatalogAgentIdsRef.current = [];
    setScanState("scanning");
    setError(undefined);
    setIssues([]);
    setCompletedAgents(new Set());
    setAgentQualityByAgentId({});
    setWorkflowId(null);
    workflowIdRef.current = null;
  }, []);

  const cancelScan = useCallback(
    (errorMessage?: string) => {
      cancelledRef.current = true;
      const wfId = workflowIdRef.current;
      workflowIdRef.current = null;
      activeAbortRef.current?.abort();
      activeAbortRef.current = null;
      scanInFlightRef.current = false;
      if (typeof errorMessage === "string" && errorMessage.length > 0) {
        setError(errorMessage);
        setScanState("idle");
      } else {
        setError(undefined);
        setScanState("cancelled");
      }
      if (wfId) {
        cortexWorkflowsCancelWorkflow({
          client,
          path: { workflow_id: wfId },
          throwOnError: false,
        }).catch(() => {
          // Fire-and-forget; avoid unhandled rejection
        });
      }
    },
    [client],
  );

  const mergeRunCatalogAgentsIntoCompleted = useCallback(() => {
    const ids = runRequestedCatalogAgentIdsRef.current;
    if (ids.length === 0) return;
    setCompletedAgents((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.add(id);
      return next;
    });
  }, []);

  const handleStreamMessage = useCallback(
    (
      raw: string,
      text: string,
      streamState: { done: boolean },
      onAgentResult?: (agentName: string, issues: CortexIssueWithId[]) => void,
      onStreamComplete?: () => void,
    ) => {
      if (streamState.done || cancelledRef.current) return;

      let event: SSEEvent;
      try {
        event = JSON.parse(raw) as SSEEvent;
      } catch {
        console.warn("Skipping malformed SSE message:", raw);
        return;
      }

      if (event.type === "agent_result") {
        const normalizedAgentName = normalizeAgentId(event.agent_name);
        setCompletedAgents((prev) => {
          const next = new Set(prev).add(normalizedAgentName);
          const requested = runRequestedCatalogAgentIdsRef.current;
          if (
            runCatalogAgentsFullyReported(requested, next) &&
            !streamState.done &&
            !cancelledRef.current
          ) {
            streamState.done = true;
            queueMicrotask(() => {
              if (cancelledRef.current) return;
              mergeRunCatalogAgentsIntoCompleted();
              setScanState("complete");
              onStreamComplete?.();
            });
          }
          return next;
        });

        if (event.success && event.result) {
          const parsedQuality = parseAgentResultQuality(event.result);
          if (parsedQuality) {
            setAgentQualityByAgentId((prev) => ({
              ...prev,
              [normalizedAgentName]: parsedQuality,
            }));
          }
        }

        if (event.success && event.result?.issues) {
          const normalizedIssues = event.result.issues.map((issue) => ({
            ...issue,
            agent: normalizeAgentId(issue.agent),
          }));
          const newIssues = toIssuesWithIds(normalizedIssues, text);
          onAgentResult?.(normalizedAgentName, newIssues);
          setIssues((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const deduped = newIssues.filter((i) => !existingIds.has(i.id));
            return [...prev, ...deduped];
          });
        }
      }

      if (event.type === "completion") {
        streamState.done = true;
        mergeRunCatalogAgentsIntoCompleted();
        setScanState("complete");
        onStreamComplete?.();
      }

      if (event.type === "error") {
        setError(event.error);
        streamState.done = true;
        mergeRunCatalogAgentsIntoCompleted();
        setScanState("error");
        onStreamComplete?.();
      }
    },
    [mergeRunCatalogAgentsIntoCompleted],
  );

  const startScan = useCallback(
    async ({
      text,
      documentName,
      documentRef,
      backendIds,
      agentConfig,
      onAgentResult,
      onStreamComplete,
    }: ScanOptions) => {
      if (backendIds.length === 0) {
        runRequestedCatalogAgentIdsRef.current = [];
        setError("Select at least one agent to run.");
        scanInFlightRef.current = false;
        setScanState("idle");
        return;
      }

      runRequestedCatalogAgentIdsRef.current = normalizedCatalogAgentIdsFromBackendIds(backendIds);

      let streamCompleteNotified = false;
      const safeOnStreamComplete = () => {
        if (streamCompleteNotified) return;
        streamCompleteNotified = true;
        onStreamComplete?.();
      };

      if (!scanInFlightRef.current) {
        scanInFlightRef.current = true;
        cancelledRef.current = false;
        setScanState("scanning");
        setError(undefined);
        setIssues([]);
        setCompletedAgents(new Set());
        setAgentQualityByAgentId({});
        setWorkflowId(null);
        workflowIdRef.current = null;
      }

      const abortController = new AbortController();
      activeAbortRef.current = abortController;

      try {
        // `document_ref` is the unique identifier Cortex tracks scans
        // against; `document_name` is the human-readable title. Omit each
        // when missing rather than sending an empty string — the backend
        // treats both as optional.
        const body: AgentRunRequest = {
          text,
          ...(documentName ? { document_name: documentName } : {}),
          ...(documentRef ? { document_ref: documentRef } : {}),
          agents: backendIds,
          ...sanitizeAgentConfig(agentConfig ?? {}),
        };

        const { data } = await cortexAgentsRunAgent({
          client,
          body,
          path: { agent_id: PARALLEL_EXECUTOR_AGENT_ID },
          query: { wait: false },
          throwOnError: true,
          signal: abortController.signal,
        } as Parameters<typeof cortexAgentsRunAgent>[0]);

        if (cancelledRef.current) return;
        if (!data?.workflow_id) {
          setError("Scan could not be started because the server did not return a workflow ID.");
          setScanState("error");
          safeOnStreamComplete();
          return;
        }

        const wfId = data.workflow_id;
        workflowIdRef.current = wfId;
        setWorkflowId(wfId);
        setScanState("streaming");

        const baseUrl = client.getConfig().baseUrl?.replace(/\/$/, "") ?? "";
        const token = (await getAccessToken()) ?? apiKey ?? "";
        const streamState = { done: false };

        await fetchEventSource({
          url: `${baseUrl}/agents/workflows/${wfId}/stream`,
          headers: {
            Authorization: `Bearer ${token}`,
            "x-integration-id": INTEGRATION_ID,
          },
          signal: abortController.signal,
          onMessage: (raw) => {
            handleStreamMessage(raw, text, streamState, onAgentResult, safeOnStreamComplete);
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- streamState.done is mutated inside onMessage
        if (!cancelledRef.current && !streamState.done) {
          mergeRunCatalogAgentsIntoCompleted();
          setScanState("complete");
          safeOnStreamComplete();
        }
      } catch (err) {
        if (!cancelledRef.current && !(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "An unexpected error occurred");
          setScanState("error");
          safeOnStreamComplete();
        }
      } finally {
        activeAbortRef.current = null;
        scanInFlightRef.current = false;
      }
    },
    [client, apiKey, getAccessToken, handleStreamMessage, mergeRunCatalogAgentsIntoCompleted],
  );

  const scanInFlight = scanState === "scanning" || scanState === "streaming";

  return {
    issues,
    agentQualityByAgentId,
    workflowId,
    scanState,
    error,
    completedAgents,
    scanInFlight,
    prepareScan,
    startScan,
    cancelScan,
  };
}
