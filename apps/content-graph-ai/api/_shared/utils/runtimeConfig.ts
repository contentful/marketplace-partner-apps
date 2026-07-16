import type { VercelResponse } from "@vercel/node";

export function getMissingEnvVars(envVarNames: string[]): string[] {
  return envVarNames.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim().length === 0;
  });
}

export function requireEnvVars(
  res: VercelResponse,
  label: string,
  envVarNames: string[],
): boolean {
  const missing = getMissingEnvVars(envVarNames);
  if (missing.length === 0) {
    return true;
  }

  res.status(503).json({
    error: `${label} is not configured`,
    missing,
  });
  return false;
}

export function sendSafeRouteError(
  res: VercelResponse,
  publicMessage: string,
  error: unknown,
  context: string,
): void {
  console.error(
    JSON.stringify({
      level: "error",
      context,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  res.status(500).json({ error: publicMessage });
}
