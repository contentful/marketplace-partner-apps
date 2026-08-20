import assert from "node:assert";
import { createHmac } from "node:crypto";
import { signRequest } from "@contentful/node-apps-toolkit";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  validateAppToken,
  validateCronToken,
} from "../api/_shared/utils/appAuth.js";
import executeHandler from "../api/tools/[tool]/execute.js";
import reviewHandler from "../api/review/[action].js";
import cronHandler from "../api/cron/[job].js";
import graphHandler from "../api/graph/[action].js";
import slackHandler from "../api/slack/[action].js";

type MockResponse = VercelResponse & {
  statusCode: number;
  body: unknown;
};

function createMockResponse(): MockResponse {
  const res: Partial<MockResponse> = {
    statusCode: 200,
    body: undefined,
  };

  res.status = ((code: number) => {
    res.statusCode = code;
    return res as MockResponse;
  }) as MockResponse["status"];

  res.json = ((payload: unknown) => {
    res.body = payload;
    return res as MockResponse;
  }) as MockResponse["json"];

  res.send = ((payload: unknown) => {
    res.body = payload;
    return res as MockResponse;
  }) as MockResponse["send"];

  return res as MockResponse;
}

function createRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: "POST",
    query: {},
    headers: {},
    body: {},
    ...overrides,
  } as VercelRequest;
}

