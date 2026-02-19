/**
 * Type utilities for extracting data from API responses
 */

import type { Suggestion } from "../../../../api-client/types.gen";

/**
 * Safely extracts nested values from an object using a path
 */
export function extractScores(data: unknown, path: string[]): unknown {
  let current = data;

  for (const key of path) {
    if (typeof current !== "object" || current === null) {
      return null;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current;
}

/**
 * Extracts workflow status from API response
 */
export function extractWorkflowStatus(data: unknown): string | null {
  const status = extractScores(data, ["workflow", "status"]);
  return typeof status === "string" ? status : null;
}

/**
 * Type guard to check if data is a Suggestion array
 */
export function isSuggestionArray(data: unknown): data is Suggestion[] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(
    (item) =>
      typeof item === "object" && item !== null && "suggestion" in item && "position" in item,
  );
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

/**
 * Type guard to check if a value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
