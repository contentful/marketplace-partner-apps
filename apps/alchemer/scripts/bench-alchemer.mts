// Raw Alchemer API latency check: times exactly the three calls the app
// makes (testConnection, listSurveys, getSurvey) with plain fetch, bypassing
// the proxy handler and Contentful entirely. If these numbers are slow, the
// Alchemer API is slow, full stop — nothing of ours is in the path.
//
// Usage (Node >= 22.18):
//   npm run bench:alchemer
//   npm run bench:alchemer -- 1234567
//   node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/bench-alchemer.mts [surveyId]
//
// Without a surveyId, the getSurvey call uses the first survey returned by
// the list call. Credentials come from ALCHEMER_API_TOKEN /
// ALCHEMER_API_TOKEN_SECRET (optionally ALCHEMER_API_HOST), env or .env.
//
// Gotcha: Alchemer serves identical GETs from a 60-second cache, so a second
// run within a minute measures the cache, not the API. Wait a minute between
// runs for honest numbers.

import { loadDotenv } from './lib/env.mts';

// A single Alchemer call slower than this gets flagged; chosen because the
// picker feels sluggish once each page costs multiple seconds.
const SLOW_MS = 2000;

loadDotenv();

const token = process.env.ALCHEMER_API_TOKEN;
const secret = process.env.ALCHEMER_API_TOKEN_SECRET;
if (!token || !secret) {
  console.error('ALCHEMER_API_TOKEN and ALCHEMER_API_TOKEN_SECRET are required (env or .env).');
  process.exit(1);
}
const host = process.env.ALCHEMER_API_HOST || 'api.alchemer.com';

type Timed = { status: number | 'network error'; ms: number; body?: any };

// Times request-to-body-fully-read: that is what the proxy handler pays, not
// just time-to-first-byte. The credential query parameters are appended here
// and never printed.
async function timedGet(pathAndQuery: string): Promise<Timed> {
  const sep = pathAndQuery.includes('?') ? '&' : '?';
  const url = `https://${host}${pathAndQuery}${sep}api_token=${encodeURIComponent(token!)}&api_token_secret=${encodeURIComponent(secret!)}`;
  const start = Date.now();
  try {
    const res = await fetch(url);
    const body = await res.json().catch(() => undefined);
    return { status: res.status, ms: Date.now() - start, body };
  } catch {
    return { status: 'network error', ms: Date.now() - start };
  }
}

function report(label: string, pathAndQuery: string, t: Timed, note = ''): boolean {
  const slow = t.ms >= SLOW_MS;
  const cols = [label.padEnd(16), `GET ${pathAndQuery}`.padEnd(44), String(t.status).padStart(4), `${t.ms}ms`.padStart(8), slow ? 'SLOW' : '', note];
  console.log(cols.join('  ').trimEnd());
  return slow;
}

console.log(`Alchemer API latency check against ${host}\n`);

let anySlow = false;
let anyFailed = false;

// Same order and shape as the app: testConnection first (cheapest), then the
// list page the picker opens with, then a single-survey fetch.
const test = await timedGet('/v5/survey?resultsperpage=1');
anySlow = report('testConnection', '/v5/survey?resultsperpage=1', test) || anySlow;
anyFailed = anyFailed || test.status !== 200;

const list = await timedGet('/v5/survey?resultsperpage=50&page=1');
const listCount = Array.isArray(list.body?.data) ? list.body.data.length : 0;
anySlow =
  report(
    'listSurveys',
    '/v5/survey?resultsperpage=50&page=1',
    list,
    list.status === 200 ? `${listCount} surveys, ${list.body?.total_pages ?? '?'} page(s)` : ''
  ) || anySlow;
anyFailed = anyFailed || list.status !== 200;

const surveyId = process.argv[2] ?? list.body?.data?.[0]?.id;
if (surveyId) {
  const single = await timedGet(`/v5/survey/${surveyId}`);
  anySlow = report('getSurvey', `/v5/survey/${surveyId}`, single) || anySlow;
  anyFailed = anyFailed || single.status !== 200;
} else {
  console.log('getSurvey         skipped (no surveys in the account and no surveyId argument)');
}

console.log(
  `\n${
    anySlow
      ? `At least one call took ${SLOW_MS}ms or more - the Alchemer API is the bottleneck.`
      : `All calls under ${SLOW_MS}ms - the Alchemer API is responding normally.`
  }`
);
console.log('Reminder: identical GETs are cached by Alchemer for 60 seconds; wait a minute between runs.');

if (anyFailed) process.exit(2);
