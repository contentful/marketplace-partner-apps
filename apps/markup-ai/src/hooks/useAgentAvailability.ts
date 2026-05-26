import { useMemo } from "react";
import { type AgentAvailabilityMap, computeAgentAvailability } from "../agents/agentAvailability";
import { useAccountConfig } from "./useAccountConfig";

export interface UseAgentAvailabilityResult {
  /** Map of unavailable agent ids → reason. Agents not in the map are available. */
  unavailable: AgentAvailabilityMap;
  isLoading: boolean;
  isError: boolean;
}

/**
 * Public hook the UI uses to learn which catalog agents the user is
 * currently *allowed* to run (regardless of selection). Composes
 * `useAccountConfig` and the `agentAvailability` rules; in the future this
 * is the seam where additional inputs (e.g. per-agent feature flags, plan
 * limits) get folded in without rewiring callers.
 *
 * Fail-open: loading / error → empty unavailability map.
 */
export function useAgentAvailability(): UseAgentAvailabilityResult {
  const { config, isLoading, isError } = useAccountConfig();

  const unavailable = useMemo(() => computeAgentAvailability(config), [config]);

  return { unavailable, isLoading, isError };
}
