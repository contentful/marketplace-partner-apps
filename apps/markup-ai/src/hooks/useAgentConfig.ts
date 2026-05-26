import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "markupai.agentConfig";

export type AgentConfigMap = Record<string, Record<string, unknown>>;

function loadConfig(): AgentConfigMap {
  if (typeof sessionStorage === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as AgentConfigMap;
  } catch {
    return {};
  }
}

function saveConfig(config: AgentConfigMap): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export interface UseAgentConfigResult {
  agentConfig: AgentConfigMap;
  /** Set a single config key for a given agent (e.g. setAgentConfigKey("style_agent", "target_id", "ap")). */
  setAgentConfigKey: (agentId: string, key: string, value: unknown) => void;
  /** Replace all config keys for a given agent. */
  setAgentConfigForAgent: (agentId: string, config: Record<string, unknown>) => void;
  /** Flatten every agent's config into a single object for the Cortex request body. */
  flattenConfigForRequest: (includedAgentIds: string[]) => Record<string, unknown>;
}

export function useAgentConfig(): UseAgentConfigResult {
  const [agentConfig, setAgentConfig] = useState<AgentConfigMap>(() => loadConfig());

  useEffect(() => {
    saveConfig(agentConfig);
  }, [agentConfig]);

  const setAgentConfigKey = useCallback((agentId: string, key: string, value: unknown) => {
    setAgentConfig((prev) => {
      const existing = prev[agentId] ?? {};
      return { ...prev, [agentId]: { ...existing, [key]: value } };
    });
  }, []);

  const setAgentConfigForAgent = useCallback((agentId: string, config: Record<string, unknown>) => {
    setAgentConfig((prev) => ({ ...prev, [agentId]: config }));
  }, []);

  const flattenConfigForRequest = useCallback(
    (includedAgentIds: string[]): Record<string, unknown> => {
      const flat: Record<string, unknown> = {};
      for (const agentId of includedAgentIds) {
        if (!Object.hasOwn(agentConfig, agentId)) continue;
        const entries = agentConfig[agentId];
        for (const [key, value] of Object.entries(entries)) {
          if (value === null || value === undefined || value === "") continue;
          if (Array.isArray(value) && value.length === 0) continue;
          flat[key] = value;
        }
      }
      return flat;
    },
    [agentConfig],
  );

  return { agentConfig, setAgentConfigKey, setAgentConfigForAgent, flattenConfigForRequest };
}
