import type { VercelRequest, VercelResponse } from "@vercel/node";
import { searchGraph } from "../_shared/graph/pgGraph.js";
import { validateAppToken } from "../_shared/utils/appAuth.js";
import { sendSafeRouteError } from "../_shared/utils/runtimeConfig.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  if (!validateAppToken(req, res)) return;

  try {
    const { persona, stage, industry, limit } = req.query;

    const results = await searchGraph({
      persona: persona as string,
      funnel: stage as string,
      industry: industry as string,
      limit: limit ? parseInt(limit as string) : 3,
    });

    return res.status(200).json({ persona, stage, industry, results });
  } catch (error) {
    return sendSafeRouteError(
      res,
      "CRM recommendation request failed",
      error,
      "crm-recommendations-route",
    );
  }
}
