import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFieldCheckState } from "./useFieldCheckState";
import type { ScoreOutput, Suggestion, Severity } from "../../../../api-client/types.gen";
import { Dialects, Tones, IssueCategory, GrammarCategory } from "../../../../api-client/types.gen";

const createMockSuggestion = (overrides: Partial<Suggestion> = {}): Suggestion => ({
  original: "test text",
  suggestion: "better text",
  explanation: "This is a test explanation",
  category: IssueCategory.GRAMMAR,
  subcategory: GrammarCategory.SPELLING,
  severity: "high" as Severity,
  position: { start_index: 0 },
  ...overrides,
});

const createMockScores = (): ScoreOutput => ({
  quality: {
    score: 85,
    grammar: { score: 90, issues: 1 },
    consistency: { score: 80, issues: 2 },
    terminology: { score: 100, issues: 0 },
  },
});

describe("useFieldCheckState", () => {
  it("initializes with default values", () => {
    const { result } = renderHook(() => useFieldCheckState());

    expect(result.current.activeScores).toBeNull();
    expect(result.current.activeSuggestions).toEqual([]);
    expect(result.current.config).toEqual({});
  });

  describe("setActiveScores", () => {
    it("updates active scores", () => {
      const { result } = renderHook(() => useFieldCheckState());
      const mockScores = createMockScores();

      act(() => {
        result.current.setActiveScores(mockScores);
      });

      expect(result.current.activeScores).toEqual(mockScores);
    });

    it("can set scores to null", () => {
      const { result } = renderHook(() => useFieldCheckState());
      const mockScores = createMockScores();

      act(() => {
        result.current.setActiveScores(mockScores);
      });

      act(() => {
        result.current.setActiveScores(null);
      });

      expect(result.current.activeScores).toBeNull();
    });
  });

  describe("setActiveSuggestions", () => {
    it("updates active suggestions", () => {
      const { result } = renderHook(() => useFieldCheckState());
      const mockSuggestions = [
        createMockSuggestion(),
        createMockSuggestion({ original: "another" }),
      ];

      act(() => {
        result.current.setActiveSuggestions(mockSuggestions);
      });

      expect(result.current.activeSuggestions).toHaveLength(2);
      expect(result.current.activeSuggestions[0].original).toBe("test text");
    });

    it("can set empty suggestions array", () => {
      const { result } = renderHook(() => useFieldCheckState());
      const mockSuggestions = [createMockSuggestion()];

      act(() => {
        result.current.setActiveSuggestions(mockSuggestions);
      });

      act(() => {
        result.current.setActiveSuggestions([]);
      });

      expect(result.current.activeSuggestions).toEqual([]);
    });
  });

  describe("updateConfig", () => {
    it("updates config with new values", () => {
      const { result } = renderHook(() => useFieldCheckState());

      act(() => {
        result.current.updateConfig({ dialect: Dialects.AMERICAN_ENGLISH });
      });

      expect(result.current.config.dialect).toBe(Dialects.AMERICAN_ENGLISH);
    });

    it("merges config values", () => {
      const { result } = renderHook(() => useFieldCheckState());

      act(() => {
        result.current.updateConfig({ dialect: Dialects.AMERICAN_ENGLISH });
      });

      act(() => {
        result.current.updateConfig({ tone: Tones.PROFESSIONAL });
      });

      expect(result.current.config.dialect).toBe(Dialects.AMERICAN_ENGLISH);
      expect(result.current.config.tone).toBe(Tones.PROFESSIONAL);
    });

    it("updates style guide", () => {
      const { result } = renderHook(() => useFieldCheckState());

      act(() => {
        result.current.updateConfig({ styleGuide: "microsoft-style-guide" });
      });

      expect(result.current.config.styleGuide).toBe("microsoft-style-guide");
    });

    it("can set tone to null", () => {
      const { result } = renderHook(() => useFieldCheckState());

      act(() => {
        result.current.updateConfig({ tone: Tones.PROFESSIONAL });
      });

      act(() => {
        result.current.updateConfig({ tone: null });
      });

      expect(result.current.config.tone).toBeNull();
    });
  });

  describe("resetAll", () => {
    it("resets scores and suggestions", () => {
      const { result } = renderHook(() => useFieldCheckState());

      // Set some data first
      act(() => {
        result.current.setActiveScores(createMockScores());
        result.current.setActiveSuggestions([createMockSuggestion()]);
      });

      expect(result.current.activeScores).not.toBeNull();
      expect(result.current.activeSuggestions).toHaveLength(1);

      // Reset
      act(() => {
        result.current.resetAll();
      });

      expect(result.current.activeScores).toBeNull();
      expect(result.current.activeSuggestions).toEqual([]);
    });

    it("does not reset config", () => {
      const { result } = renderHook(() => useFieldCheckState());

      // Set config and data
      act(() => {
        result.current.updateConfig({ dialect: Dialects.BRITISH_ENGLISH });
        result.current.setActiveScores(createMockScores());
      });

      // Reset
      act(() => {
        result.current.resetAll();
      });

      // Config should remain, scores should be reset
      expect(result.current.config.dialect).toBe(Dialects.BRITISH_ENGLISH);
      expect(result.current.activeScores).toBeNull();
    });
  });

  it("returns stable function references", () => {
    const { result, rerender } = renderHook(() => useFieldCheckState());

    const initialSetActiveScores = result.current.setActiveScores;
    const initialSetActiveSuggestions = result.current.setActiveSuggestions;
    const initialUpdateConfig = result.current.updateConfig;
    const initialResetAll = result.current.resetAll;

    rerender();

    // Functions should be the same reference after rerender
    expect(result.current.updateConfig).toBe(initialUpdateConfig);
    expect(result.current.resetAll).toBe(initialResetAll);
    // Note: setState functions from useState are always stable, but we check anyway
    expect(result.current.setActiveScores).toBe(initialSetActiveScores);
    expect(result.current.setActiveSuggestions).toBe(initialSetActiveSuggestions);
  });
});
