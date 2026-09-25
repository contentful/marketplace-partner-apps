/**
 * scriptUtils.ts
 *
 * Shared utilities for scripts. Import with:
 *   import { loadJson, getArgValue, hasFlag, requireEnv, getErrorMessage } from './_shared/scriptUtils.js';
 */

import * as fs from "fs";

/**
 * Read and parse a JSON file. Returns null if the file does not exist or is corrupt.
 */
export function loadJson<T>(file: string): T | null {
  try {
    if (fs.existsSync(file))
      return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    /* missing or corrupt */
  }
  return null;
}

/**
 * Read the value of a named CLI flag from process.argv.
 * Example: `--out path/to/file` → `getArgValue("--out")` returns `"path/to/file"`.
 * Returns undefined if the flag is not present or has no following value.
 */
export function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : undefined;
}

/**
 * Returns true if the given flag appears anywhere in process.argv.
 */
export function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

/**
 * Read a required environment variable. Throws if it is missing or empty.
 */
export function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required env var: ${name}`);
  return val;
}

/**
 * Extract a human-readable message from an unknown caught value.
 */
export function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
