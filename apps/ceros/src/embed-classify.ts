export type EmbedKind = 'none' | 'iframe' | 'inline'

// Classify a stored embed code so the editor can render it correctly and so a
// refresh can rewrite it in the same format it was stored in.
// - inline: the no-iframe variant, which needs its flex-client script to execute
// - iframe: the full-height / scrollable variants (self-contained iframe markup)
// - none:   not a recognizable Ceros embed
//
// `data-flex-inline` is an unambiguous literal in the inline snippet, which is
// why the embed mode can be inferred rather than stored alongside the code.
// Matching it loosely (e.g. any data-flex-* attribute) would also match
// data-flex-manifest-url and misclassify future attributes.
export function classifyEmbed(embedCode: string): EmbedKind {
    if (!embedCode) return 'none'

    const isInline =
        /\bdata-flex-inline\b/i.test(embedCode) ||
        /<script[^>]+src=["'][^"']*flex-client[^"']*["']/i.test(embedCode)
    if (isInline) return 'inline'

    const isIframe =
        (embedCode.includes('class="ceros-experience"') && embedCode.includes('https://view.ceros.com/')) ||
        embedCode.includes('.ceros.site/')
    if (isIframe) return 'iframe'

    return 'none'
}

// The three embed styles an entry can be stored as. Declared here rather than
// in ExperienceConfirmation so the classifier below and the confirmation screen
// share one definition; ExperienceConfirmation re-exports it for its callers.
export type EmbedVariant = 'fullHeight' | 'scrollable' | 'inline'

// Identifies WHICH variant a stored embed code is, where classifyEmbed only
// answers inline/iframe/none. Refresh needs this: the code it compares against
// comes from resolveExperience, which cannot offer every variant the picker
// inserted from (the Flex manifest carries no scrollable snippet at all), so
// without a markup-level answer a scrollable entry is indistinguishable from a
// full-height one and gets silently rewritten as full-height.
//
// Markers, verified 2026-08-25 against a live Flex manifest, a live oEmbed
// response, and the published API documentation:
//   Flex   — the two iframe variants differ ONLY in data-embed-height:
//            "auto" is full-height, a fixed length is scrollable.
//   Studio — full-height carries scrolling="no"; scrollable omits it.
// Both are matched by SHAPE, never by literal value: the fixed height Flex uses
// is a single upstream constant away from changing, and Studio's frame styles
// vary per layout.
//
// Returns null when the stored code is not a recognisable Ceros embed, or is
// one whose variant genuinely cannot be told from the markup — callers must
// treat that as "unknown" and refuse to rewrite, not guess a variant.
export function classifyVariant(embedCode: string): EmbedVariant | null {
    const kind = classifyEmbed(embedCode)
    if (kind === 'none') return null
    // Settled first: the live inline snippet carries data-embed-height="auto"
    // too, so the Flex test below would otherwise claim it as full-height.
    if (kind === 'inline') return 'inline'

    const embedHeight = /\bdata-embed-height=["']([^"']*)["']/i.exec(embedCode)
    if (embedHeight) return embedHeight[1].trim().toLowerCase() === 'auto' ? 'fullHeight' : 'scrollable'

    // Studio's marker is an attribute whose ABSENCE is meaningful, so it is
    // only safe to read on markup known to be a Studio embed. A Flex iframe
    // snippet with no data-embed-height at all falls through to null instead.
    if (/\bclass=["']ceros-experience["']/i.test(embedCode)) {
        return /\bscrolling=["']no["']/i.test(embedCode) ? 'fullHeight' : 'scrollable'
    }

    return null
}
