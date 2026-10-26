import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, hasPostgres } from "../_shared/storage/index.js";
import { validateAppToken } from "../_shared/utils/appAuth.js";
import { sendSafeRouteError } from "../_shared/utils/runtimeConfig.js";
import {
  contentMix,
  getContentGaps,
  getRelatedContent,
  searchGraph,
  type EdgeRel,
} from "../_shared/graph/pgGraph.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = Array.isArray(req.query.action)
    ? req.query.action[0]
    : req.query.action;

  if (!action) {
    return res.status(400).json({ error: "Missing graph action" });
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!validateAppToken(req, res)) return;

  try {
    if (action === "search") {
      const { persona, funnel, industry, topic, limit } = req.query;
      const results = await searchGraph({
        persona: persona as string,
        funnel: funnel as string,
        industry: industry as string,
        topic: topic as string,
        limit: limit ? parseInt(limit as string, 10) : 10,
      });
      return res.status(200).json({ results });
    }

    if (action === "gaps") {
      const gaps = await getContentGaps();
      return res.status(200).json({ gaps });
    }

    if (action === "serp") {
      const { topic, limit } = req.query;
      const results = await searchGraph({
        topic: topic as string,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });
      return res.status(200).json({ results });
    }

    if (action === "related") {
      const { entryId, rels: relsParam, limit: limitParam } = req.query;

      if (!entryId || typeof entryId !== "string") {
        return res
          .status(400)
          .json({ error: "Missing required query param: entryId" });
      }

      const allowedRels = new Set([
        "SIMILAR_TO",
        "SUPPORTS_PILLAR",
        "COMPETES_FOR_SERP",
        "REFERENCES_CASE_STUDY",
      ]);

      const rels = relsParam
        ? (String(relsParam)
            .split(",")
            .map((rel) => rel.trim())
            .filter((rel) => allowedRels.has(rel)) as EdgeRel[])
        : undefined;

      const limit = limitParam
        ? Math.min(50, parseInt(String(limitParam), 10))
        : 10;
      const related = await getRelatedContent(entryId, { limit, rels });
      return res.status(200).json({ entryId, related });
    }

    if (action === "stats") {
      const stats: Record<string, unknown> = {
        generatedAt: new Date().toISOString(),
      };

      if (hasPostgres) {
        const [runsResult, graphResult] = await Promise.allSettled([
          db.query(`
            select
              count(*)::int as total,
              count(*) filter (where needs_review)::int as needs_review,
              round(avg(overall_conf)::numeric, 2) as avg_conf,
              count(*) filter (where classified_at > now() - interval '7 days')::int as last7d
            from classification_runs
          `),
          db.query(`
            select
              (select count(*)::int from graph_nodes) as nodes,
              (select count(*)::int from graph_edges) as edges,
              (select count(*)::int from graph_edges where rel = 'SIMILAR_TO') as similar_to,
              (select count(*)::int from graph_edges where rel = 'SUPPORTS_PILLAR') as supports_pillar,
              (select count(*)::int from graph_edges where rel = 'COMPETES_FOR_SERP') as competes_for_serp
          `),
        ]);

        if (runsResult.status === "fulfilled" && runsResult.value.rows[0]) {
          const run = runsResult.value.rows[0];
          stats.classifications = {
            total: run.total,
            needsReview: run.needs_review,
            avgConfidence: run.avg_conf,
            last7Days: run.last7d,
          };
        }

        if (graphResult.status === "fulfilled" && graphResult.value.rows[0]) {
          const graph = graphResult.value.rows[0];
          stats.graph = {
            nodes: graph.nodes,
            edges: graph.edges,
            similarTo: graph.similar_to,
            supportsPillar: graph.supports_pillar,
            competesForSerp: graph.competes_for_serp,
          };
        }
      } else {
        stats.classifications = {
          total: 0,
          needsReview: 0,
          avgConfidence: 0,
          last7Days: 0,
        };
        stats.graph = { nodes: 0, edges: 0 };
      }

      try {
        stats.funnelMix = await contentMix();
      } catch {
        // Best-effort metric.
      }

      return res.status(200).json(stats);
    }

    return res.status(404).json({ error: `Unknown graph action: ${action}` });
  } catch (error) {
    return sendSafeRouteError(
      res,
      "Graph request failed",
      error,
      "graph-route",
    );
  }
}
