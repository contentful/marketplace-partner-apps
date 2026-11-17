import type { FunctionEventContext, FunctionEventHandler, FunctionTypeEnum, AppActionRequest } from '@contentful/node-apps-toolkit';

// The Alchemer REST API does not send CORS headers, so the browser-side app
// cannot call it directly from the Contentful iframe. This function runs on
// Contentful's infrastructure (no CORS restrictions) and proxies a small,
// fixed set of read-only operations. It is deliberately NOT an open proxy:
// only the actions below are supported, and only against known Alchemer hosts.

/**
 * Parameters of the alchemerApi app action, as validated by Contentful against
 * the schema in contentful-app-manifest.json before this function is invoked.
 * Mirrors AlchemerRequest in src/lib/alchemer.ts.
 */
type AlchemerActionParameters = {
  action: 'listSurveys' | 'getSurvey' | 'testConnection';
  /** Numeric Alchemer survey id; required by getSurvey only. */
  surveyId?: string;
  /** 1-based API page for listSurveys. */
  page?: number;
};

// Alchemer is region-sharded; the region is part of the account, not the
// request, so it has to come from app configuration. All four documented
// regions (apihelp.alchemer.com/help/api-base-domains) are allowed because
// the app targets arbitrary Alchemer customers. Keep this list in sync with
// allowNetworks in contentful-app-manifest.json and the ConfigScreen.
const ALLOWED_HOSTS = ['api.alchemer.com', 'api.alchemer.eu', 'api.alchemer-ca.com', 'api.au.alchemer.com'];
const DEFAULT_HOST = 'api.alchemer.com';
const RESULTS_PER_PAGE = 50;
// There is deliberately no search parameter: the v5 filter grammar has no
// substring operator (see apihelp.alchemer.com/help/filters-v5), and a
// server-side scan proved far too slow at seconds per keystroke. The frontend
// loads all pages once and filters titles in memory instead.

/**
 * The survey shape this function returns to the frontend, which persists it
 * (plus savedAt) into the JSON field. Mirrored in src/lib/alchemer.ts; kept as
 * a deliberate copy because the functions tree builds independently.
 */
type SurveySummary = {
  surveyId: string;
  title: string;
  /** Capitalized by Alchemer ("Launched", "Closed") — consumers compare case-insensitively. */
  status: string;
  /** Public share link; all the delivery side needs to embed the survey. */
  url: string;
  /** Deep link to Alchemer's survey editor for the "Edit in Alchemer" button. */
  editUrl: string;
  /** "YYYY-MM-DD HH:MM:SS" per the Alchemer docs. */
  modifiedOn?: string;
};

/**
 * Normalizes a raw Alchemer survey object (v5 API) into a SurveySummary,
 * tolerating the field variations seen across survey vintages.
 */
function mapSurvey(raw: any, apiHost: string): SurveySummary {
  // The builder UI lives on the app.* counterpart of the regional API host.
  const appHost = apiHost.replace(/^api\./, 'app.');
  return {
    surveyId: String(raw.id),
    // Alchemer has two titles. internal_title is the project name editors see
    // in Alchemer's survey list; title is the respondent-facing one (defaults
    // to "Alchemer Survey"). The LIST endpoint returns only `title` and puts
    // the internal title in it, while the SINGLE endpoint returns both with
    // `title` meaning the public one (verified 2026-11-02 against live
    // responses). Preferring internal_title makes both endpoints agree on the
    // name editors recognize.
    title: raw.internal_title ?? raw.title ?? `Survey ${raw.id}`,
    status: raw.status ?? 'unknown',
    // links.default is the primary share link; links.campaign appears on some
    // older surveys instead.
    url: raw.links?.default ?? raw.links?.campaign ?? '',
    // Only the list endpoint includes links.edit (verified 2026-11-02); the
    // fallback mirrors its current format so a getSurvey result opens the same
    // editor page.
    editUrl: raw.links?.edit ?? `https://${appHost}/projects/editor?id=${raw.id}`,
    modifiedOn: raw.modified_on,
  };
}

