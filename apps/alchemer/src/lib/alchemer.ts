import { BaseAppSDK } from '@contentful/app-sdk';

// Mirror of the shapes returned by functions/alchemerProxy.ts. Kept as a
// separate copy on purpose: the functions/ tree has its own tsconfig and is
// bundled independently, so sharing a module across the boundary would couple
// the two builds.

export type SurveySummary = {
  surveyId: string;
  title: string;
  status: string;
  url: string;
  editUrl: string;
  modifiedOn?: string;
};

// The value persisted into the JSON (Object) field. Only url is strictly
// needed by the delivery side; the rest lets the editor UI render without a
// round-trip and lets the frontend fall back if the API is unreachable.
export type SavedSurvey = SurveySummary & {
  savedAt: string;
};

export type AlchemerResult =
  | {
      ok: true;
      surveys?: SurveySummary[];
      survey?: SurveySummary;
      page?: number;
      totalPages?: number;
      totalCount?: number;
    }
  | { ok: false; error: string; notFound?: boolean; rateLimited?: boolean };

export type AlchemerRequest = {
  action: 'listSurveys' | 'getSurvey' | 'testConnection';
  surveyId?: string;
  page?: number;
};

// Must match the action id in contentful-app-manifest.json.
export const APP_ACTION_ID = 'alchemerApi';

// Domains whose https URLs the field editor will render as links or load in
// the preview iframe. The field is a plain JSON Object field, so anyone with
// write access to the entry can set url/editUrl to anything via the CMA; they
// are untrusted input. A javascript: href would run inside the app iframe with
// the viewing editor's SDK access, and an arbitrary https page in the preview
// would be a phishing surface inside the Contentful UI. One base domain per
// Alchemer region (the same regions as ALLOWED_HOSTS in
// functions/alchemerProxy.ts; au.alchemer.com is covered by alchemer.com),
// matched as the hostname itself or any subdomain so survey.*, app.* and api.*
// all pass. Keep in sync with that list and the ConfigScreen region options.
export const ALCHEMER_LINK_DOMAINS = ['alchemer.com', 'alchemer.eu', 'alchemer-ca.com'];

/**
 * Returns the normalized URL when `value` is an https URL on an Alchemer
 * domain, otherwise undefined. Callers render nothing (and say so) for
 * undefined rather than falling back to the raw string.
 */
export function safeAlchemerUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return undefined;
  }
  if (parsed.protocol !== 'https:') return undefined;
  const host = parsed.hostname.toLowerCase();
  const allowed = ALCHEMER_LINK_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  return allowed ? parsed.href : undefined;
}

/**
 * Validates a raw field value before the editor trusts it. The JSON field can
 * hold anything (hand-edited, migrated, or written by another tool), and the
 * card used to assume the app's own shape: a value without `status` crashed
 * the whole editor on `status.toLowerCase()`. Only surveyId and title are
 * required for the card to be meaningful; url/editUrl are passed through as
 * strings and checked by safeAlchemerUrl at render time so the editor can
 * explain exactly what is wrong with them.
 */
export function parseSavedSurvey(raw: unknown): SavedSurvey | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const v = raw as Record<string, unknown>;
  if (typeof v.surveyId !== 'string' || typeof v.title !== 'string') return undefined;
  return {
    surveyId: v.surveyId,
    title: v.title,
    // The proxy also reports an unknown status as 'unknown', so the badge
    // reads the same for both sources.
    status: typeof v.status === 'string' ? v.status : 'unknown',
    url: typeof v.url === 'string' ? v.url : '',
    editUrl: typeof v.editUrl === 'string' ? v.editUrl : '',
    modifiedOn: typeof v.modifiedOn === 'string' ? v.modifiedOn : undefined,
    savedAt: typeof v.savedAt === 'string' ? v.savedAt : '',
  };
}

export async function callAlchemer(sdk: BaseAppSDK, parameters: AlchemerRequest): Promise<AlchemerResult> {
  const appDefinitionId = sdk.ids.app;
  if (!appDefinitionId) {
    return { ok: false, error: 'App definition id is not available in this context.' };
  }

  const call = await sdk.cma.appActionCall.createWithResponse(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      appDefinitionId,
      appActionId: APP_ACTION_ID,
    },
    // Undefined optional parameters must be stripped: the app action schema
    // validates the payload and rejects explicit undefined/null values.
    {
      parameters: Object.fromEntries(Object.entries(parameters).filter(([, v]) => v !== undefined && v !== '')),
    }
  );

  // The function's return value arrives JSON-serialized in response.body.
  // A malformed body is reported as such rather than thrown: callers treat a
  // rejection as "proxy not installed", which would be the wrong diagnosis.
  const body: unknown = (call as any)?.response?.body;
  let parsed: unknown = body;
  if (typeof body === 'string') {
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = undefined;
    }
  }
  if (!parsed || typeof parsed !== 'object' || typeof (parsed as any).ok !== 'boolean') {
    return { ok: false, error: 'Unexpected response from the Alchemer proxy function.' };
  }
  return parsed as AlchemerResult;
}
