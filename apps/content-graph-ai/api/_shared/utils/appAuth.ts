import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "crypto";

function getHeaderValue(
  req: VercelRequest,
  headerName: string,
): string | undefined {
  const value = req.headers[headerName];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function getBearerToken(req: VercelRequest): string | undefined {
  const authHeader = getHeaderValue(req, "authorization");
  if (!authHeader) return undefined;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function safeTokenEqual(expectedToken: string, providedToken: string): boolean {
  const expected = Buffer.from(expectedToken, "utf8");
  const provided = Buffer.from(providedToken, "utf8");

  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

/**
 * Validates the X-App-Token header against CONTENT_GRAPH_APP_TOKEN env var.
 * If the env var is not set, auth fails closed unless explicit insecure dev
 * bypass is enabled outside production.
 * Returns true if authorized, false if rejected (response already sent).
 */
export function validateAppToken(
  req: VercelRequest,
  res: VercelResponse,
): boolean {
  const expectedToken = process.env.CONTENT_GRAPH_APP_TOKEN;

  const allowUnauthenticatedDev =
    process.env.CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV === "true" &&
    process.env.VERCEL_ENV !== "production";

  if (!expectedToken) {
    if (allowUnauthenticatedDev) return true;
    res.status(503).json({ error: "App auth is not configured" });
    return false;
  }

  const providedToken =
    getHeaderValue(req, "x-app-token") || getBearerToken(req);

  if (!providedToken) {
    res.status(401).json({ error: "Missing app authentication token" });
    return false;
  }

  if (!safeTokenEqual(expectedToken, providedToken)) {
    res.status(403).json({ error: "Invalid app token" });
    return false;
  }

  return true;
}

export function validateCronToken(
  req: VercelRequest,
  res: VercelResponse,
): boolean {
  const expectedToken =
    process.env.CRON_SECRET || process.env.CONTENT_GRAPH_CRON_TOKEN;

  if (!expectedToken) {
    res.status(503).json({ error: "Cron auth is not configured" });
    return false;
  }

  const providedToken = getBearerToken(req);
  if (!providedToken) {
    res.status(401).json({ error: "Missing cron authentication token" });
    return false;
  }

  if (!safeTokenEqual(expectedToken, providedToken)) {
    res.status(403).json({ error: "Invalid cron token" });
    return false;
  }

  return true;
}
