#!/usr/bin/env tsx
/**
 * Backwards-compatible wrapper for the current lightweight setup flow.
 *
 * The old version of this script depended on a removed Mastra tree under
 * `src/mastra/*`. Keep the command name, but route it to the maintained
 * `simple-setup` implementation so the repo no longer advertises a dead path.
 */

import "./simple-setup.ts";