/**
 * Outcome of one Alchemer HTTP round-trip. The ok:false variant is shaped so
 * callers can return it to the frontend as-is; notFound distinguishes a
 * deleted survey from other failures so the field editor can warn about
 * stale references.
 */
type FetchResult = { ok: true; body: any } | { ok: false; error: string; notFound?: boolean; rateLimited?: boolean };

// Log payloads are capped so a 50-survey page cannot flood the function log.
const LOG_MAX_CHARS = 2000;

/**
 * Logs a labeled JSON payload to the function log (visible in the Contentful
 * web app under the app definition's Functions tab), truncated at
 * LOG_MAX_CHARS. Callers must pass only credential-free values; nothing here
 * redacts.
 */
function logJson(label: string, value: unknown): void {
  let text: string;
  try {
    text = JSON.stringify(value);
  } catch {
    text = String(value);
  }
  if (text && text.length > LOG_MAX_CHARS) {
    text = `${text.slice(0, LOG_MAX_CHARS)}... [truncated, ${text.length} chars total]`;
  }
  console.log(`${label}: ${text}`);
}

/**
 * Rebuilds a request URL with the credential query parameters masked. The
 * Alchemer credentials ride in the query string and function logs are visible
 * to everyone in the org, so URLs are only ever logged through this.
 */
function redactedUrl(apiHost: string, path: string, query: URLSearchParams): string {
  const safe = new URLSearchParams(query);
  for (const key of ['api_token', 'api_token_secret']) {
    if (safe.has(key)) safe.set(key, 'REDACTED');
  }
  return `https://${apiHost}${path}?${safe.toString()}`;
}

/**
 * Masks every occurrence of the given secret values in free text. Alchemer's
 * error messages have never been seen to echo the token or secret back, but
 * its message catalogue is not documented, and these messages are both
 * returned to editors and written to the function log (visible to the whole
 * org), so they are scrubbed on the same principle as redactedUrl: never
 * assume a third-party string is credential-free. Plain split/join rather than
 * a RegExp so token characters never need escaping.
 */
function redactSecrets(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    if (secret) out = out.split(secret).join('REDACTED');
  }
  return out;
}

/** The credential values carried in a request query, for redactSecrets. */
function secretsIn(query: URLSearchParams): string[] {
  return ['api_token', 'api_token_secret'].map((key) => query.get(key) ?? '');
}

/**
 * Reads Alchemer's `message` from an error response body, formatted for
 * appending to our own error text, or '' when the body has none. The message
 * is credential-scrubbed before it is logged or returned. Consumes the
 * response body, so call it at most once per response.
 */
async function alchemerMessage(response: Response, secrets: string[]): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body?.message === 'string') {
      const message = redactSecrets(body.message, secrets);
      console.log(`alchemer ${response.status} message: ${message}`);
      return ` Alchemer said: "${message}"`;
    }
  } catch {
    // Non-JSON or empty body; the status alone still gives the generic guidance.
  }
  return '';
}

/**
 * Performs one GET against the Alchemer API and maps every failure mode
 * (network error, 401/403, 404, other non-2xx, non-JSON body) to a
 * frontend-ready FetchResult. Error text never includes the URL, which
 * carries the credentials. On ok:true the caller must still check
 * body.result_ok — Alchemer signals application errors there, not via HTTP
 * status. Uses the global fetch API; the function sandbox has no Node
 * http/https modules, and egress is limited to the manifest's allowNetworks.
 */
