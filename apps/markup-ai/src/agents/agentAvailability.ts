/**
 * Agent availability — the org-level / capability rules that decide which
 * catalog agents the user is *allowed* to run, regardless of whether they
 * have the agent toggled on in settings.
 *
 * Today the only input is the `/style-agent/config` `OrganizationConfigResponse`
 * and the only rule is "if the org has style_agent disabled, mark
 * `style_agent` unavailable." As more agents come online, extend
 * `computeAgentAvailability` with one rule per agent — the UI never needs
 * to know which agent each rule corresponds to, just whether a given id
 * is available and (if not) why.
 *
 * Fail-open semantics: when `config` is null (loading / error / no auth)
 * every agent is treated as available. We never want a transient API
 * failure to take Check away from the user.
 */
import type { AgentID } from "./agents";
import { type OrganizationConfigResponse, StyleAgentMode } from "../api-client/types.gen";

export interface AgentUnavailability {
  /** User-facing copy explaining why the agent can't run right now. */
  reason: string;
}

/** Map of unavailable agent ids → reason. Agents not in the map are available. */
export type AgentAvailabilityMap = ReadonlyMap<AgentID, AgentUnavailability>;

export const STYLE_AGENT_DISABLED_MESSAGE =
  "Style agent is disabled for your organization. Contact support to enable it.";

// Stable empty-map reference so the fail-open path returns the same identity
// across renders. Downstream consumers (memoization deps, prop drilling) compare
// by reference, so allocating fresh empty Maps would churn React updates for no
// reason.
const EMPTY_AVAILABILITY: AgentAvailabilityMap = new Map();

export function computeAgentAvailability(
  config: OrganizationConfigResponse | null | undefined,
): AgentAvailabilityMap {
  if (!config) return EMPTY_AVAILABILITY;

  const unavailable = new Map<AgentID, AgentUnavailability>();
  if (config.style_agent === StyleAgentMode.DISABLED) {
    unavailable.set("style_agent", { reason: STYLE_AGENT_DISABLED_MESSAGE });
  }
  if (unavailable.size === 0) return EMPTY_AVAILABILITY;
  return unavailable;
}

/** Filter a list of selected agent ids to those currently runnable. */
export function filterRunnableAgentIds(
  selectedAgentIds: readonly AgentID[],
  unavailable: AgentAvailabilityMap,
): AgentID[] {
  return selectedAgentIds.filter((id) => !unavailable.has(id));
}

/**
 * Join distinct unavailability reasons for a set of agents into a single
 * user-facing string. Today this only ever produces one reason (style
 * agent), but the helper is shaped so adding a second blocked agent
 * doesn't require new copy logic in callers.
 *
 * Each reason is normalized to end with terminal punctuation before
 * joining, so "Reason A. Reason B." reads as two sentences regardless of
 * whether a future `AgentUnavailability.reason` author remembers the
 * trailing period.
 */
export function unavailabilityReasonsFor(
  agentIds: readonly AgentID[],
  unavailable: AgentAvailabilityMap,
): string | null {
  const reasons = new Set<string>();
  for (const id of agentIds) {
    const entry = unavailable.get(id);
    if (entry) reasons.add(entry.reason);
  }
  if (reasons.size === 0) return null;
  return Array.from(reasons)
    .map((r) => (/[.!?]$/.test(r) ? r : `${r}.`))
    .join(" ");
}
