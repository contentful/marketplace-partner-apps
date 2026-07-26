import type { VercelRequest, VercelResponse } from "@vercel/node";
import { contentMix } from "../_shared/graph/pgGraph.js";
import { validateAppToken } from "../_shared/utils/appAuth.js";
import { sendSafeRouteError } from "../_shared/utils/runtimeConfig.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).send("Method not allowed");
  }

  if (!validateAppToken(req, res)) return;

  try {
    const mix = await contentMix();
    return res.status(200).json(mix);
  } catch (error) {
    return sendSafeRouteError(
      res,
      "Analytics request failed",
      error,
      "analytics-content-mix-route",
    );
  }
}
