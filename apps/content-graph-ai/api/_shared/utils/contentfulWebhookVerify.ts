import type { VercelRequest } from "@vercel/node";
import {
  type CanonicalRequest,
  verifyRequest,
  ExpiredRequestException,
} from "@contentful/node-apps-toolkit/requests";

function flattenHeaders(
  headers: VercelRequest["headers"],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  return out;
}

/**
 * Verifies Contentful webhook request verification headers per:
 * https://www.contentful.com/developers/docs/webhooks/request-verification/
 *
 * Uses the same canonical request shape as Contentful's `verifyRequest` (method,
 * path, signed headers, body string) — not a bare HMAC of JSON alone.
 *
 * `CONTENTFUL_WEBHOOK_SIGNING_PATH` — HTTP path Contentful POSTs to (what appears
 * in the first line of the request). Default `/webhooks/contentful` matches
 * `vercel.json` public URL; override if the webhook URL path differs (e.g. direct
 * `/api/...` without a rewrite).
 */
export function verifyContentfulWebhook(
  req: VercelRequest,
  secret: string,
): boolean {
  const signingPath =
    process.env.CONTENTFUL_WEBHOOK_SIGNING_PATH?.trim() ||
    "/webhooks/contentful";

  const ttlRaw = process.env.CONTENTFUL_WEBHOOK_VERIFY_TTL_SECONDS;
  const ttlSeconds =
    ttlRaw === undefined || ttlRaw === "" ? 120 : Number.parseInt(ttlRaw, 10);
  const ttl = Number.isFinite(ttlSeconds) ? ttlSeconds : 120;

  let parsedBody: unknown;
  try {
    parsedBody = req.body;
  } catch {
    return false;
  }

  const bodyString =
    typeof parsedBody === "string"
      ? parsedBody
      : JSON.stringify(parsedBody ?? {});

  const canonicalRequest: CanonicalRequest = {
    path: signingPath,
    headers: flattenHeaders(req.headers),
    method: "POST",
    body: bodyString,
  };

  const secrets = [
    secret,
    process.env.CONTENTFUL_WEBHOOK_SECRET_PREVIOUS,
  ].filter((s): s is string => typeof s === "string" && s.length > 0);

  try {
    for (const s of secrets) {
      if (verifyRequest(s, canonicalRequest, ttl === 0 ? 0 : ttl)) {
        return true;
      }
    }
    return false;
  } catch (error) {
    if (error instanceof ExpiredRequestException) {
      return false;
    }
    // Malformed signing headers or other verification errors — treat as failed auth.
    return false;
  }
}
