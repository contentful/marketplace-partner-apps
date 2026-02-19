/**
 * Formatting utilities for content and display values
 */

import { html as beautifyHtml } from "js-beautify";
import type { Dialects, Tones } from "../../../../api-client/types.gen";

/**
 * Formats HTML or XML content with proper indentation
 */
export function formatMarkup(input: string, kind: "html" | "xml"): string {
  try {
    const beautified = beautifyHtml(input, {
      indent_size: 2,
      preserve_newlines: true,
      max_preserve_newlines: 1,
      wrap_line_length: 0,
      end_with_newline: false,
      indent_inner_html: true,
      extra_liners: kind === "html" ? ["head", "body", "html"] : [],
    });

    // Remove excessive newlines
    return beautified.replaceAll(/\n{2,}/g, "\n");
  } catch (error) {
    console.error("Error formatting markup:", error);
    return input; // Return original if formatting fails
  }
}

/**
 * Formats dialect values for display (full names)
 */
export function formatDialect(dialect: Dialects | string | undefined): string {
  if (!dialect) return "";

  const dialectMap: Record<string, string> = {
    american_english: "American English",
    british_english: "British English",
    canadian_english: "Canadian English",
    australian_english: "Australian English",
  };

  return dialectMap[dialect] || dialect;
}

/**
 * Formats dialect values for compact display (abbreviated names)
 */
export function formatDialectShort(dialect: Dialects | string | undefined): string {
  if (!dialect) return "";

  const dialectMap: Record<string, string> = {
    american_english: "American",
    british_english: "British",
    canadian_english: "Canadian",
    australian_english: "Australian",
  };

  return dialectMap[dialect] || dialect;
}

/**
 * Formats tone values for display
 */
export function formatTone(tone: Tones | string | null | undefined): string {
  if (!tone) return "None";

  const toneMap: Record<string, string> = {
    formal: "Formal",
    casual: "Casual",
    professional: "Professional",
    friendly: "Friendly",
    authoritative: "Authoritative",
    empathetic: "Empathetic",
  };

  return toneMap[tone] || tone;
}

/**
 * Capitalizes first letter of a string (for simple tone display)
 */
export function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Formats score values for display (rounds to nearest integer)
 */
export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "N/A";
  return Math.round(score).toString();
}

/**
 * Calculates the delta between two scores
 */
export function calculateScoreDelta(
  current: number | null | undefined,
  baseline: number | null | undefined,
): number | null {
  if (current === null || current === undefined || baseline === null || baseline === undefined) {
    return null;
  }
  return current - baseline;
}
