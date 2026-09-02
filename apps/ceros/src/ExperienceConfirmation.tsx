import { Box, Button, Flex, Note, Paragraph } from '@contentful/f36-components'
import tokens from '@contentful/f36-tokens'
import React, { useEffect, useState } from 'react'

import { EmbedPreview } from './EmbedPreview'
import { EmbedVariant } from './embed-classify'

// Re-exported so existing importers keep their single import site. The
// definition lives beside classifyVariant, which has to name the same three
// styles to identify a stored embed code as one of them.
export type { EmbedVariant }

export interface ConfirmationModel {
    name: string
    url: string
    thumbnailUrl?: string
    isFlex: boolean
    embedCodes: Partial<Record<EmbedVariant, string>>
    // Set when the Flex branch resolved but could not read an inline snippet,
    // so the screen can explain the missing option instead of silently hiding it.
    inlineUnavailable?: boolean
}

export interface ExperienceConfirmationProps {
    model: ConfirmationModel
    initialVariant?: EmbedVariant
    // Emits only the embed code, not the variant that produced it. Which
    // variant an entry is stored in is re-derived from the stored markup by
    // classifyVariant, and that is the only answer that survives a reload —
    // the entry model has no field to persist a variant in. Handing callers a
    // second, session-only source of truth would make refresh and preselect
    // behave differently on a freshly inserted entry than on a reopened one.
    onInsert: (embedCode: string) => void
    onBack: () => void
    insertLabel?: string
    isBusy?: boolean
}

// The order the styles are offered in, and the precedence for choosing a
// default when the caller's preselected variant has no code in the model.
// Local to this screen on purpose: identifying which style an entry is ALREADY
// stored in is a different question, and preference order is the wrong tool for
// it — classifyVariant answers that one from the markup.
const VARIANT_ORDER: EmbedVariant[] = ['fullHeight', 'scrollable', 'inline']


const VARIANT_LABELS: Record<EmbedVariant, string> = {
    fullHeight: 'Full height',
    scrollable: 'Scrollable',
    inline: 'Inline (embed script) — no iframe',
}

// Grouping, not nesting: the radios are one flat group, visually separated by
// subheadings, so selection stays a single choice.
const IFRAME_VARIANTS: EmbedVariant[] = ['fullHeight', 'scrollable']

export function ExperienceConfirmation({
    model,
    initialVariant,
    onInsert,
    onBack,
    insertLabel = 'Insert',
    isBusy = false,
}: ExperienceConfirmationProps) {
    const available = VARIANT_ORDER.filter((v) => model.embedCodes[v])
    const defaultVariant =
        initialVariant && model.embedCodes[initialVariant] ? initialVariant : available[0] ?? 'fullHeight'
    const [selected, setSelected] = useState<EmbedVariant>(defaultVariant)

    // Resync if a caller swaps to a different model on a mounted instance and
    // the current selection has no embed code in the new model — otherwise
    // `selectedCode` silently resolves to '', disabling Insert with nothing
    // visibly checked. Uses the same precedence as the initial selection.
    // Leaves the selection alone whenever it's still backed by a code, so an
    // unrelated re-render (or a new model that still has this variant) never
    // snaps the user's in-screen choice back to the default.
    useEffect(() => {
        if (!model.embedCodes[selected]) {
            setSelected(defaultVariant)
        }
    }, [model, selected, defaultVariant])

    const selectedCode = model.embedCodes[selected] ?? ''
    const availableIframe = available.filter((v) => IFRAME_VARIANTS.includes(v))
    const hasInline = available.includes('inline')

    const radio = (variant: EmbedVariant) => (
        <label
            key={variant}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', marginTop: 6 }}
        >
            <input
                type="radio"
                name="embed-variant"
                checked={selected === variant}
                onChange={() => setSelected(variant)}
            />
            {VARIANT_LABELS[variant]}
        </label>
    )

    return (
        <Box>
            <Flex gap="spacingL" alignItems="flex-start">
                {model.thumbnailUrl && (
                    <img
                        data-test-id="confirmation-thumbnail"
                        src={model.thumbnailUrl}
                        alt=""
                        style={{ width: 280, flexShrink: 0, borderRadius: 8, border: `1px solid ${tokens.gray300}` }}
                    />
                )}
                <Box style={{ flex: 1 }}>
                    <Flex alignItems="center" gap="spacingS">
                        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{model.name}</h2>
                        <span
                            style={{
                                fontFamily: 'ui-monospace, monospace',
                                fontSize: 10,
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                textTransform: 'uppercase',
                                color: tokens.gray600,
                                border: `1px solid ${tokens.gray300}`,
                                borderRadius: 999,
                                padding: '3px 8px',
                            }}
                        >
                            {model.isFlex ? 'Flex' : 'Studio'}
                        </span>
                    </Flex>

                    {model.url && (
                        <Paragraph marginTop="spacingXs">
                            <small style={{ color: tokens.gray600, wordBreak: 'break-all' }}>{model.url}</small>
                        </Paragraph>
                    )}

                    {available.length > 1 && (
                        <Box marginTop="spacingL">
                            <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: tokens.gray600 }}>
                                Embed style
                            </div>

                            {availableIframe.length > 0 && (
                                <Box marginTop="spacingS">
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Iframe</div>
                                    {availableIframe.map(radio)}
                                </Box>
                            )}

                            {hasInline && (
                                <Box marginTop="spacingM">
                                    <div style={{ fontSize: 13, fontWeight: 600 }}>Inline</div>
                                    {radio('inline')}
                                </Box>
                            )}
                        </Box>
                    )}

                    {model.inlineUnavailable && (
                        <Box marginTop="spacingM">
                            <Note variant="neutral">
                                The inline option isn't available for this experience right now. You can still insert it as
                                an iframe.
                            </Note>
                        </Box>
                    )}

                    <Flex gap="spacingM" marginTop="spacingL">
                        <Button variant="secondary" onClick={onBack} isDisabled={isBusy}>
                            Back
                        </Button>
                        <Button
                            variant="positive"
                            onClick={() => onInsert(selectedCode)}
                            isDisabled={!selectedCode || isBusy}
                            isLoading={isBusy}
                        >
                            {insertLabel}
                        </Button>
                    </Flex>
                </Box>
            </Flex>

            {selectedCode && (
                <Box marginTop="spacingL">
                    <EmbedPreview embedCode={selectedCode} />
                </Box>
            )}
        </Box>
    )
}
