import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resolveVanityToCanonical } from './vanity'

const encoder = new TextEncoder()

// The real manifest head, in the real key order: `experience` is the 4th top-level
// key and lands within the first ~250 bytes of a document over a megabyte long.
const manifestHead = (experience: Record<string, unknown>) =>
    JSON.stringify({
        schemaVersion: '1',
        publishedAt: '2026-06-19T13:37:39.757Z',
        flexVersion: '2026-08-27-15-41',
        experience,
        pageMetadata: { title: 'Page 1' },
    })

const EXPERIENCE = {
    slug: 'flex-experience',
    accountSlug: 'myaccount',
    pageSlug: 'page-1',
    pageNumber: 1,
    experienceResourceId: '6a04475c-n38640a18b9d7',
}

// A body that hands out pre-split chunks and records whether the consumer stopped
// early. Hand-rolled rather than a ReadableStream so the test asserts exactly the
// contract the implementation relies on — and so `cancel` is observable.
const makeBody = (chunks: string[]) => {
    const reader = {
        index: 0,
        cancelled: false,
        read: vi.fn(async () => {
            if (reader.index >= chunks.length) return { done: true, value: undefined }
            return { done: false, value: encoder.encode(chunks[reader.index++]) }
        }),
        cancel: vi.fn(async () => {
            reader.cancelled = true
        }),
    }
    return { body: { getReader: () => reader }, reader }
}

const okResponse = (chunks: string[]) => {
    const { body, reader } = makeBody(chunks)
    return { response: { ok: true, status: 200, body }, reader }
}

let mockFetch: ReturnType<typeof vi.fn>

beforeEach(() => {
    mockFetch = vi.fn()
    vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
    vi.unstubAllGlobals()
})

