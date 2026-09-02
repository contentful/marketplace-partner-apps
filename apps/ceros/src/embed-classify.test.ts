import { describe, it, expect } from 'vitest'
import { classifyEmbed, classifyVariant } from './embed-classify'

// The live inline snippet, including the data-embed-height attribute that the
// server emits but older local copies of the snippet builder do not.
const INLINE_SNIPPET =
    '<div data-flex-inline data-flex-manifest-url="https://myaccount.ceros.site/flex-experience/manifest.v1.json" data-embed-height="auto"></div>' +
    '<script src="https://assets.ceros.site/js/flex-client.js"></script>'

const STUDIO_IFRAME =
    '<div class="ceros-experience" style="position:relative;width:auto;padding:0 0 56.25%;height:0;">' +
    '<iframe allowfullscreen src="https://view.ceros.com/myaccount/studio-experience" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0"></iframe></div>' +
    '<script type="text/javascript" src="https://view.ceros.com/scroll-proxy.min.js" data-ceros-origin-domains="view.ceros.com"></script>'

const FLEX_IFRAME =
    '<iframe src="https://myaccount.ceros.site/flex-experience" width="100%" height="600" frameborder="0"></iframe>'

describe('classifyEmbed', () => {
    it('classifies the live inline snippet as inline', () => {
        expect(classifyEmbed(INLINE_SNIPPET)).toBe('inline')
    })

    it('classifies a snippet with only the flex-client script as inline', () => {
        expect(classifyEmbed('<script src="https://assets.ceros.site/js/flex-client.js"></script>')).toBe('inline')
    })

    it('does NOT classify an unrelated data-flex-* attribute as inline', () => {
        // The old loose pattern (data-flex-[a-z-]+) matched this; the tightened
        // one must not. This is the regression the tightening exists to prevent.
        expect(classifyEmbed('<div data-flex-manifest-url="https://x.ceros.site/y/manifest.v1.json"></div>')).not.toBe('inline')
    })

    it('classifies a Studio iframe embed as iframe', () => {
        expect(classifyEmbed(STUDIO_IFRAME)).toBe('iframe')
    })

    it('classifies a Flex iframe embed as iframe', () => {
        expect(classifyEmbed(FLEX_IFRAME)).toBe('iframe')
    })

    it('classifies empty input as none', () => {
        expect(classifyEmbed('')).toBe('none')
    })

    it('classifies unrelated HTML as none', () => {
        expect(classifyEmbed('<p>Hello world</p>')).toBe('none')
    })
})

// Real snippet SHAPES, probed 2026-08-25 (synthetic account/experience slugs).
// Flex: the shape the manifest's iframe delivery mode carries — the two Flex
// iframe variants differ ONLY in data-embed-height.
const FLEX_FULL_HEIGHT =
    '<div data-embed-width="100%" data-embed-height="auto" data-ceros-experience="https://myaccount.ceros.site/flex-experience"></div>\n' +
    '<script src="https://assets.ceros.site/js/embed.v1.js"></script>'

const FLEX_SCROLLABLE =
    '<div data-embed-width="100%" data-embed-height="800px" data-ceros-experience="https://myaccount.ceros.site/flex-experience"></div>\n' +
    '<script src="https://assets.ceros.site/js/embed.v1.js"></script>'

// Studio: the two variants Ceros emits for one experience. Full-height carries
// scrolling="no" and the 1px/min-100% frame; scrollable carries neither.
const STUDIO_FULL_HEIGHT =
    '<div style="position:relative;width:auto;padding:0 0 156.25%;height:0" id="studio-experience" data-aspectRatio="0.64000000">' +
    '<iframe allowfullscreen src="https://view.ceros.com/myaccount/studio-experience?heightOverride=2000" ' +
    'style="position:absolute;top:0;left:0;height:1px;width:1px;min-height:100%;min-width:100%" frameborder="0" ' +
    'class="ceros-experience" title="studio experience" scrolling="no"></iframe></div>' +
    '<script type="text/javascript" src="https://view.ceros.com/scroll-proxy.min.js"></script>'

const STUDIO_SCROLLABLE =
    '<div style="position:relative;width:auto;padding:0 0 78.13%;height:0" id="studio-experience" data-aspectRatio="1.28000000">' +
    '<iframe allowfullscreen src="https://view.ceros.com/myaccount/studio-experience" ' +
    'style="position:absolute;top:0;left:0;height:100%;width:100%" frameborder="0" ' +
    'class="ceros-experience" title="studio experience" ></iframe></div>' +
    '<script type="text/javascript" src="https://view.ceros.com/scroll-proxy.min.js"></script>'

describe('classifyVariant', () => {
    it('identifies the Flex full-height iframe snippet by data-embed-height="auto"', () => {
        expect(classifyVariant(FLEX_FULL_HEIGHT)).toBe('fullHeight')
    })

    it('identifies the Flex scrollable iframe snippet by a fixed data-embed-height', () => {
        expect(classifyVariant(FLEX_SCROLLABLE)).toBe('scrollable')
    })

    it('identifies a Studio full-height embed by its scrolling="no" attribute', () => {
        expect(classifyVariant(STUDIO_FULL_HEIGHT)).toBe('fullHeight')
    })

    it('identifies a Studio scrollable embed by the absence of scrolling="no"', () => {
        expect(classifyVariant(STUDIO_SCROLLABLE)).toBe('scrollable')
    })

    it('identifies the inline snippet as inline despite its data-embed-height="auto"', () => {
        // The live inline snippet carries the same attribute the Flex iframe
        // variants are told apart by, so inline must be settled first.
        expect(classifyVariant(INLINE_SNIPPET)).toBe('inline')
    })

    it('returns null for an iframe embed carrying neither variant marker', () => {
        expect(classifyVariant(FLEX_IFRAME)).toBeNull()
    })

    it('returns null for markup that is not a Ceros embed', () => {
        expect(classifyVariant('<p>Hello world</p>')).toBeNull()
    })

    it('returns null for empty input', () => {
        expect(classifyVariant('')).toBeNull()
    })
})
