/**
 * In-memory sliding window rate limiter.
 *
 * Designed for serverless — no external dependencies.
 * For multi-instance deployments, replace with Redis or Upstash.
 *
 * Usage:
 *   import { rateLimit } from "./rateLimit.js";
 *   const limiter = rateLimit({ windowMs: 60_000, maxRequests: 30 });
 *
 *   // In your handler:
 *   if (!limiter.check(req, res)) return; // 429 already sent
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

interface RateLimitOptions {
  /** Time window in milliseconds (default: 60 seconds) */
  windowMs?: number;
  /** Max requests per window per key (default: 30) */
  maxRequests?: number;
  /** Function to extract the rate limit key from a request (default: IP) */
  keyFn?: (req: VercelRequest) => string;
}

interface WindowEntry {
  timestamps: number[];
}

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = 60_000,
    maxRequests = 30,
    keyFn = (req) =>
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      "unknown",
  } = options;

  const windows = new Map<string, WindowEntry>();

  // Cleanup stale entries every 5 minutes to prevent memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of windows) {
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);
      if (entry.timestamps.length === 0) windows.delete(key);
    }
  }, 5 * 60_000).unref();

  return {
    /**
     * Check rate limit and send 429 if exceeded.
     * Returns true if the request is allowed, false if blocked.
     */
    check(req: VercelRequest, res: VercelResponse): boolean {
      const key = keyFn(req);
      const now = Date.now();

      let entry = windows.get(key);
      if (!entry) {
        entry = { timestamps: [] };
        windows.set(key, entry);
      }

      // Slide window
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

      if (entry.timestamps.length >= maxRequests) {
        const retryAfter = Math.ceil(
          (entry.timestamps[0]! + windowMs - now) / 1000,
        );
        res.setHeader("Retry-After", String(retryAfter));
        res.setHeader("X-RateLimit-Limit", String(maxRequests));
        res.setHeader("X-RateLimit-Remaining", "0");
        res.status(429).json({
          error: "Too many requests",
          retryAfterSeconds: retryAfter,
        });
        return false;
      }

      entry.timestamps.push(now);
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader(
        "X-RateLimit-Remaining",
        String(maxRequests - entry.timestamps.length),
      );
      return true;
    },
  };
}
