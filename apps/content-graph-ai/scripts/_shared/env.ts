import "dotenv/config";
import { config as dotenvConfig } from "dotenv";

export function setupEnv(): void {
  dotenvConfig({ path: ".env.production.local", override: false });
  dotenvConfig({ path: ".vercel/.env.production.local", override: true });
}
