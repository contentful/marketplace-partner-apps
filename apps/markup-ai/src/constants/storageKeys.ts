/**
 * Centralized browser-storage keys.
 *
 * Every key the app reads from or writes to `sessionStorage` / `localStorage`
 * lives here so the full set is visible in one place rather than scattered
 * across the hooks that own each value.
 */

/** sessionStorage key for the user's selected Cortex agents (see `useAgentSelection`). */
export const AGENT_SELECTION_STORAGE_KEY = "markupai.agentSelection";

/** sessionStorage key for per-agent configuration (see `useAgentConfig`). */
export const AGENT_CONFIG_STORAGE_KEY = "markupai.agentConfig";
