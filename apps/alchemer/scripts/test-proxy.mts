// Local harness for functions/alchemerProxy.ts: imports the real handler and
// calls it directly with a synthetic event/context, so the function logic and
// the live Alchemer API can be exercised without uploading a bundle or going
// through the CMA app-action round trip.
//
// What this deliberately bypasses (so it is NOT an end-to-end test):
// - Contentful's parameter-schema validation from contentful-app-manifest.json
// - the function sandbox's allowNetworks egress restriction
// - real installation parameters (credentials come from env vars instead)
//
// Usage (Node >= 22.18 required for built-in TypeScript type stripping):
//   npm run test:proxy -- testConnection
//   npm run test:proxy -- listSurveys [page]
//   npm run test:proxy -- getSurvey <surveyId>
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-proxy.mts <action> [arg]
//
// Credentials are read from ALCHEMER_API_TOKEN / ALCHEMER_API_TOKEN_SECRET
// (optionally ALCHEMER_API_HOST), from the environment or from .env.

// Node's type stripping does not resolve extensionless imports; the .ts/.mts
// extensions are required here (harmless: scripts/ is outside both tsconfigs).
import { handler } from '../functions/alchemerProxy.ts';
import { loadDotenv } from './lib/env.mts';

function usage(message?: string): never {
  if (message) console.error(`Error: ${message}\n`);
  console.error(
    [
      'Usage:',
      '  node scripts/test-proxy.mts testConnection',
      '  node scripts/test-proxy.mts listSurveys [page]',
      '  node scripts/test-proxy.mts getSurvey <surveyId>',
      '',
      'Requires ALCHEMER_API_TOKEN and ALCHEMER_API_TOKEN_SECRET (env or .env);',
      'ALCHEMER_API_HOST is optional (defaults to api.alchemer.com).',
    ].join('\n')
  );
  process.exit(1);
}

loadDotenv();

const [action, arg] = process.argv.slice(2);
if (!action) usage();

let body: Record<string, unknown>;
switch (action) {
  case 'testConnection':
    body = { action };
    break;
  case 'listSurveys':
    body = { action, page: arg ? Number(arg) : 1 };
    if (arg && !Number.isInteger(body.page as number)) usage(`page must be an integer, got "${arg}"`);
    break;
  case 'getSurvey':
    if (!arg) usage('getSurvey needs a surveyId argument');
    body = { action, surveyId: arg };
    break;
  default:
    // Pass unknown actions through on purpose: it exercises the handler's own
    // "Unsupported action" branch instead of duplicating that check here.
    body = { action };
}

// Missing credentials are also passed through so the handler's configuration
// error path stays testable; warn so a typo'd env var is not mistaken for it.
if (!process.env.ALCHEMER_API_TOKEN || !process.env.ALCHEMER_API_TOKEN_SECRET) {
  console.error('Warning: ALCHEMER_API_TOKEN / ALCHEMER_API_TOKEN_SECRET not set; expect the not-configured error.');
}

// Only the fields the handler reads are provided; the casts stand in for the
// full FunctionEvent/FunctionEventContext shapes Contentful would send.
const event = { type: 'appaction.call', body, headers: {} } as any;
const context = {
  appInstallationParameters: {
    apiToken: process.env.ALCHEMER_API_TOKEN,
    apiTokenSecret: process.env.ALCHEMER_API_TOKEN_SECRET,
    apiHost: process.env.ALCHEMER_API_HOST ?? '',
  },
} as any;

const result = await handler(event, context);
// The handler already console.logs its request/response summaries; this final
// line is the JSON the frontend would receive as response.body.
console.log('\nresult:');
console.log(JSON.stringify(result, null, 2));
// Non-zero exit on ok:false so the script is usable from other tooling/CI.
if ((result as any)?.ok === false) process.exit(2);
