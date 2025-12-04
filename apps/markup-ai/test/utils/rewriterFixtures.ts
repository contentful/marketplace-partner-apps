// Shared test fixtures and builders to reduce duplication across rewriter tests

import { ScoreOutput, WorkflowInfo, WorkflowStatus } from "../../src/api-client";
import type { FieldCheck } from "../../src/types/content";

export type UnknownRecord = Record<string, unknown>;

export const sharedOriginalScores: ScoreOutput = {
  quality: {
    score: 72,
    grammar: { score: 90, issues: 1 },
    consistency: { score: 80, issues: 2 },
    terminology: { score: 100, issues: 0 },
  },
  analysis: {
    clarity: {
      score: 64,
      flesch_reading_ease: 51.4,
      sentence_complexity: 38.9,
      vocabulary_complexity: 45.6,
      sentence_count: 6,
      word_count: 112,
      average_sentence_length: 18.7,
    },
    tone: {
      score: 78,
      informality: 38.2,
      liveliness: 33.9,
      informality_alignment: 115.8,
      liveliness_alignment: 106.4,
    },
  },
};

export function buildWorkflow(
  type: WorkflowInfo["type"],
  status: WorkflowStatus = WorkflowStatus.COMPLETED,
  id: string = "workflow-123",
): WorkflowInfo {
  return { id, status, type };
}

export function createMockFieldCheck(overrides?: Partial<FieldCheck>): FieldCheck {
  return {
    fieldId: "field1",
    originalValue: "orig",
    isChecking: false,
    checkResponse: null,
    error: null,
    lastUpdated: Date.now(),
    hasRewriteResult: false,
    ...overrides,
  } as FieldCheck;
}