describe('resolveVanityToCanonical', () => {
    describe('inputs it refuses without any request', () => {
        it.each([
            ['a non-parseable string', 'not-a-url'],
            ['an empty string', ''],
            ['http, not https', 'http://look.example.com/flex-experience'],
            // A Flex vanity root 404s — the experience path is what the manifest hangs off.
            ['a bare vanity root', 'https://look.example.com'],
            ['a vanity root with only a slash', 'https://look.example.com/'],
        ])('returns null for %s', async (_label, url) => {
            expect(await resolveVanityToCanonical(url)).toBeNull()
            expect(mockFetch).not.toHaveBeenCalled()
        })
    })

    describe('resolution', () => {
        it('returns the canonical experience URL built from the manifest identifiers', async () => {
            const { response } = okResponse([manifestHead(EXPERIENCE)])
            mockFetch.mockResolvedValue(response)

            expect(await resolveVanityToCanonical('https://look.example.com/flex-experience')).toBe(
                'https://myaccount.ceros.site/flex-experience'
            )
        })

        it('requests the manifest that hangs off the pasted path', async () => {
            const { response } = okResponse([manifestHead(EXPERIENCE)])
            mockFetch.mockResolvedValue(response)

            await resolveVanityToCanonical('https://look.example.com/flex-experience')

            expect(mockFetch).toHaveBeenCalledWith(
                'https://look.example.com/flex-experience/manifest.v1.json',
                expect.objectContaining({ headers: { Accept: 'application/json' } })
            )
        })

        it('keeps a page-scoped pasted path when fetching the manifest', async () => {
            const { response } = okResponse([manifestHead(EXPERIENCE)])
            mockFetch.mockResolvedValue(response)

            await resolveVanityToCanonical('https://look.example.com/flex-experience/page-2')

            expect(mockFetch).toHaveBeenCalledWith(
                'https://look.example.com/flex-experience/page-2/manifest.v1.json',
                expect.anything()
            )
        })

        it('resolves to the experience ROOT, never the pasted page', async () => {
            const { response } = okResponse([manifestHead({ ...EXPERIENCE, pageSlug: 'page-2' })])
            mockFetch.mockResolvedValue(response)

            expect(
                await resolveVanityToCanonical('https://look.example.com/flex-experience/page-2')
            ).toBe('https://myaccount.ceros.site/flex-experience')
        })

        it('trims a pasted URL before using it', async () => {
            const { response } = okResponse([manifestHead(EXPERIENCE)])
            mockFetch.mockResolvedValue(response)

            await resolveVanityToCanonical('  https://look.example.com/flex-experience\n')

            expect(mockFetch).toHaveBeenCalledWith(
                'https://look.example.com/flex-experience/manifest.v1.json',
                expect.anything()
            )
        })

        it('reads an experience object split across chunks', async () => {
            const head = manifestHead(EXPERIENCE)
            const { response } = okResponse([head.slice(0, 60), head.slice(60, 130), head.slice(130)])
            mockFetch.mockResolvedValue(response)

            expect(await resolveVanityToCanonical('https://look.example.com/flex-experience')).toBe(
                'https://myaccount.ceros.site/flex-experience'
            )
        })
    })

    describe('it stops reading as soon as the identifiers are known', () => {
        it('cancels the body instead of draining the remaining megabytes', async () => {
            // A second chunk standing in for the ~1.3 MB of assets that follow.
            const { response, reader } = okResponse([manifestHead(EXPERIENCE), 'x'.repeat(4096)])
            mockFetch.mockResolvedValue(response)

            await resolveVanityToCanonical('https://look.example.com/flex-experience')

            expect(reader.read).toHaveBeenCalledTimes(1)
            expect(reader.cancel).toHaveBeenCalled()
        })

        it('sends no Range header, which this route ignores and its preflight forbids', async () => {
            const { response } = okResponse([manifestHead(EXPERIENCE)])
            mockFetch.mockResolvedValue(response)

            await resolveVanityToCanonical('https://look.example.com/flex-experience')

            const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>
            expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain('range')
        })
    })

    describe('untrusted identifiers are rejected, not escaped', () => {
        // accountSlug and slug come from a manifest on a pasted host and are
        // interpolated straight into a URL. Anything that could redirect that URL
        // elsewhere has to be refused outright.
        it.each([
            ['a path separator in slug', { ...EXPERIENCE, slug: 'evil/../../thing' }],
            ['a path separator in accountSlug', { ...EXPERIENCE, accountSlug: 'evil/x' }],
            ['a host swap in accountSlug', { ...EXPERIENCE, accountSlug: 'evil.example.com' }],
            ['a dot in slug', { ...EXPERIENCE, slug: 'thing.json' }],
            ['an empty slug', { ...EXPERIENCE, slug: '' }],
            ['a missing accountSlug', { ...EXPERIENCE, accountSlug: undefined }],
            ['a non-string slug', { ...EXPERIENCE, slug: 42 }],
            ['a leading dash in slug', { ...EXPERIENCE, slug: '-nope' }],
        ])('returns null for %s', async (_label, experience) => {
            const { response } = okResponse([manifestHead(experience)])
            mockFetch.mockResolvedValue(response)

            expect(await resolveVanityToCanonical('https://look.example.com/flex-experience')).toBeNull()
        })
    })

    describe('unreadable responses', () => {
        it('returns null for a non-200 (no manifest there — Studio, or not Ceros)', async () => {
            mockFetch.mockResolvedValue({ ok: false, status: 404, body: null })

            expect(await resolveVanityToCanonical('https://look.example.com/thing')).toBeNull()
        })

        it('returns null when the fetch rejects (a CORS refusal or a dead host)', async () => {
            mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

            expect(await resolveVanityToCanonical('https://look.example.com/thing')).toBeNull()
        })

        it('returns null when the body ends before the experience object', async () => {
            const { response } = okResponse(['{"schemaVersion":"1","publishedAt":"x"}'])
            mockFetch.mockResolvedValue(response)

            expect(await resolveVanityToCanonical('https://look.example.com/thing')).toBeNull()
        })

        it('returns null for a body that is not JSON at all', async () => {
            const { response } = okResponse(['<!doctype html><html><title>404</title>'])
            mockFetch.mockResolvedValue(response)

            expect(await resolveVanityToCanonical('https://look.example.com/thing')).toBeNull()
        })

        it('falls back to the whole body where response.body is unavailable', async () => {
            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                body: null,
                text: async () => manifestHead(EXPERIENCE),
            })

            expect(await resolveVanityToCanonical('https://look.example.com/flex-experience')).toBe(
                'https://myaccount.ceros.site/flex-experience'
            )
        })
    })
})
