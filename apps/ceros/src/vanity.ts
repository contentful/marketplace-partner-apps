// Manifest-based discovery for an experience pasted from a vanity domain.
//
// A vanity domain (look.acme.com) fronts a published Ceros experience, and this
// app cannot ask that host what it is the way it asks a known Ceros host:
//   - the Contentful Function cannot fetch an arbitrary host at all. allowNetworks
//     accepts `*.<label>.<tld>`, a fully-qualified host, or an IP — never `*` — and
//     it is validated at upload time, so a customer's own apex can never be listed.
//   - the browser cannot read the vanity PAGE. That route sends
//     `Access-Control-Expose-Headers: x-flex-manifest` but no `Allow-Origin`, and
//     Expose-Headers is inert without it, so `x-flex-manifest` is unreachable there.
//
// The manifest route, unlike the page route, does send `Access-Control-Allow-Origin: *`
// — including when served through a vanity domain. So the browser reads the manifest
// and takes ONLY the two fields that say which canonical experience this is.
//
// It deliberately never reads deliveryModes / scripts / styles / assets from it.
// Ceros documents guessing `<pasted-url>/manifest.v1.json` as precisely the injection
// risk the x-flex-manifest header exists to prevent: a spoofed page could hand back a
// snippet loading attacker-controlled JS. Reading two identifier strings is not that
// attack — once the canonical URL is known, resolveExperience takes over and every
// snippet comes from the canonical manifest reached the designed way (HEAD the
// canonical page, read x-flex-manifest, fetch that). The worst a spoofed page can do
// is name a real experience in this account, which the confirmation screen shows the
// author before anything is committed.

// Flex publishes to `<accountSlug>.ceros.site`. Hardcoded, as elsewhere in the app:
// this build targets production (rest.ceros.com), and the stage/dev player hosts
// (`*.cerosstage.site` / `*.cerosdev.site`) are not reachable from it.
const FLEX_PLAYER_HOST = 'ceros.site'

// accountSlug and slug arrive as untrusted JSON from a pasted host and are
// interpolated straight into a URL, so they are VALIDATED rather than escaped —
// a value carrying '/', '.', or '..' has to be rejected outright, not encoded into
// something that merely looks safe.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

// The manifest's `experience` object is the 4th top-level key and lands within the
// first ~250 bytes, while the whole document runs from ~1.3 MB to several MB. So the
// body is streamed and abandoned the moment that object has been read. A Range
// request cannot do this job: the route's preflight allows only Content-Type, and
// the origin ignores Range and returns the full body anyway.
const HEAD_BYTE_LIMIT = 16 * 1024

// A pasted vanity host that never responds would otherwise hang the paste button.
const FETCH_TIMEOUT_MS = 10_000

// Walks a JSON fragment from the '{' at `start` to its matching '}', ignoring braces
// that appear inside strings. Returns null when the fragment ends first, which means
// "keep reading" rather than "malformed".
function sliceObject(text: string, start: number): string | null {
    let depth = 0
    let inString = false
    let escaped = false

    for (let i = start; i < text.length; i++) {
        const char = text[i]

        if (inString) {
            if (escaped) escaped = false
            else if (char === '\\') escaped = true
            else if (char === '"') inString = false
            continue
        }

        if (char === '"') inString = true
        else if (char === '{') depth++
        else if (char === '}' && --depth === 0) return text.slice(start, i + 1)
    }

    return null
}

// Pulls the `experience` object out of a partial manifest. Returns null while the
// buffer is still too short — callers distinguish that from a hard failure by
// whether the stream has ended.
function readExperience(buffer: string): { accountSlug?: unknown; slug?: unknown } | null {
    const key = buffer.indexOf('"experience"')
    if (key === -1) return null

    const brace = buffer.indexOf('{', key)
    if (brace === -1) return null

    const fragment = sliceObject(buffer, brace)
    if (!fragment) return null

    try {
        return JSON.parse(fragment)
    } catch {
        return null
    }
}

// Reads at most HEAD_BYTE_LIMIT of the response, stopping as soon as the
// `experience` object is complete. Falls back to the whole body on runtimes where
// response.body is absent (jsdom without a stream polyfill, older Safari).
async function readExperienceFromResponse(response: Response) {
    const body = response.body
    if (!body?.getReader) {
        return readExperience(await response.text())
    }

    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    try {
        while (buffer.length < HEAD_BYTE_LIMIT) {
            const { done, value } = await reader.read()
            if (value) buffer += decoder.decode(value, { stream: true })

            const experience = readExperience(buffer)
            if (experience) return experience
            if (done) return null
        }
    } finally {
        // Stop the transfer rather than draining the remaining megabytes.
        await reader.cancel().catch(() => {})
    }

    return readExperience(buffer)
}

function isValidSlug(value: unknown): value is string {
    return typeof value === 'string' && SLUG_PATTERN.test(value)
}

/**
 * Resolves a URL pasted from a vanity domain to the canonical experience URL
 * `https://<accountSlug>.ceros.site/<slug>`, which resolveExperience already accepts.
 *
 * Returns null for anything that is not a published Flex experience on that host —
 * a non-Flex (Studio) page, an unpublished one, a non-Ceros site, or a manifest whose
 * identifiers fail validation. Callers decide what to tell the author; this module
 * cannot tell those cases apart, because a vanity host exposes nothing else readable.
 */
export async function resolveVanityToCanonical(pastedUrl: string): Promise<string | null> {
    let url: URL
    try {
        url = new URL(pastedUrl.trim())
    } catch {
        return null
    }

    if (url.protocol !== 'https:') return null

    // A Flex vanity URL always carries an experience path — the vanity root itself
    // 404s — so an empty path means there is no manifest to look for.
    const path = url.pathname.replace(/\/+$/, '')
    if (!path) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
        // The manifest is published at both `/<experience>/manifest.v1.json` and
        // `/<experience>/<page>/manifest.v1.json`, so the pasted path is used as-is.
        const response = await fetch(`${url.origin}${path}/manifest.v1.json`, {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
        })
        if (!response.ok) return null

        const experience = await readExperienceFromResponse(response)
        if (!experience) return null

        const { accountSlug, slug } = experience
        if (!isValidSlug(accountSlug) || !isValidSlug(slug)) return null

        // The experience ROOT, deliberately not the pasted page: the entry stores the
        // root on every other path too, and resolveExperience derives it the same way.
        return `https://${accountSlug}.${FLEX_PLAYER_HOST}/${slug}`
    } catch {
        // A CORS rejection, an abort, or a dead host are indistinguishable here and
        // all mean the same thing to the author: this is not a linkable experience.
        return null
    } finally {
        clearTimeout(timeout)
    }
}
