/**
 * Shared types used across the API layer.
 */

/**
 * Minimal structured logger interface — compatible with console, pino, winston, etc.
 * Using a specific interface instead of `any` lets TypeScript verify call sites.
 */
export interface Logger {
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
  debug?(msg: string, meta?: Record<string, unknown>): void;
}
