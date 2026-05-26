export type CortexSeverity = "low" | "medium" | "high";

export type IssueStatus = "active" | "resolved" | "dismissed";

export interface CortexIssue {
  agent: string;
  category?: string;
  confidence: number;
  severity: CortexSeverity;
  explanation: string;
  suggestion?: string;
  /** When non-empty, preferred list of replacement options (e.g. spelling variants). */
  suggestions?: string[];
  position: {
    start: number;
    end: number;
    sentence: string;
  };
}

/**
 * Issue row from SSE/API JSON before `severity` is normalized to CortexSeverity.
 * Prefer this over CortexIssue at parse boundaries so untrusted severities are not typed as normalized.
 */
export interface CortexIssueIngest {
  agent: string;
  category?: string;
  confidence: number;
  severity: unknown;
  explanation: string;
  suggestion?: string;
  /** When non-empty, preferred list of replacement options (e.g. spelling variants). */
  suggestions?: string[];
  position: {
    start: number;
    end: number;
    sentence: string;
  };
}

export interface CortexIssueWithId extends CortexIssue {
  id: string;
  groupKey: string;
  status: IssueStatus;
  /** Exact matched text from the document at position.start..end */
  original: string;
}

export function compareByPosition(a: CortexIssueWithId, b: CortexIssueWithId): number {
  return a.position.start - b.position.start || a.position.end - b.position.end;
}

// -- SSE streaming types --

export interface SSEEventBase {
  type: string;
  timestamp?: string;
  workflow_id?: string;
  sequence_number?: number | null;
  phase?: string | null;
}

export interface SSEConnectedEvent extends SSEEventBase {
  type: "connected";
  message: string;
}

export interface SSEStatusEvent extends SSEEventBase {
  type: "status";
  status: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/** Overall quality from agents that return a `quality` block (e.g. style_agent). */
export interface AgentResultQualitySummary {
  score: number;
  status?: string;
}

/** Latest `quality` payload keyed by catalog agent id; missing keys mean no score for that agent. */
export type AgentQualityByAgentId = Readonly<Partial<Record<string, AgentResultQualitySummary>>>;

export interface SSEAgentResultEvent extends SSEEventBase {
  type: "agent_result";
  agent_name: string;
  result: {
    issues: CortexIssueIngest[];
    warnings?: string[];
    quality?: {
      score: number;
      status?: string;
      scores_by_goal?: unknown[];
    };
  } | null;
  error?: string | null;
  success: boolean;
}

export interface SSECompletionEvent extends SSEEventBase {
  type: "completion";
  result: unknown;
  duration_seconds?: number;
  token_usage?: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface SSEErrorEvent extends SSEEventBase {
  type: "error";
  error: string;
  error_type?: string;
  traceback?: string;
}

export type SSEEvent =
  | SSEConnectedEvent
  | SSEStatusEvent
  | SSEAgentResultEvent
  | SSECompletionEvent
  | SSEErrorEvent;

export function isAgentResultEvent(event: SSEEvent): event is SSEAgentResultEvent {
  return event.type === "agent_result";
}

// -- Scan state --

export type AgenticScanState =
  | "idle"
  | "scanning"
  | "streaming"
  | "complete"
  | "error"
  | "cancelled";

export type AgentStatus = "pending" | "running" | "complete" | "error";

export interface SeverityCounts {
  total: number;
  high: number;
  medium: number;
  low: number;
}
