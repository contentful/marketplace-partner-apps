import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "crypto";
import { requireEnvVars } from "./runtimeConfig.js";

function getHeaderValue(
  req: VercelRequest,
  headerName: string,
): string | undefined {
  const value = req.headers[headerName];
  if (Array.isArray(value)) return value[0];
  return typeof value === "string" ? value : undefined;
}

function serializeBody(body: VercelRequest["body"]): string {
  if (typeof body === "string") return body;
  if (!body || typeof body !== "object") return "";

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, String(item));
      }
      continue;
    }
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return params.toString();
}

export function validateSlackSignature(
  req: VercelRequest,
  res: VercelResponse,
  maxAgeSeconds = 60 * 5,
): boolean {
  if (!requireEnvVars(res, "Slack auth", ["SLACK_SIGNING_SECRET"])) {
    return false;
  }

  const timestampRaw = getHeaderValue(req, "x-slack-request-timestamp");
  const signature = getHeaderValue(req, "x-slack-signature");
  if (!timestampRaw || !signature) {
    res.status(401).json({ error: "Missing Slack signature headers" });
    return false;
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    res.status(401).json({ error: "Invalid Slack timestamp" });
    return false;
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestamp);
  if (ageSeconds > maxAgeSeconds) {
    res.status(401).json({ error: "Expired Slack signature" });
    return false;
  }

  const body = serializeBody(req.body);
  const baseString = `v0:${timestampRaw}:${body}`;
  const digest = createHmac("sha256", process.env.SLACK_SIGNING_SECRET!)
    .update(baseString)
    .digest("hex");
  const expected = `v0=${digest}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    res.status(403).json({ error: "Invalid Slack signature" });
    return false;
  }

  return true;
}
