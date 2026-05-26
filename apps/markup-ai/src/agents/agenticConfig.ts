import type { AgentID } from "./agents";
import { AGENTS } from "./agents";
import type { AgentAvailabilityMap } from "./agentAvailability";

/**
 * Parallel executor orchestrator agent ID (Cortex).
 * Runs multiple child agents in parallel; we pass selected agent IDs in input.agents.
 */
export const PARALLEL_EXECUTOR_AGENT_ID = "ag_cnct5nkhtfNk";

/**
 * Backend agent IDs for each selectable agent (from Cortex API).
 * Only agents listed here can be executed.
 * To enable a new agent, add its catalog id → backend id mapping here.
 */
export const SELECTABLE_AGENT_BACKEND_IDS: Record<string, string> = {
  style_agent: "ag_vYCPHsSQnnJj",
};

/**
 * Default selected agents when the user has not changed selection.
 * Only agents with a backend ID are eligible.
 */
export const DEFAULT_SELECTED_AGENT_IDS: AgentID[] = AGENTS.filter(
  (a) => SELECTABLE_AGENT_BACKEND_IDS[a.id],
).map((a) => a.id);

/**
 * Map backend/cortex agent identifiers to catalog AgentID. Use when the API returns
 * a different slug (e.g. "style") than our internal id ("style_agent").
 */
export const BACKEND_AGENT_NAME_TO_ID: Record<string, AgentID> = {
  style: "style_agent",
};

export function normalizeAgentId(backendName: string): string {
  return BACKEND_AGENT_NAME_TO_ID[backendName] ?? backendName;
}

/**
 * Maps backend cortex ids from a parallel run request to catalog agent ids
 * (keys of SELECTABLE_AGENT_BACKEND_IDS). Unknown ids pass through normalizeAgentId.
 */
export function normalizedCatalogAgentIdsFromBackendIds(backendIds: string[]): string[] {
  const backendToCatalog = new Map(
    Object.entries(SELECTABLE_AGENT_BACKEND_IDS).map(([catalogId, backendId]) => [
      backendId,
      catalogId,
    ]),
  );
  return backendIds.map((id) => backendToCatalog.get(id) ?? normalizeAgentId(id));
}

/**
 * Set of all known agent configuration keys from AGENTS.configurationKeys.
 * Used as an allowlist when spreading agentConfig into the request body to prevent
 * overwriting reserved fields (text, agents, etc.) and prototype-pollution vectors.
 */
export const ALLOWED_AGENT_CONFIG_KEYS: ReadonlySet<string> = new Set(
  AGENTS.flatMap((a) => a.configurationKeys),
);

const RESERVED_BODY_KEYS: ReadonlySet<string> = new Set([
  "text",
  "agents",
  "document_name",
  "url",
  "webhook_url",
]);

/** Filter agentConfig to only allowlisted, non-reserved, non-empty entries. */
export function sanitizeAgentConfig(agentConfig: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = Object.create(null) as Record<string, unknown>;
  for (const [key, value] of Object.entries(agentConfig)) {
    if (!ALLOWED_AGENT_CONFIG_KEYS.has(key)) continue;
    if (RESERVED_BODY_KEYS.has(key)) continue;
    if (value == null || value === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    result[key] = value;
  }
  return result;
}

/**
 * Resolve catalog AgentID[] to backend agent IDs for the API. Only ids with
 * a backend ID are included. When `unavailable` is provided, agents flagged
 * as unavailable (e.g. style_agent when org has style_agent disabled) are
 * silently dropped — the caller's `selectedAgentIds` is the user's
 * preference and we preserve it across config flips, but we never submit
 * an agent the org isn't allowed to run.
 */
export function toBackendAgentIds(
  agentIds: AgentID[],
  unavailable?: AgentAvailabilityMap,
): string[] {
  return agentIds
    .filter((id) => !unavailable?.has(id))
    .map((id) => SELECTABLE_AGENT_BACKEND_IDS[id])
    .filter((id): id is string => Boolean(id));
}
