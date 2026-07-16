#!/usr/bin/env tsx

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { URL } from "node:url";
import dotenv from "dotenv";

type VercelRequest = {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, string | string[]>;
  body: unknown;
  rawBody: string;
};
type VercelResponse = {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): VercelResponse;
  json(payload: unknown): VercelResponse;
  send(payload: unknown): VercelResponse;
  end(payload?: unknown): VercelResponse;
};
type Handler = (req: VercelRequest, res: VercelResponse) => Promise<VercelResponse | void | undefined>;

type RouteMatch = {
  handler: () => Promise<Handler>;
  query: Record<string, string | string[]>;
};

const projectRoot = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
);
const publicRoot = path.join(projectRoot, "public");
const vercelConfigPath = path.join(projectRoot, "vercel.json");
const preferredEnvPath = fs.existsSync(
  path.join(projectRoot, ".env.production.local"),
)
  ? path.join(projectRoot, ".env.production.local")
  : path.join(projectRoot, ".env.local");

dotenv.config({ path: preferredEnvPath });

process.env.VERCEL_ENV = "development";
if (!process.env.CONTENT_GRAPH_APP_TOKEN) {
  process.env.CONTENT_GRAPH_ALLOW_UNAUTHENTICATED_DEV = "true";
}

const rewrites: Array<{ source: string; destination: string }> = (() => {
  try {
    const json = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));
    return Array.isArray(json.rewrites) ? json.rewrites : [];
  } catch {
    return [];
  }
})();

const handlerLoaders = {
  health: async () => (await import("../api/health.js")).default,
  execute: async () => (await import("../api/tools/[tool]/execute.js")).default,
  review: async () => (await import("../api/review/[action].js")).default,
  cron: async () => (await import("../api/cron/[job].js")).default,
  graph: async () => (await import("../api/graph/[action].js")).default,
  slack: async () => (await import("../api/slack/[action].js")).default,
  webhook: async () =>
    (await import("../api/webhooks/contentful-classify.js")).default,
  feeds: async () => (await import("../api/feeds/[...feed].js")).default,
  crmRecommendations: async () =>
    (await import("../api/crm/recommendations.js")).default,
  analyticsContentMix: async () =>
    (await import("../api/analytics/content-mix.js")).default,
} as unknown as Record<string, () => Promise<Handler>>;

const contentTypes: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mmd": "text/plain; charset=utf-8",
};

function applyRewrite(pathname: string): string {
  const match = rewrites.find((item) => item.source === pathname);
  return match?.destination || pathname;
}

function parseBody(rawBody: string, contentType: string | undefined) {
  if (!rawBody) return {};

  const normalizedType = (contentType || "").split(";")[0].trim().toLowerCase();
  if (normalizedType === "application/json") {
    try {
      return JSON.parse(rawBody);
    } catch {
      return {};
    }
  }

  if (normalizedType === "application/x-www-form-urlencoded") {
    const params = new URLSearchParams(rawBody);
    const out: Record<string, string | string[]> = {};
    for (const [key, value] of params.entries()) {
      const existing = out[key];
      if (existing === undefined) {
        out[key] = value;
      } else if (Array.isArray(existing)) {
        existing.push(value);
      } else {
        out[key] = [existing, value];
      }
    }
    return out;
  }

  return rawBody;
}

function createResponse(res: http.ServerResponse): VercelResponse {
  const wrapper: VercelResponse = {
    status(code: number) {
      res.statusCode = code;
      return wrapper;
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value);
      return wrapper;
    },
    json(payload: unknown) {
      if (!res.getHeader("content-type")) {
        res.setHeader("content-type", "application/json; charset=utf-8");
      }
      res.end(JSON.stringify(payload));
      return wrapper;
    },
    send(payload: unknown) {
      if (typeof payload === "object" && !Buffer.isBuffer(payload)) {
        return wrapper.json(payload);
      }
      if (!res.getHeader("content-type")) {
        res.setHeader("content-type", "text/plain; charset=utf-8");
      }
      res.end(payload as string | Buffer | undefined);
      return wrapper;
    },
    end(payload?: unknown) {
      res.end(payload as string | Buffer | undefined);
      return wrapper;
    },
  };

  return wrapper;
}

