/**
 * LLM Cost Tracker
 *
 * Tracks token usage and estimated cost across AI providers.
 * Enforces optional monthly budget caps.
 *
 * Usage:
 *   import { trackUsage, estimateCost, checkBudget } from "./costTracker.js";
 *
 *   const usage = { inputTokens: 1500, outputTokens: 500 };
 *   const cost = estimateCost("gemini-2.5-flash", usage);
 *   trackUsage("gemini-2.5-flash", usage, cost);
 *
 *   if (!checkBudget()) {
 *     throw new Error("Monthly LLM budget exceeded");
 *   }
 */

// ── Price per million tokens (USD) — update as providers change pricing ──

export const MODEL_PRICING: Record<
  string,
  { inputPerMillion: number; outputPerMillion: number }
> = {
  // OpenAI
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10.0 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4.1": { inputPerMillion: 2.0, outputPerMillion: 8.0 },
  "gpt-4.1-mini": { inputPerMillion: 0.4, outputPerMillion: 1.6 },
  "gpt-4.1-nano": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
  o3: { inputPerMillion: 10.0, outputPerMillion: 40.0 },
  "o3-mini": { inputPerMillion: 1.1, outputPerMillion: 4.4 },
  "o4-mini": { inputPerMillion: 1.1, outputPerMillion: 4.4 },

  // Anthropic
  "claude-sonnet-4-20250514": { inputPerMillion: 3.0, outputPerMillion: 15.0 },
  "claude-opus-4-20250514": { inputPerMillion: 15.0, outputPerMillion: 75.0 },
  "claude-haiku-4-20250414": { inputPerMillion: 0.8, outputPerMillion: 4.0 },

  // Google
  "gemini-2.5-pro": { inputPerMillion: 1.25, outputPerMillion: 10.0 },
  "gemini-2.5-flash": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gemini-2.0-flash": { inputPerMillion: 0.1, outputPerMillion: 0.4 },
};

// ── Types ────────────────────────────────────────────────────────────

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

interface UsageRecord {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: number;
}

// ── In-memory usage accumulator (reset monthly or on deploy) ─────────

const usageLog: UsageRecord[] = [];
let monthlyTotalUsd = 0;

function getConfiguredMonthlyBudgetUsd(): number | null {
  const rawBudget = process.env.LLM_MONTHLY_BUDGET_USD;
  if (typeof rawBudget !== "string" || rawBudget.trim() === "") return null;

  const budget = Number(rawBudget);
  return Number.isNaN(budget) ? null : budget;
}

export function estimateCost(model: string, usage: TokenUsage): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0; // Unknown model — log but don't block

  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMillion +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion
  );
}

export function trackUsage(
  model: string,
  usage: TokenUsage,
  costUsd: number,
): void {
  const record: UsageRecord = {
    model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd,
    timestamp: Date.now(),
  };
  usageLog.push(record);
  monthlyTotalUsd += costUsd;
}

/**
 * Check if the monthly budget is still available.
 * Set LLM_MONTHLY_BUDGET_USD env var to enforce.
 * Returns true if within budget or no budget set.
 */
export function checkBudget(): boolean {
  const budget = getConfiguredMonthlyBudgetUsd();
  if (budget === null) return true;
  return monthlyTotalUsd < budget;
}

export function getUsageSummary() {
  return {
    totalCostUsd: Math.round(monthlyTotalUsd * 10000) / 10000,
    totalRequests: usageLog.length,
    byModel: Object.fromEntries(
      Object.entries(
        usageLog.reduce(
          (acc, r) => {
            const key = r.model;
            if (!acc[key])
              acc[key] = {
                requests: 0,
                inputTokens: 0,
                outputTokens: 0,
                costUsd: 0,
              };
            acc[key].requests++;
            acc[key].inputTokens += r.inputTokens;
            acc[key].outputTokens += r.outputTokens;
            acc[key].costUsd += r.costUsd;
            return acc;
          },
          {} as Record<
            string,
            {
              requests: number;
              inputTokens: number;
              outputTokens: number;
              costUsd: number;
            }
          >,
        ),
      ).map(([k, v]) => [
        k,
        { ...v, costUsd: Math.round(v.costUsd * 10000) / 10000 },
      ]),
    ),
    budgetUsd: getConfiguredMonthlyBudgetUsd(),
    budgetRemainingUsd: (() => {
      const b = getConfiguredMonthlyBudgetUsd();
      if (b === null) return null;
      return Math.round((b - monthlyTotalUsd) * 10000) / 10000;
    })(),
  };
}
