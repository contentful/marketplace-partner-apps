import type { ErrorResponse, ValidationErrorResponse } from "../api-client";

// Extract a human-readable error message from various API error shapes
const extractNonEmptyDetail = (value: unknown): string | null => {
  if (typeof value === "object" && value !== null) {
    const d = (value as { detail?: unknown }).detail;
    if (typeof d === "string") {
      const trimmed = d.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
  }
  return null;
};

type ApiErrorResponse = ErrorResponse | ValidationErrorResponse;

// Narrower, consolidated type guard for API error responses (regular or validation)
const isApiErrorResponse = (value: unknown): value is ApiErrorResponse => {
  if (typeof value !== "object" || value === null) return false;
  const hasDetail = extractNonEmptyDetail(value) !== null;
  const status = (value as { status?: unknown }).status;
  if (!hasDetail || typeof status !== "number") return false;
  // If we need to distinguish later, ValidationErrorResponse may include `errors: ValidationErrorItem[]`
  return true;
};

/**
 * Extracts a user-friendly error message from various error formats.
 * Handles:
 * - Error instances
 * - API error responses (ErrorResponse and ValidationErrorResponse)
 * - Objects with detail property
 * - Plain strings
 * - Unknown error types (returns default message)
 *
 * @param error - The error to extract a message from
 * @returns A user-friendly error message string
 */
export const getApiErrorMessage = (error: unknown): string => {
  try {
    if (error instanceof Error && typeof error.message === "string" && error.message) {
      return error.message;
    }
    if (isApiErrorResponse(error)) {
      return extractNonEmptyDetail(error) ?? "An error occurred";
    }
    const detail = extractNonEmptyDetail(error);
    if (detail) {
      return detail;
    }
    if (typeof error === "string") return error;
  } catch {
    // fallthrough
  }
  return "An error occurred";
};
