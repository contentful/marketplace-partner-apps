/**
 * Centralized state management for FieldCheck dialog
 */

import { useState, useCallback } from "react";
import type { ScoreOutput, Suggestion, Dialects, Tones } from "../../../../api-client/types.gen";

export interface ConfigValues {
  dialect?: Dialects;
  tone?: Tones | null;
  styleGuide?: string;
}

export interface FieldCheckState {
  // Analysis results
  activeScores: ScoreOutput | null;
  setActiveScores: (scores: ScoreOutput | null) => void;

  activeSuggestions: Suggestion[];
  setActiveSuggestions: (suggestions: Suggestion[]) => void;

  // Configuration
  config: ConfigValues;
  updateConfig: (newConfig: Partial<ConfigValues>) => void;

  // Reset all state
  resetAll: () => void;
}

/**
 * Hook for managing FieldCheck dialog state
 */
export function useFieldCheckState(): FieldCheckState {
  const [activeScores, setActiveScores] = useState<ScoreOutput | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<Suggestion[]>([]);
  const [config, setConfig] = useState<ConfigValues>({});

  // Update config (persistence handled by parent component if needed)
  const updateConfig = useCallback((newConfig: Partial<ConfigValues>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  // Reset all state
  const resetAll = useCallback(() => {
    setActiveScores(null);
    setActiveSuggestions([]);
  }, []);

  return {
    activeScores,
    setActiveScores,
    activeSuggestions,
    setActiveSuggestions,
    config,
    updateConfig,
    resetAll,
  };
}
