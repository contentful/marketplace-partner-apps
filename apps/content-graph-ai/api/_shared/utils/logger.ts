/**
 * Structured JSON logger.
 *
 * All log output is structured JSON so it's machine-parseable by
 * Vercel, Datadog, CloudWatch, or any log aggregator.
 *
 * Usage:
 *   import { logger } from "./logger.js";
 *   logger.info("classification complete", { entryId, durationMs });
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, msg: string, meta?: Record<string, unknown>) {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  };

  switch (level) {
    case "error":
      console.error(JSON.stringify(entry));
      break;
    case "warn":
      console.warn(JSON.stringify(entry));
      break;
    default:
      console.log(JSON.stringify(entry));
  }
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) =>
    log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log("error", msg, meta),
};