async function alchemerGet(apiHost: string, path: string, query: URLSearchParams): Promise<FetchResult> {
  console.log(`alchemer request: GET ${redactedUrl(apiHost, path, query)}`);
  const secrets = secretsIn(query);
  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch(`https://${apiHost}${path}?${query.toString()}`);
  } catch {
    // Do not echo the error verbatim: fetch errors can include the full URL,
    // which contains the API credentials as query parameters.
    console.log(`alchemer request failed after ${Date.now() - startedAt}ms`);
    return { ok: false, error: `Could not reach ${apiHost}. Check the API host setting.` };
  }

  console.log(`alchemer response: HTTP ${response.status} in ${Date.now() - startedAt}ms`);
  // Alchemer warns via this header before it starts throttling; logging it
  // makes an approaching account-wide limit visible before editors see 429s.
  const rateWarning = response.headers.get('X-SG-Warning');
  if (rateWarning) console.log(`alchemer X-SG-Warning: ${rateWarning}`);
  if (response.status === 429) {
    // Two documented causes (apihelp.alchemer.com/help/api-request-limits),
    // both account-wide and both clearing within about a minute: the shared
    // 240 requests/minute budget, or an identical request still in flight
    // (e.g. two editors loading the same survey page simultaneously). The
    // rateLimited flag lets the frontend retry in place instead of failing.
    const detail = await alchemerMessage(response, secrets);
    return {
      ok: false,
      rateLimited: true,
      error:
        'Alchemer is rate-limiting API requests (HTTP 429). The limit is shared across the ' + `whole Alchemer account and clears within a minute.${detail}`,
    };
  }
  if (response.status === 401 || response.status === 403) {
    // A wrong-region host also surfaces as an auth failure (documented at
    // apihelp.alchemer.com/help/api-base-domains), so point at both causes.
    // Alchemer's body carries the real reason, which can be something the
    // generic text would never suggest (seen 2026-10-29: a 403 "You must
    // verify your email before you can access the API." for a freshly
    // generated key on an unverified user), so append it when present.
    const detail = await alchemerMessage(response, secrets);
    return {
      ok: false,
      error:
        'Alchemer rejected the API credentials (HTTP 401/403). Check the token and secret, ' +
        `and that the configured API region matches where the Alchemer account is hosted.${detail}`,
    };
  }
  if (response.status === 404) {
    return { ok: false, notFound: true, error: 'Survey not found in Alchemer.' };
  }
  if (!response.ok) {
    return { ok: false, error: `Alchemer API returned HTTP ${response.status}.` };
  }

  let body: any;
  try {
    body = await response.json();
  } catch {
    return { ok: false, error: 'Alchemer returned a non-JSON response.' };
  }
  // Scrub in place so every downstream use of body.message (the result_ok
  // false branches in run(), and the summary below) gets the clean value.
  if (typeof body?.message === 'string') body.message = redactSecrets(body.message, secrets);
  // A summary, not the raw body: a survey page is large and the interesting
  // fields for debugging are the envelope ones.
  logJson('alchemer response summary', {
    result_ok: body.result_ok,
    page: body.page,
    total_pages: body.total_pages,
    total_count: body.total_count,
    data_items: Array.isArray(body.data) ? body.data.length : body.data ? 1 : 0,
    message: body.message,
  });
  return { ok: true, body };
}

/**
 * Entry point invoked by Contentful for each alchemerApi app action call.
 * The real logic lives in run(); this wrapper only adds the in/out logging so
 * every return path is captured in one place. event.body is safe to log
 * verbatim (action, surveyId, page — never credentials). The returned
 * object is JSON-serialized by Contentful into the action call's
 * response.body, where src/lib/alchemer.ts parses it back.
 */
export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', AlchemerActionParameters>,
  context: FunctionEventContext
) => {
  logJson('request parameters', event.body);
  // Total handler time: the Alchemer round trip plus body parsing/mapping.
  // The gap between this and the "alchemer response" duration is our own
  // overhead; the gap between this and what the editor experiences is the
  // CMA app-action create/poll protocol, which is not measurable from here.
  const startedAt = Date.now();
  const result = await run(event, context);
  logJson(`function result (${Date.now() - startedAt}ms)`, result);
  return result;
};

