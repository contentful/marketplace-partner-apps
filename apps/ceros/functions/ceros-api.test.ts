import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { handler } from './ceros-api'

type JsonResponse = { ok: boolean; status: number; json: () => Promise<any>; text: () => Promise<string> }

function jsonOk(body: any): JsonResponse {
    return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) }
}

function makeEvent(body: Record<string, unknown>) {
    return { type: 'appaction.call' as const, body, headers: {} }
}

function makeContext(cerosApiKey?: string) {
    return {
        spaceId: 'space',
        environmentId: 'master',
        appInstallationParameters: cerosApiKey ? { cerosApiKey } : {},
    }
}

describe('ceros-api function — getEmbedCode', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
    afterEach(() => vi.unstubAllGlobals())

    it('reads url and title from the response instead of scraping the embed HTML', async () => {
        vi.mocked(fetch).mockResolvedValue(
            jsonOk({
                viewUrl: 'https://myaccount.ceros.site/flex-experience',
                title: 'Fifth Brass Storm',
                assetBaseUrl: 'https://assets.ceros.site',
                experienceAlias: '',
                isPageOverHeightHomogeneous: false,
                fullHeightEmbedCode: '<iframe src="https://somewhere-else.example/decoy"></iframe>',
                inlineEmbedCode: '<div data-flex-inline></div>',
            }) as any
        )

        const result = await handler(makeEvent({ action: 'getEmbedCode', resourceId: 'exp-1' }), makeContext('key') as any)

        // The decoy src in fullHeightEmbedCode is what the old scraper would
        // have returned. viewUrl is the correct answer.
        expect((result.data as any).url).toBe('https://myaccount.ceros.site/flex-experience')
        expect((result.data as any).title).toBe('Fifth Brass Storm')
        expect((result.data as any).inlineEmbedCode).toBe('<div data-flex-inline></div>')
    })

    it('still requires an API key for getEmbedCode', async () => {
        const result = await handler(makeEvent({ action: 'getEmbedCode', resourceId: 'exp-1' }), makeContext() as any)
        expect(String(result.error)).toContain('API key is not configured')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('still requires an API key for getFolderTree', async () => {
        const result = await handler(makeEvent({ action: 'getFolderTree' }), makeContext() as any)
        expect(String(result.error)).toContain('API key is not configured')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('still requires an API key for getFolderExperiences', async () => {
        const result = await handler(makeEvent({ action: 'getFolderExperiences', folderId: 'f1' }), makeContext() as any)
        expect(String(result.error)).toContain('API key is not configured')
        expect(fetch).not.toHaveBeenCalled()
    })
})

// The outgoing list URL is the one thing no other test pinned, and it is
// exactly where this integration has broken: the upstream path went plural
// (the old singular one 404s at every api-version, so nothing is negotiated
// on our behalf), and `filter`/`pageSize` are pinned by this file rather than
// sent by the picker. None of that is visible to a result-shape assertion —
// the whole suite passed green against a dead path — so assert the request.
describe('ceros-api function — getFolderExperiences request', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
    afterEach(() => vi.unstubAllGlobals())

    async function requestFor(query?: string) {
        vi.mocked(fetch).mockResolvedValue(jsonOk({ resources: [], paging: null }) as any)
        await handler(
            makeEvent({ action: 'getFolderExperiences', folderId: 'f1', ...(query ? { query } : {}) }),
            makeContext('key') as any
        )
        const [url, init] = vi.mocked(fetch).mock.calls[0]
        return { url: new URL(String(url)), init: init as any }
    }

    it('asks the plural path for published experiences at the pinned page size and version', async () => {
        const { url, init } = await requestFor()
        expect(url.pathname).toBe('/folders/f1/experiences')
        expect(url.searchParams.get('filter')).toBe('published')
        expect(url.searchParams.get('pageSize')).toBe('1000')
        // Bumping the version is a deliberate act: it changes the list envelope
        // (`data` -> `resources` at 2026-08-06-09-00), so it should require
        // editing this expectation rather than passing silently.
        expect(init.headers['X-Ceros-Api-Version']).toBe('2026-08-06-09-00')
    })

    it('forwards sort, search and page but lets no caller widen filter or pageSize', async () => {
        const { url } = await requestFor(
            JSON.stringify({ sort: 'last_published', search: 'brass', page: 2, filter: 'draft', pageSize: '5' })
        )
        expect(url.searchParams.get('sort')).toBe('last_published')
        expect(url.searchParams.get('search')).toBe('brass')
        expect(url.searchParams.get('page')).toBe('2')
        // Neither key is on this action's allowlist, so the pinned values stand
        // and a direct CMA invocation cannot pull drafts into the picker.
        expect(url.searchParams.get('filter')).toBe('published')
        expect(url.searchParams.get('pageSize')).toBe('1000')
    })

    it('reads the 2026-08-06-09-00 `resources` envelope', async () => {
        vi.mocked(fetch).mockResolvedValue(
            jsonOk({
                resourceType: 'experience',
                paging: { total: 1, page: 1, pages: 1, pageSize: 1000 },
                resources: [
                    { resourceId: 'exp-1', name: 'Fifth Brass Storm', isFlexExperience: true, isTemplate: false, isPasswordProtected: false, isSSOProtected: false },
                ],
            }) as any
        )
        const result = await handler(
            makeEvent({ action: 'getFolderExperiences', folderId: 'f1' }),
            makeContext('key') as any
        )
        expect((result.data as any[]).map((e) => e.resourceId)).toEqual(['exp-1'])
        expect((result.paging as any).pageSize).toBe(1000)
    })
})

const MANIFEST_URL = 'https://myaccount.ceros.site/flex-experience/manifest.v1.json'
// Deliberately a different path than FLEX_PAGE + '/manifest.v1.json', so a
// concatenating implementation can't accidentally match it.
const DISTINCT_MANIFEST_URL = 'https://myaccount.ceros.site/some-other-path/manifest.v1.json'
const FLEX_PAGE = 'https://myaccount.ceros.site/flex-experience'
const STUDIO_PAGE = 'https://view.ceros.com/myaccount/studio-experience/p/1'

// `url` mirrors fetch's Response.url — the final URL after any redirects —
// so tests can simulate a HEAD landing off-host.
function headResponse(headers: Record<string, string>, url: string = FLEX_PAGE) {
    return {
        ok: true,
        status: 200,
        url,
        headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
        json: async () => ({}),
        text: async () => '',
    }
}

const MANIFEST_BODY = {
    experience: {
        slug: 'flex-experience',
        accountSlug: 'myaccount',
        pageSlug: 'page-1',
        pageNumber: 1,
        experienceResourceId: 'exp-123',
        title: 'Fifth Brass Storm',
    },
    // Deliberately different from experience.title: pageMetadata.title is the
    // page's rendered <title>, so an implementation reading it would name the
    // page instead of the experience.
    pageMetadata: { title: 'Fifth Brass Storm — Page 1', canonicalUrl: `${FLEX_PAGE}/page-1`, locale: 'en', seoMode: 'default' },
    deliveryModes: {
        iframe: { snippet: '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>' },
        inline: { snippet: '<div data-flex-inline data-flex-manifest-url="' + MANIFEST_URL + '" data-embed-height="auto"></div><script src="https://assets.ceros.site/js/flex-client.js"></script>' },
    },
}

describe('ceros-api function — resolveExperience', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
    afterEach(() => vi.unstubAllGlobals())

    it('routes to Flex when x-flex-manifest is present and returns both variants', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.isFlex).toBe(true)
        expect(data.name).toBe('Fifth Brass Storm')
        expect(data.embedCodes.fullHeight).toContain('<iframe')
        expect(data.embedCodes.inline).toContain('data-flex-inline')
        // The experience root, NOT the page-scoped canonicalUrl.
        expect(data.url).toBe(FLEX_PAGE)
    })

    it('names the experience from experience.title, not the page-scoped pageMetadata.title', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)

        expect((result.data as any).name).toBe('Fifth Brass Storm')
        expect((result.data as any).name).not.toBe(MANIFEST_BODY.pageMetadata.title)
    })

    it('falls back to the manifest experience slug when the SEO title is unset', async () => {
        // The SEO title is optional and unset by default, and manifests
        // published before the field shipped omit it entirely — both land here.
        const { title: _unset, ...experienceWithoutTitle } = MANIFEST_BODY.experience
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk({ ...MANIFEST_BODY, experience: experienceWithoutTitle }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect((result.data as any).name).toBe('flex-experience')
    })

    it('falls back to the URL slug when the manifest carries no experience block', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk({ deliveryModes: MANIFEST_BODY.deliveryModes }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect((result.data as any).name).toBe('flex-experience')
    })

    it('falls back to the URL slug when oEmbed returns no title', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({}, STUDIO_PAGE) as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: '',
                html: '<div class="ceros-experience"></div>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: STUDIO_PAGE }), makeContext() as any)
        // view.ceros.com/<account>/<experience> — the experience slug is the
        // last segment of the root, not the account.
        expect((result.data as any).name).toBe('studio-experience')
    })

    it('needs no API key', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect(result.error).toBeUndefined()
    })

    it('fetches the manifest URL from the header, never a constructed one', async () => {
        // The header value here is NOT FLEX_PAGE + '/manifest.v1.json' — if the
        // implementation ever starts string-concatenating the manifest URL
        // instead of reading this header, this assertion catches it.
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': DISTINCT_MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect(vi.mocked(fetch).mock.calls[1][0]).toBe(DISTINCT_MANIFEST_URL)
    })

    it('routes to Studio oEmbed when x-flex-manifest is absent', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({}, STUDIO_PAGE) as any)
            .mockResolvedValueOnce(jsonOk({
                type: 'rich', url: null, title: 'Untitled 85',
                html: '<div class="ceros-experience"></div>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: STUDIO_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.isFlex).toBe(false)
        expect(data.name).toBe('Untitled 85')
        expect(data.embedCodes.fullHeight).toContain('ceros-experience')
        expect(data.embedCodes.inline).toBeUndefined()
        // oEmbed's url comes back null, and /p/1 is stripped to the root.
        expect(data.url).toBe('https://view.ceros.com/myaccount/studio-experience')
    })

    it('keys a scrollable Studio experience as scrollable, not fullHeight', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({}, STUDIO_PAGE) as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'Scrollable One',
                html: '<div class="ceros-experience"></div>', embedType: 'scrollable',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: STUDIO_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.embedCodes.scrollable).toContain('ceros-experience')
        expect(data.embedCodes.fullHeight).toBeUndefined()
    })

    it('falls through to oEmbed when the manifest cannot be fetched, and flags inline unavailable', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'Fifth Brass Storm',
                html: '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.isFlex).toBe(true)
        expect(data.embedCodes.fullHeight).toContain('<iframe')
        expect(data.embedCodes.inline).toBeUndefined()
        expect(data.inlineUnavailable).toBe(true)
    })

    it('keys the degraded Flex oEmbed fallback as fullHeight when the response has no embedType field', async () => {
        // Live check: the Flex /oembed route returns no embedType at all, so
        // the `?? 'fullHeight'` default is what actually fires in production
        // on this path — not the 'full-height' string used elsewhere in these
        // fixtures.
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockRejectedValueOnce(new Error('network'))
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'Fifth Brass Storm',
                html: '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.embedCodes.fullHeight).toContain('<iframe')
        expect(data.embedCodes.scrollable).toBeUndefined()
    })

    it('returns fullHeight and flags inline unavailable when the manifest has iframe but no inline delivery mode', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk({
                pageMetadata: { title: 'X' },
                deliveryModes: { iframe: { snippet: '<iframe src="https://myaccount.ceros.site/x"></iframe>' } },
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.embedCodes.fullHeight).toContain('<iframe')
        expect(data.embedCodes.inline).toBeUndefined()
        expect(data.inlineUnavailable).toBe(true)
        // The manifest already answered fullHeight — no oEmbed round trip.
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
    })

    it('falls through to oEmbed when the manifest has no usable delivery modes at all', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk({ pageMetadata: { title: 'X' }, deliveryModes: {} }) as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'X', html: '<iframe></iframe>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect((result.data as any).inlineUnavailable).toBe(true)
        expect((result.data as any).embedCodes.inline).toBeUndefined()
    })

    it('falls through to oEmbed on malformed manifest JSON', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce({ ok: true, status: 200, json: async () => { throw new SyntaxError('bad json') }, text: async () => '' } as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'X', html: '<iframe></iframe>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect((result.data as any).inlineUnavailable).toBe(true)
    })

    it('errors when the HEAD request itself fails', async () => {
        vi.mocked(fetch).mockRejectedValueOnce(new Error('network'))

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect(String(result.error)).toContain('experience URL is invalid')
    })

    it('gives a specific message for an unpublished Flex experience', async () => {
        // Documented contract: x-flex-manifest appears only on a 200 for a
        // genuine PUBLISHED Flex experience, so an unpublished one routes to the
        // Studio branch. x-experience-type is the only signal that says why.
        vi.mocked(fetch).mockResolvedValueOnce(headResponse({ 'x-experience-type': 'flex' }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect(String(result.error)).toContain("isn't published")
        // It must not waste an oEmbed round trip on a known-unpublished page.
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })

    it('errors when url is missing', async () => {
        const result = await handler(makeEvent({ action: 'resolveExperience' }), makeContext() as any)
        expect(String(result.error)).toContain('url is required')
    })

    it('rejects a pasted URL on a disallowed host before making any request', async () => {
        // The app action can be invoked directly through the CMA, bypassing
        // the browser-side gate in src/oembed.ts entirely — this must gate
        // independently, server-side, before ever touching the network.
        const result = await handler(
            makeEvent({ action: 'resolveExperience', url: 'https://evil.example.com/experience' }),
            makeContext() as any
        )
        expect(String(result.error)).toContain('invalid')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('takes the degraded path when the manifest header points off-host, without fetching it', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': 'https://evil.example.com/manifest.v1.json' }) as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'Fifth Brass Storm',
                html: '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>', embedType: 'full-height',
            }) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        const data = result.data as any

        expect(data.isFlex).toBe(true)
        expect(data.inlineUnavailable).toBe(true)
        expect(data.embedCodes.fullHeight).toContain('<iframe')
        // Exactly HEAD + oEmbed — the off-host manifest URL is never fetched.
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2)
        expect(vi.mocked(fetch).mock.calls[1][0]).not.toContain('evil.example.com')
    })

    it('resolves normally when the HEAD response url is empty, falling back to the pasted url', async () => {
        // Response.url is legitimately '' on some runtimes/polyfills. There's no
        // redirect information to check in that case, so the re-validation
        // should fall back to the already-validated pasted url instead of
        // treating '' as an off-host redirect.
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }, '') as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)

        expect(result.error).toBeUndefined()
        expect((result.data as any).isFlex).toBe(true)
        expect((result.data as any).embedCodes.fullHeight).toContain('<iframe')
    })

    it('rejects when the HEAD response redirected off-host', async () => {
        // fetch() follows redirects by default, so an allowlisted first hop
        // can still land on an unvalidated final URL.
        vi.mocked(fetch).mockResolvedValueOnce(
            headResponse({ 'x-flex-manifest': MANIFEST_URL }, 'https://evil.example.com/relocated') as any
        )

        const result = await handler(makeEvent({ action: 'resolveExperience', url: FLEX_PAGE }), makeContext() as any)
        expect(String(result.error)).toContain('invalid')
        // Rejected right after the HEAD — no manifest or oEmbed fetch follows.
        expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1)
    })
})

