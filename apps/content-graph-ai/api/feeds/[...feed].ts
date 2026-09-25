import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchGraph } from "../_shared/graph/pgGraph.js";
import { validateAppToken } from "../_shared/utils/appAuth.js";
import { sendSafeRouteError } from "../_shared/utils/runtimeConfig.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const feed = Array.isArray(req.query.feed)
    ? req.query.feed.join("/")
    : req.query.feed;

  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  if (!validateAppToken(req, res)) return;

  if (!feed?.startsWith("recommendations.")) {
    return res
      .status(404)
      .json({ error: `Unknown feed: ${feed || "missing"}` });
  }

  try {
    const { persona, funnel, industry, topic, limit } = req.query;
    const results = await searchGraph({
      persona: persona as string,
      funnel: funnel as string,
      industry: industry as string,
      topic: topic as string,
      limit: limit ? parseInt(limit as string, 10) : 6,
    });

    if (feed.endsWith(".json")) {
      const items = results.map((result) => ({
        id: result.id,
        title: result.label,
        url: result.url,
        score: result.score,
        why: result.why,
      }));
      return res.status(200).json({ persona, funnel, industry, topic, items });
    }

    if (feed.endsWith(".html")) {
      const items = results
        .map((result) => {
          const reasons = (result.why || [])
            .slice(0, 3)
            .map((why: string) => {
              const parts = why.split(":");
              return parts.length === 2 ? `${parts[0]}=${parts[1]}` : why;
            })
            .join(", ");
          const title = result.label || result.id;
          const anchor = result.url
            ? `<a href="${result.url}">${title}</a>`
            : title;
          const score =
            typeof result.score === "number"
              ? ` (score: ${result.score.toFixed(2)})`
              : "";
          return `<li><strong>${anchor}</strong> <em>${score}</em><br/><small>${reasons}</small></li>`;
        })
        .join("\n");

      return res
        .status(200)
        .send(`<!doctype html><html><body><ul>${items}</ul></body></html>`);
    }

    return res.status(404).json({ error: `Unknown feed format: ${feed}` });
  } catch (error) {
    return sendSafeRouteError(
      res,
      "Feed request failed",
      error,
      "recommendation-feed-route",
    );
  }
}
