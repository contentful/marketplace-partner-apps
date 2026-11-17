import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './alchemerProxy';

// Exercises the handler with a fake Alchemer so the credential-redaction
// rules can be asserted without network access. The live harness
// (scripts/test-proxy.mts) covers the real API.
const TOKEN = 'tok1234567890abcdef';
const SECRET = 'A9secret12345';

const context = {
  appInstallationParameters: {
    apiToken: TOKEN,
    apiTokenSecret: SECRET,
    apiHost: 'api.alchemer.com',
  },
} as any;
const event = (body: Record<string, unknown>) => ({ type: 'appaction.call', body, headers: {} } as any);

const fakeAlchemer = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    })
  );

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('alchemerProxy credential redaction', () => {
  it('scrubs the token and secret from a 403 message in the result and the log', async () => {
    vi.stubGlobal('fetch', fakeAlchemer(403, { result_ok: false, code: 403, message: `Bad key ${TOKEN} / ${SECRET}` }));
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = (await handler(event({ action: 'testConnection' }), context)) as any;

    expect(result.ok).toBe(false);
    expect(result.error).toContain('Alchemer said: "Bad key REDACTED / REDACTED"');
    const logged = log.mock.calls.map((c) => c.join(' ')).join('\n');
    expect(logged).not.toContain(TOKEN);
    expect(logged).not.toContain(SECRET);
    expect(logged).toContain('alchemer 403 message: Bad key REDACTED / REDACTED');
  });

  it('scrubs a result_ok:false message on a 200 response', async () => {
    vi.stubGlobal('fetch', fakeAlchemer(200, { result_ok: false, message: `No such survey for ${TOKEN}` }));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = (await handler(event({ action: 'getSurvey', surveyId: '42' }), context)) as any;

    expect(result).toMatchObject({
      ok: false,
      notFound: true,
      error: 'No such survey for REDACTED',
    });
  });

  it('maps a single-survey response to the internal title and a current-format edit link', async () => {
    // Shape of the real single-survey response (2026-11-02): both titles
    // present, no links.edit.
    vi.stubGlobal(
      'fetch',
      fakeAlchemer(200, {
        result_ok: true,
        data: {
          id: '7654321',
          status: 'Launched',
          title: 'Alchemer Survey',
          internal_title: 'Onboarding Demo with Tyler',
          links: { default: 'https://survey.alchemer.com/s3/7654321/Alchemer-Survey' },
        },
      })
    );
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = (await handler(event({ action: 'getSurvey', surveyId: '7654321' }), context)) as any;

    expect(result.ok).toBe(true);
    expect(result.survey.title).toBe('Onboarding Demo with Tyler');
    expect(result.survey.editUrl).toBe('https://app.alchemer.com/projects/editor?id=7654321');
  });

  it('rejects a stored host that is not a supported region without calling Alchemer', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    const result = (await handler(event({ action: 'testConnection' }), {
      appInstallationParameters: {
        apiToken: TOKEN,
        apiTokenSecret: SECRET,
        apiHost: 'evil.example.com',
      },
    } as any)) as any;

    expect(result.ok).toBe(false);
    expect(result.error).toContain('not one of the supported regions');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
