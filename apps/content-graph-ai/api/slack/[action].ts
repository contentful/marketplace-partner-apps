import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchGraph } from "../_shared/graph/pgGraph.js";
import { validateSlackSignature } from "../_shared/utils/slackAuth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = Array.isArray(req.query.action)
    ? req.query.action[0]
    : req.query.action;

  if (!action) {
    return res.status(400).json({ error: "Missing slack action" });
  }

  if (action === "health") {
    if (req.method !== "GET") {
      return res.status(405).send("Method not allowed");
    }

    return res.status(200).json({
      ok: true,
      signingSecretConfigured: !!process.env.SLACK_SIGNING_SECRET,
      time: new Date().toISOString(),
    });
  }

  if (action === "cg") {
    if (req.method !== "POST") {
      return res.status(405).send("Method not allowed");
    }

    if (!validateSlackSignature(req, res)) return;

    try {
      const params = req.body || {};
      const text = params.text || "";
      const filters: Record<string, string | number | undefined> = {};

      text.split(/\s+/).forEach((pair: string) => {
        const [key, value] = pair.split("=");
        if (!key || !value) return;
        if (key === "limit") {
          const parsed = parseInt(value, 10);
          if (!Number.isNaN(parsed)) filters.limit = parsed;
          return;
        }
        if (
          ["persona", "funnel", "industry", "topic", "public"].includes(key)
        ) {
          filters[key] = value;
        }
      });

      const limitNum =
        typeof filters.limit === "number" ? (filters.limit as number) : 3;

      if (!text || /^(help|\?)$/i.test(text.trim())) {
        return res.status(200).json({
          response_type: filters.public === "true" ? "in_channel" : "ephemeral",
          text: [
            "*Usage:* /cg persona=<value> funnel=<value> industry=<value> topic=<value> limit=3",
            "Example: /cg persona=decision-makers funnel=consideration industry=finance limit=3",
            "Tip: add public=true to post in-channel.",
          ].join("\n"),
        });
      }

      const results = await searchGraph({
        persona: (filters.persona as string) || undefined,
        funnel: (filters.funnel as string) || undefined,
        industry: (filters.industry as string) || undefined,
        topic: (filters.topic as string) || undefined,
        limit: limitNum,
      });

      if (!results?.length) {
        return res.status(200).json({
          response_type: filters.public === "true" ? "in_channel" : "ephemeral",
          text: `No content found for: ${text || "(no filters)"}`,
        });
      }

      const lines = results.slice(0, limitNum).map((result, index) => {
        const title = result.label || result.id;
        const link = result.url ? `<${result.url}|${title}>` : title;
        const score =
          typeof result.score === "number"
            ? ` (score: ${result.score.toFixed(2)})`
            : "";
        const reasons = Array.isArray(result.why)
          ? result.why
              .slice(0, 3)
              .map((why: string) => {
                const parts = why.split(":");
                return parts.length === 2 ? `${parts[0]}=${parts[1]}` : why;
              })
              .filter(Boolean)
              .join(", ")
          : "";
        return `${index + 1}. ${link}${score}${reasons ? `\n   • ${reasons}` : ""}`;
      });

      const header = `Here are ${lines.length} recommended items${
        filters.persona ? ` for persona: ${filters.persona}` : ""
      }${filters.funnel ? `, funnel: ${filters.funnel}` : ""}${
        filters.industry ? `, industry: ${filters.industry}` : ""
      }${filters.topic ? `, topic: ${filters.topic}` : ""}.`;

      return res.status(200).json({
        response_type: filters.public === "true" ? "in_channel" : "ephemeral",
        text: [header, "", ...lines].join("\n"),
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("[Slack /cg] Error", { error: msg });
      return res.status(200).json({
        response_type: "ephemeral",
        text: "Sorry — couldn’t complete the request. Try /cg help, then check /slack/health and the graph data path.",
      });
    }
  }

  return res.status(404).json({ error: `Unknown slack action: ${action}` });
}
