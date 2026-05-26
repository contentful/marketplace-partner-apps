import type { AgentResultQualitySummary } from "../types";

export function parseAgentResultQuality(result: unknown): AgentResultQualitySummary | null {
  if (!result || typeof result !== "object") return null;
  const q = (result as { quality?: unknown }).quality;
  if (!q || typeof q !== "object") return null;
  const score = (q as { score?: unknown }).score;
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  const status = (q as { status?: unknown }).status;
  return {
    score,
    ...(typeof status === "string" ? { status } : {}),
  };
}