function encodeFormBody(body: Record<string, unknown>): string {
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

function signSlackBody(
  secret: string,
  body: Record<string, unknown>,
  timestamp: number,
) {
  const payload = `v0:${timestamp}:${encodeFormBody(body)}`;
  const signature = `v0=${createHmac("sha256", secret).update(payload).digest("hex")}`;
  return {
    "x-slack-request-timestamp": String(timestamp),
    "x-slack-signature": signature,
  };
}

async function importFreshModule<T>(
  relativePath: string,
  tag: string,
): Promise<T> {
  const url = new URL(relativePath, import.meta.url);
  url.searchParams.set("test", `${tag}-${Date.now()}-${Math.random()}`);
  return (await import(url.href)) as T;
}

async function withEnv<T>(
  overrides: Record<string, string | undefined>,
  fn: () => Promise<T> | T,
): Promise<T> {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await fn();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

let passed = 0;
let failed = 0;

async function test(name: string, fn: () => Promise<void> | void) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(
      `    ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

console.log("\n=== auth utils ===");

await test("validateAppToken rejects when auth is not configured", () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: undefined,
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    () => {
      const req = createRequest();
      const res = createMockResponse();
      assert.strictEqual(validateAppToken(req, res), false);
      assert.strictEqual(res.statusCode, 503);
      assert.deepStrictEqual(res.body, { error: "App auth is not configured" });
    },
  ));

await test("validateAppToken accepts bearer token", () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    () => {
      const req = createRequest({
        headers: { authorization: "Bearer secret-token" },
      });
      const res = createMockResponse();
      assert.strictEqual(validateAppToken(req, res), true);
      assert.strictEqual(res.statusCode, 200);
    },
  ));

await test("validateCronToken rejects when cron auth is not configured", () =>
  withEnv(
    {
      CRON_SECRET: undefined,
      CONTENT_GRAPH_CRON_TOKEN: undefined,
    },
    () => {
      const req = createRequest();
      const res = createMockResponse();
      assert.strictEqual(validateCronToken(req, res), false);
      assert.strictEqual(res.statusCode, 503);
      assert.deepStrictEqual(res.body, {
        error: "Cron auth is not configured",
      });
    },
  ));

console.log("\n=== route handlers ===");

await test("classify execute rejects invalid request body before any external work", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        query: { tool: "classify-content" },
        headers: { "x-app-token": "secret-token" },
        body: { data: {} },
      });
      const res = createMockResponse();
      await executeHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(
        String((res.body as any)?.error || ""),
        /Invalid request body/,
      );
    },
  ));

await test("review approve rejects invalid payload before writeback", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        query: { action: "approve" },
        headers: { "x-app-token": "secret-token" },
        body: { entryId: "" },
      });
      const res = createMockResponse();
      await reviewHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(
        String((res.body as any)?.message || ""),
        /Invalid approve payload/,
      );
    },
  ));

await test("graph route rejects missing app token", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        method: "GET",
        query: { action: "stats" },
      });
      const res = createMockResponse();
      await graphHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, {
        error: "Missing app authentication token",
      });
    },
  ));

await test("graph route accepts bearer token", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        method: "GET",
        query: { action: "stats" },
        headers: { authorization: "Bearer secret-token" },
      });
      const res = createMockResponse();
      await graphHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.ok(typeof (res.body as any)?.generatedAt === "string");
    },
  ));

await test("cron handler rejects requests without bearer token", async () =>
  withEnv(
    {
      CRON_SECRET: "cron-secret",
      CONTENT_GRAPH_CRON_TOKEN: undefined,
    },
    async () => {
      const req = createRequest({
        query: { job: "process-classification-queue" },
      });
      const res = createMockResponse();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, {
        error: "Missing cron authentication token",
      });
    },
  ));

await test("cron handler accepts GET with bearer token (Vercel cron)", async () =>
  withEnv(
    {
      CRON_SECRET: "cron-secret",
      CONTENT_GRAPH_CRON_TOKEN: undefined,
    },
    async () => {
      const req = createRequest({
        method: "GET",
        query: { job: "process-classification-queue" },
        headers: { authorization: "Bearer cron-secret" },
      });
      const res = createMockResponse();
      await cronHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.deepStrictEqual(
        (res.body as { processed?: number })?.processed,
        0,
      );
    },
  ));

await test("webhook handler rejects when secret is not configured", async () =>
  withEnv(
    {
      CONTENTFUL_WEBHOOK_SECRET: undefined,
    },
    async () => {
      const module = await importFreshModule<{
        default: (req: VercelRequest, res: VercelResponse) => Promise<void>;
      }>("../api/webhooks/contentful-classify.js", "no-secret");
      const req = createRequest({
        body: {
          sys: {
            type: "Entry",
            id: "abc",
            contentType: { sys: { id: "page" } },
          },
        },
      });
      const res = createMockResponse();
      await module.default(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.deepStrictEqual(res.body, {
        error: "Webhook auth is not configured",
        missing: ["CONTENTFUL_WEBHOOK_SECRET"],
      });
    },
  ));

await test("webhook handler rejects invalid signatures cleanly", async () =>
  withEnv(
    {
      CONTENTFUL_WEBHOOK_SECRET: "a".repeat(64),
      CONTENTFUL_WEBHOOK_SIGNING_PATH: "/webhooks/contentful",
    },
    async () => {
      const secret = "a".repeat(64);
      const bodyObj = {
        sys: {
          type: "Entry",
          id: "abc",
          contentType: { sys: { id: "page" } },
        },
      };
      const body = JSON.stringify(bodyObj);
      const signed = signRequest(
        secret,
        {
          method: "POST",
          path: "/webhooks/contentful",
          headers: {},
          body,
        },
        Date.now(),
      );
      const badSig =
        signed["x-contentful-signature"].slice(0, -1) +
        (signed["x-contentful-signature"].endsWith("a") ? "b" : "a");

      const module = await importFreshModule<{
        default: (req: VercelRequest, res: VercelResponse) => Promise<void>;
      }>("../api/webhooks/contentful-classify.js", "bad-signature");
      const req = createRequest({
        headers: {
          "x-contentful-signature": badSig,
          "x-contentful-timestamp": signed["x-contentful-timestamp"],
          "x-contentful-signed-headers": signed["x-contentful-signed-headers"],
        },
        body: bodyObj,
      });
      const res = createMockResponse();
      await module.default(req, res);
      assert.strictEqual(res.statusCode, 401);
      assert.deepStrictEqual(res.body, { error: "Invalid signature" });
    },
  ));

await test("webhook handler rejects wrong-length signing secret", async () =>
  withEnv(
    {
      CONTENTFUL_WEBHOOK_SECRET: "short",
    },
    async () => {
      const module = await importFreshModule<{
        default: (req: VercelRequest, res: VercelResponse) => Promise<void>;
      }>("../api/webhooks/contentful-classify.js", "bad-secret-len");
      const req = createRequest({
        body: {
          sys: {
            type: "Entry",
            id: "abc",
            contentType: { sys: { id: "page" } },
          },
        },
      });
      const res = createMockResponse();
      await module.default(req, res);
      assert.strictEqual(res.statusCode, 503);
      assert.deepStrictEqual(res.body, {
        error: "Webhook auth is not configured",
      });
    },
  ));

await test("slack route rejects invalid signatures", async () =>
  withEnv(
    {
      SLACK_SIGNING_SECRET: "slack-secret",
    },
    async () => {
      const body = { text: "help", user_id: "U123" };
      const req = createRequest({
        query: { action: "cg" },
        body,
        headers: {
          "x-slack-request-timestamp": String(Math.floor(Date.now() / 1000)),
          "x-slack-signature": "v0=invalid",
        },
      });
      const res = createMockResponse();
      await slackHandler(req, res);
      assert.strictEqual(res.statusCode, 403);
      assert.deepStrictEqual(res.body, { error: "Invalid Slack signature" });
    },
  ));

await test("slack route accepts valid signed help command", async () =>
  withEnv(
    {
      SLACK_SIGNING_SECRET: "slack-secret",
    },
    async () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const body = { text: "help", user_id: "U123" };
      const req = createRequest({
        query: { action: "cg" },
        body,
        headers: signSlackBody("slack-secret", body, timestamp),
      });
      const res = createMockResponse();
      await slackHandler(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.match(String((res.body as any)?.text || ""), /Usage:/);
    },
  ));

// ---------------------------------------------------------------------------
// review approve — ClassificationShapeSchema validation (v40.2)
// ---------------------------------------------------------------------------

await test("review approve rejects classification missing required fields (empty object)", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        query: { action: "approve" },
        headers: { "x-app-token": "secret-token" },
        body: {
          entryId: "entry-001",
          classification: {}, // missing all required fields
        },
      });
      const res = createMockResponse();
      await reviewHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(
        String((res.body as any)?.message || ""),
        /Invalid approve payload/,
      );
    },
  ));

await test("review approve rejects classification with present but empty assetType.value", async () =>
  withEnv(
    {
      CONTENT_GRAPH_APP_TOKEN: "secret-token",
      CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV: undefined,
      VERCEL_ENV: "production",
    },
    async () => {
      const req = createRequest({
        query: { action: "approve" },
        headers: { "x-app-token": "secret-token" },
        body: {
          entryId: "entry-001",
          classification: {
            assetType: { value: "", confidence: 0.9 }, // empty string
            funnelStage: {
              value: "Awareness/Education (TOFU)",
              confidence: 0.9,
            },
            language: { value: "EN", confidence: 1.0 },
            schemaType: { value: "Article", confidence: 0.9 },
          },
        },
      });
      const res = createMockResponse();
      await reviewHandler(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.match(
        String((res.body as any)?.message || ""),
        /Invalid approve payload/,
      );
    },
  ));

// ---------------------------------------------------------------------------
// Pipeline smoke test — Layer 1 + evidenceMap (no external services)
// ---------------------------------------------------------------------------

import { extractContentSignals } from "../api/_shared/utils/contentSignals.js";
import { buildEvidenceMap } from "../api/_shared/utils/evidenceMap.js";

await test("pipeline smoke: Layer 1 signals + evidenceMap produce consistent output for a product page", async () => {
  // Layer 1 — deterministic signals
  const signals = extractContentSignals(
    "/products/platform",
    "The Contentful Platform — composable content for enterprise teams",
    "Build digital experiences at scale. Contact Sales to get started.",
  );
  assert.strictEqual(signals.urlPattern, "product");
  assert.strictEqual(signals.isProductPage, true);

  // evidenceMap — structural zone filtering
  const zones = [
    {
      zoneType: "hero" as const,
      text: "The Contentful Platform for enterprise teams.",
      weight: 1.0,
      position: 0,
      name: "pageHero",
      contentTypeId: null,
    },
    {
      zoneType: "cta" as const,
      text: "Contact Sales — start your enterprise trial today.",
      weight: 0.6,
      position: 1,
      name: "ctaBlock",
      contentTypeId: null,
    },
    {
      zoneType: "speaker" as const,
      text: "Jane Smith, VP Engineering at Acme Corp",
      weight: 0.4,
      position: 2,
      name: "speakerProfile",
      contentTypeId: null,
    },
  ];

  const evidenceMap = buildEvidenceMap(zones);

  // jobFunction must contain hero text, not speaker text
  assert.ok(
    evidenceMap.jobFunction.text.includes("enterprise teams"),
    "jobFunction evidence must include hero audience text",
  );
  assert.ok(
    !evidenceMap.jobFunction.text.includes("VP Engineering"),
    "jobFunction evidence must exclude speaker zone",
  );

  // funnelStage must contain only cta text
  assert.ok(
    evidenceMap.funnelStage.text.includes("Contact Sales"),
    "funnelStage evidence must include CTA text",
  );
  assert.ok(
    !evidenceMap.funnelStage.text.includes("enterprise teams"),
    "funnelStage evidence must not include hero text",
  );

  // jobLevel can include speaker text (valid seniority evidence)
  assert.ok(
    evidenceMap.jobLevel.text.includes("VP Engineering"),
    "jobLevel evidence may include speaker zone for seniority inference",
  );
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