/**
 * Dispatches the requested action. Credentials come exclusively from
 * context.appInstallationParameters (saved by the config screen at install
 * time) — the browser never sends them. Supports exactly three read-only
 * operations:
 *
 * - listSurveys: one API page of up to RESULTS_PER_PAGE surveys.
 * - getSurvey: single survey by id, with deleted surveys flagged notFound.
 * - testConnection: minimal one-result list to validate the credentials.
 *
 * Always resolves to an AlchemerResult-shaped object ({ok: true, ...} or
 * {ok: false, error, notFound?}); it never throws, so the frontend can treat
 * a rejected action call as "proxy unreachable/not installed".
 */
const run = async (event: AppActionRequest<'Custom', AlchemerActionParameters>, context: FunctionEventContext) => {
  const install = (context.appInstallationParameters ?? {}) as Record<string, string>;
  const apiToken = install.apiToken;
  const apiTokenSecret = install.apiTokenSecret;
  if (!apiToken || !apiTokenSecret) {
    return {
      ok: false,
      error: 'Alchemer API credentials are not configured. Open the app configuration screen and enter the API token and secret.',
    };
  }

  // Never trust the stored host blindly: it is editor-visible configuration,
  // and an arbitrary host would turn this function into a token-leaking proxy.
  // An absent host (installs saved before the region picker existed, or the
  // local harness with ALCHEMER_API_HOST unset) means the US default; a host
  // that IS set but not on the list is a misconfiguration and must fail
  // loudly rather than quietly querying the wrong region.
  const apiHost = install.apiHost || DEFAULT_HOST;
  if (!ALLOWED_HOSTS.includes(apiHost)) {
    return {
      ok: false,
      error:
        `The configured Alchemer API host "${apiHost}" is not one of the supported regions ` +
        `(${ALLOWED_HOSTS.join(', ')}). Fix the API region on the app configuration screen.`,
    };
  }

  const { action, surveyId, page } = event.body;

  const baseQuery = () =>
    new URLSearchParams({
      api_token: apiToken,
      api_token_secret: apiTokenSecret,
    });

  switch (action) {
    case 'listSurveys': {
      const query = baseQuery();
      query.set('resultsperpage', String(RESULTS_PER_PAGE));
      query.set('page', String(page && page > 0 ? page : 1));
      const res = await alchemerGet(apiHost, '/v5/survey', query);
      if (!res.ok) return res;
      // Alchemer wraps everything in result_ok rather than relying on HTTP status.
      if (res.body.result_ok === false) {
        return { ok: false, error: res.body.message ?? 'Alchemer reported an error.' };
      }
      return {
        ok: true,
        surveys: (res.body.data ?? []).map((s: any) => mapSurvey(s, apiHost)),
        page: Number(res.body.page ?? 1),
        totalPages: Number(res.body.total_pages ?? 1),
        totalCount: Number(res.body.total_count ?? 0),
      };
    }

    case 'getSurvey': {
      if (!surveyId || !/^\d+$/.test(String(surveyId))) {
        return { ok: false, error: 'A numeric surveyId is required for getSurvey.' };
      }
      const res = await alchemerGet(apiHost, `/v5/survey/${surveyId}`, baseQuery());
      if (!res.ok) return res;
      // A false result on a single-survey fetch usually means the survey was
      // deleted; surface that distinctly so the field editor can warn.
      if (res.body.result_ok === false) {
        return {
          ok: false,
          notFound: true,
          error: res.body.message ?? 'Survey not found in Alchemer.',
        };
      }
      return { ok: true, survey: mapSurvey(res.body.data, apiHost) };
    }

    case 'testConnection': {
      const query = baseQuery();
      query.set('resultsperpage', '1');
      const res = await alchemerGet(apiHost, '/v5/survey', query);
      if (!res.ok) return res;
      if (res.body.result_ok === false) {
        return { ok: false, error: res.body.message ?? 'Alchemer reported an error.' };
      }
      return { ok: true, totalCount: Number(res.body.total_count ?? 0) };
    }

    default:
      return { ok: false, error: `Unsupported action: ${String(action)}` };
  }
};
