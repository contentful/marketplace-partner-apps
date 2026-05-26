import { useCallback, useEffect, useState } from "react";
import type { AgentID } from "../agents/agents";
import { AGENTS } from "../agents/agents";
import { DEFAULT_SELECTED_AGENT_IDS, SELECTABLE_AGENT_BACKEND_IDS } from "../agents/agenticConfig";

const STORAGE_KEY = "markupai.agentSelection";

function sanitizeSelection(ids: unknown): AgentID[] {
  if (!Array.isArray(ids)) return [];
  const known = new Set(AGENTS.map((a) => a.id));
  return ids.filter(
    (id): id is AgentID =>
      typeof id === "string" && known.has(id) && Boolean(SELECTABLE_AGENT_BACKEND_IDS[id]),
  );
}

function loadSelection(): AgentID[] {
  if (typeof sessionStorage === "undefined") {
    return [...DEFAULT_SELECTED_AGENT_IDS];
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [...DEFAULT_SELECTED_AGENT_IDS];
    const parsed = JSON.parse(raw) as unknown;
    const sanitized = sanitizeSelection(parsed);
    return sanitized.length > 0 ? sanitized : [...DEFAULT_SELECTED_AGENT_IDS];
  } catch {
    return [...DEFAULT_SELECTED_AGENT_IDS];
  }
}

function saveSelection(ids: AgentID[]): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

export interface UseAgentSelectionResult {
  selectedAgentIds: AgentID[];
  toggleAgent: (id: AgentID) => void;
  replaceSelection: (ids: AgentID[]) => void;
  isSelected: (id: AgentID) => boolean;
}

export function useAgentSelection(): UseAgentSelectionResult {
  const [selectedAgentIds, setSelectedAgentIds] = useState<AgentID[]>(() => loadSelection());

  useEffect(() => {
    saveSelection(selectedAgentIds);
  }, [selectedAgentIds]);

  const toggleAgent = useCallback((id: AgentID) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const replaceSelection = useCallback((ids: AgentID[]) => {
    setSelectedAgentIds(sanitizeSelection(ids));
  }, []);

  const isSelected = useCallback(
    (id: AgentID) => selectedAgentIds.includes(id),
    [selectedAgentIds],
  );

  return { selectedAgentIds, toggleAgent, replaceSelection, isSelected };
}
