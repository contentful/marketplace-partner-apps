import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Minimal .env loader shared by the scripts/ harnesses, so the Alchemer
// credentials can live next to the Contentful ones (the file is gitignored).
// Real environment variables win over .env values, matching dotenv's default
// behavior.
export function loadDotenv(): void {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
  let text: string;
  try {
    text = readFileSync(envPath, 'utf8');
  } catch {
    return; // no .env is fine; env vars may be set directly
  }
  for (const line of text.split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    // Trim before unquoting: a trailing space after a pasted token would
    // otherwise be sent to Alchemer and fail as a bad credential.
    process.env[key] = rawValue.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}