function queryFromUrl(url: URL): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of url.searchParams.entries()) {
    const existing = query[key];
    if (existing === undefined) {
      query[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      query[key] = [existing, value];
    }
  }
  return query;
}

function matchRoute(
  pathname: string,
  baseQuery: Record<string, string | string[]>,
): RouteMatch | null {
  const add = (
    handler: () => Promise<Handler>,
    query: Record<string, string | string[]> = {},
  ): RouteMatch => ({
    handler,
    query: { ...baseQuery, ...query },
  });

  if (pathname === "/api/health") {
    return add(handlerLoaders.health);
  }

  let match = pathname.match(/^\/api\/tools\/([^/]+)\/execute$/);
  if (match) return add(handlerLoaders.execute, { tool: match[1] });

  match = pathname.match(/^\/api\/review\/([^/]+)$/);
  if (match) return add(handlerLoaders.review, { action: match[1] });

  match = pathname.match(/^\/api\/cron\/([^/]+)$/);
  if (match) return add(handlerLoaders.cron, { job: match[1] });

  match = pathname.match(/^\/api\/graph\/([^/]+)$/);
  if (match) return add(handlerLoaders.graph, { action: match[1] });

  match = pathname.match(/^\/api\/slack\/([^/]+)$/);
  if (match) return add(handlerLoaders.slack, { action: match[1] });

  match = pathname.match(/^\/api\/feeds\/(.+)$/);
  if (match) return add(handlerLoaders.feeds, { feed: match[1].split("/") });

  if (pathname === "/api/webhooks/contentful-classify") {
    return add(handlerLoaders.webhook);
  }
  if (pathname === "/api/crm/recommendations") {
    return add(handlerLoaders.crmRecommendations);
  }
  if (pathname === "/api/analytics/content-mix") {
    return add(handlerLoaders.analyticsContentMix);
  }

  return null;
}

function resolveStaticPath(pathname: string): string | null {
  const normalized =
    pathname === "/"
      ? "/index.html"
      : pathname.endsWith("/")
        ? `${pathname}index.html`
        : pathname;
  const absolute = path.join(publicRoot, normalized);
  if (!absolute.startsWith(publicRoot)) return null;
  if (!fs.existsSync(absolute) || fs.statSync(absolute).isDirectory())
    return null;
  return absolute;
}

const server = http.createServer(async (req, res) => {
  try {
    const rawUrl = req.url || "/";
    const url = new URL(rawUrl, "http://127.0.0.1");
    const rewrittenPathname = applyRewrite(url.pathname);
    const rewrittenUrl = new URL(
      rewrittenPathname + url.search,
      "http://127.0.0.1",
    );
    const baseQuery = queryFromUrl(rewrittenUrl);

    const route = matchRoute(rewrittenUrl.pathname, baseQuery);
    if (route) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const rawBody = Buffer.concat(chunks).toString("utf8");
      const body = parseBody(rawBody, req.headers["content-type"]);

      const vercelReq: VercelRequest = {
        method: req.method || "GET",
        url: rewrittenUrl.pathname + rewrittenUrl.search,
        headers: req.headers as Record<string, string | string[] | undefined>,
        query: route.query,
        body,
        rawBody,
      };
      const vercelRes = createResponse(res);
      const handler = await route.handler();
      await handler(vercelReq, vercelRes);
      return;
    }

    const staticPath = resolveStaticPath(rewrittenUrl.pathname);
    if (staticPath) {
      const ext = path.extname(staticPath).toLowerCase();
      res.statusCode = 200;
      res.setHeader(
        "content-type",
        contentTypes[ext] || "application/octet-stream",
      );
      fs.createReadStream(staticPath).pipe(res);
      return;
    }

    res.statusCode = 404;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({ error: "Not found", path: rewrittenUrl.pathname }),
    );
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        error: "Local dev server failed",
        message: error instanceof Error ? error.message : String(error),
      }),
    );
  }
});

const port = Number(process.env.PORT || 3000);
server.listen(port, "127.0.0.1", () => {
  console.log(
    JSON.stringify({
      level: "info",
      event: "local_dev_server_ready",
      port,
      envFile: path.relative(projectRoot, preferredEnvPath),
      appAuthMode: process.env.CONTENT_GRAPH_APP_TOKEN
        ? "token"
        : "allow-unauthenticated-dev",
      url: `http://127.0.0.1:${port}`,
    }),
  );
});
