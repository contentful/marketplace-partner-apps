/**
 * Health check endpoint.
 *
 * GET /api/health → structured status with dependency checks.
 * Used by load balancers, uptime monitors, and dev server smoke tests.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { hasPostgres, db } from "./_shared/storage/index.js";

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  uptime: number;
  checks: {
    env: { status: string; missing: string[] };
    database: { status: string; latencyMs?: number; error?: string };
  };
}

const REQUIRED_ENV = ["CONTENT_GRAPH_APP_TOKEN"];
const OPTIONAL_ENV = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "LANGSMITH_API_KEY",
  "SLACK_BOT_TOKEN",
];

const startTime = Date.now();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).send("Method not allowed");

  const missingRequired = REQUIRED_ENV.filter((k) => !process.env[k]);
  const missingOptional = OPTIONAL_ENV.filter((k) => !process.env[k]);
  const envStatus =
    missingRequired.length > 0
      ? "unhealthy"
      : missingOptional.length > 0
        ? "degraded"
        : "healthy";

  let dbStatus: HealthCheck["checks"]["database"] = {
    status: "skipped",
  };

  if (hasPostgres) {
    const dbStart = Date.now();
    try {
      await db.query("SELECT 1");
      dbStatus = { status: "healthy", latencyMs: Date.now() - dbStart };
    } catch (err) {
      dbStatus = {
        status: "unhealthy",
        latencyMs: Date.now() - dbStart,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  const overall =
    envStatus === "unhealthy" || dbStatus.status === "unhealthy"
      ? "unhealthy"
      : envStatus === "degraded" || dbStatus.status === "degraded"
        ? "degraded"
        : "healthy";

  const health: HealthCheck = {
    status: overall,
    version:
      (process.env.GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA)?.slice(
        0,
        7,
      ) || "dev",
    timestamp: new Date().toISOString(),
    uptime: Math.round((Date.now() - startTime) / 1000),
    checks: {
      env: { status: envStatus, missing: missingRequired },
      database: dbStatus,
    },
  };

  const statusCode = overall === "unhealthy" ? 503 : 200;
  return res.status(statusCode).json(health);
}
