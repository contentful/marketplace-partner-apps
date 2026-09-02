import { extract, setProviderList } from '@extractus/oembed-extractor'
import type { OembedData } from '@extractus/oembed-extractor'

export interface OembedMetadata extends OembedData {
    url: string
    title: string
    html: string
    width: number
    height: number
    provider_name: 'Ceros'
    provider_url: 'https://ceros.com'
    version: '1.0'
    embedType: 'full-height' | 'scrollable'
}

export function parseCerosUrl(experienceUrl: string): URL | null {
    try {
        const url = new URL(experienceUrl)
        const host = url.hostname
        if (url.protocol !== 'https:') {
            return null
        }

        const isViewCeros = host === 'view.ceros.com'
        if(!isViewCeros && !host.endsWith('.ceros.site')) {
            return null
        }

        const pathSegments = url?.pathname.split('/').filter(Boolean) ?? []
        if(isViewCeros && pathSegments.length < 2) {
            return null
        }

        return url
    } catch { /* invalid URL */ }
    return null
}

// The hosts this app can resolve without any discovery step: a URL on one of them
// goes straight to resolveExperience, which HEADs it and reads x-flex-manifest.
// Kept separate from parseCerosUrl because that function also enforces the path
// shape oEmbed needs, and the paste box only needs to know "is discovery required".
export function isKnownCerosHost(experienceUrl: string): boolean {
    try {
        const { hostname } = new URL(experienceUrl.trim())
        return hostname === 'view.ceros.com' || hostname.endsWith('.ceros.site')
    } catch {
        return false
    }
}

// The paste box's pre-filter. Deliberately loose: any https URL is worth trying,
// because a vanity domain is an arbitrary customer host and nothing about its name
// says whether it fronts a Ceros experience. This only rejects input that cannot be
// a web address at all, so the specific "not a Ceros experience" message comes from
// the resolution attempt rather than from a hostname guess.
export function isPasteableUrl(experienceUrl: string): boolean {
    try {
        return new URL(experienceUrl.trim()).protocol === 'https:'
    } catch {
        return false
    }
}

export async function getExperienceMetadata(experienceUrl: string): Promise<OembedMetadata | null> {
    const url = parseCerosUrl(experienceUrl)

    if (!url) {
        console.trace(`Experience URL '${experienceUrl}' isn't valid. Make sure it looks like
        'https://<account>.ceros.site/experience' or 'https://view.ceros.com/account/experience'`)
        return null
    }

    const canonicalUrl = url.origin + url.pathname
    const providers: Parameters<typeof setProviderList>[0] = [{
        provider_name: 'Ceros',
        provider_url: 'https://www.ceros.com/',
        endpoints: [
            {
                schemes: [`${url.origin}/*`],
                url: `${url.origin}/oembed`,
                discovery: true,
            },
        ],
    }]

    setProviderList(providers)

    // Fetch the oembed data
    try {
        const metadata = await extract(canonicalUrl) as OembedMetadata
        if (!metadata.url) {
          metadata.url = canonicalUrl
        }
        return metadata
    } catch (err) {
        console.trace(err)
        return null
    }
}