// The function runs in a Contentful Functions sandbox that only permits
// outbound requests to hosts declared in contentful-app-manifest.json's
// allowNetworks. A request to an undeclared host throws, which this handler
// catches and reports as an invalid URL — so a missing entry looks exactly
// like a bad paste, with nothing failing until it runs in Contentful.
// Nothing else ties the manifest to the hosts the code actually fetches.
describe('ceros-api function — network allowlist', () => {
    const manifest = JSON.parse(
        readFileSync(resolve(process.cwd(), 'contentful-app-manifest.json'), 'utf8')
    )
    const allowNetworks: string[] = manifest.functions.find((f: any) => f.id === 'CerosApi').allowNetworks

    it('allows the Ceros REST API used by the folder and embed-code actions', () => {
        expect(allowNetworks).toContain('rest.ceros.com')
    })

    it('allows the Flex hosts resolveExperience fetches: the page, its manifest, and its oEmbed route', () => {
        expect(allowNetworks).toContain('*.ceros.site')
    })

    it('allows the Studio host resolveExperience fetches for oEmbed', () => {
        expect(allowNetworks).toContain('view.ceros.com')
    })
})

describe('ceros-api function — whitespace in the pasted URL', () => {
    beforeEach(() => vi.stubGlobal('fetch', vi.fn()))
    afterEach(() => vi.unstubAllGlobals())

    // A pasted URL routinely carries surrounding whitespace. new URL() strips it,
    // so the host gate passes — but the oEmbed query is built by encoding the RAW
    // string, which bakes %20/%0A into the lookup and fails upstream with the
    // generic invalid-URL message. This action is CMA-invokable, so it cannot
    // rely on the browser having trimmed first.
    it('trims the pasted URL before building the oEmbed query', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({}) as any)
            .mockResolvedValueOnce(jsonOk({
                url: null, title: 'Untitled 85',
                html: '<div class="ceros-experience"></div>', embedType: 'full-height',
            }) as any)

        await handler(makeEvent({ action: 'resolveExperience', url: '  ' + STUDIO_PAGE + '\n' }), makeContext() as any)

        const oembedCall = String(vi.mocked(fetch).mock.calls[1][0])
        expect(oembedCall).toBe('https://view.ceros.com/oembed?url=' + encodeURIComponent(STUDIO_PAGE))
        expect(oembedCall).not.toContain('%20')
        expect(oembedCall).not.toContain('%0A')
    })

    it('trims before the HEAD request too', async () => {
        vi.mocked(fetch)
            .mockResolvedValueOnce(headResponse({ 'x-flex-manifest': MANIFEST_URL }) as any)
            .mockResolvedValueOnce(jsonOk(MANIFEST_BODY) as any)

        await handler(makeEvent({ action: 'resolveExperience', url: '\t' + FLEX_PAGE + '  ' }), makeContext() as any)

        expect(String(vi.mocked(fetch).mock.calls[0][0])).toBe(FLEX_PAGE)
    })

    it('rejects a url that is only whitespace', async () => {
        const result = await handler(makeEvent({ action: 'resolveExperience', url: '   ' }), makeContext() as any)
        expect(String(result.error)).toContain('url is required')
        expect(fetch).not.toHaveBeenCalled()
    })
})
