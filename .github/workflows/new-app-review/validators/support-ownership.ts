import fs from 'fs';
import path from 'path';
import type { ValidatorOptions, ValidatorResult } from '../../types';

const MANIFEST_FILENAME = 'SUPPORT_OWNERSHIP.md';
const MANIFEST_PATH = path.join(process.cwd(), MANIFEST_FILENAME);

/**
 * Parses SUPPORT_OWNERSHIP.md table and returns the set of app ids (first column).
 * Table format: | App id | App name | Support owner | Support link |
 * Rows after the header and separator are data; first cell = app id.
 */
function parseSupportOwnershipManifest(content: string): Set<string> {
  const appIds = new Set<string>();
  const lines = content.split(/\r?\n/);

  let foundHeader = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) continue;

    const cells = trimmed
      .slice(1, -1)
      .split('|')
      .map((cell) => cell.trim());

    // Skip separator row (e.g. |--------|---------|...)
    if (cells[0]?.replace(/-/g, '') === '') continue;

    // Skip header row (optional: we could require "App id" in first cell)
    if (cells[0]?.toLowerCase() === 'app id') {
      foundHeader = true;
      continue;
    }

    if (cells[0]) {
      appIds.add(cells[0]);
    }
  }

  return appIds;
}

export const validate = async (_options: ValidatorOptions, newAppDir: string, _files: unknown[]): Promise<ValidatorResult> => {
  // newAppDir is e.g. "apps/abtasty" -> app id = "abtasty"
  const appId = path.basename(newAppDir);

  if (!fs.existsSync(MANIFEST_PATH)) {
    return {
      result: false,
      message: `SUPPORT_OWNERSHIP.md is missing. When adding a new app you must add this file with a table listing support ownership. Format: | App id | App name | Support owner | Support link |. Add a row for "${appId}". See README for details.`,
    };
  }

  const content = fs.readFileSync(MANIFEST_PATH, 'utf-8');
  const appIds = parseSupportOwnershipManifest(content);

  if (!appIds.has(appId)) {
    return {
      result: false,
      message: `Add an entry for app "${appId}" to SUPPORT_OWNERSHIP.md. The table must include a row with App id "${appId}" and the Support owner (Contentful or the partner name). See README for format.`,
    };
  }

  return {
    result: true,
    message: 'Support ownership check passed',
  };
};
