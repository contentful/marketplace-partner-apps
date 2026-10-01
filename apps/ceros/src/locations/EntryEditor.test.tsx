import { vi, describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import React from 'react'

vi.mock('@contentful/react-apps-toolkit', () => ({
    useSDK: vi.fn(),
}))

vi.mock('../oembed', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../oembed')>()),
    getExperienceMetadata: vi.fn(),
}))

vi.mock('../vanity', () => ({
    resolveVanityToCanonical: vi.fn().mockResolvedValue(null),
}))

vi.mock('../ceros-action', () => ({
    findCerosActionId: vi.fn(),
    callCerosAction: vi.fn(),
}))

import { useSDK } from '@contentful/react-apps-toolkit'
import { callCerosAction, findCerosActionId } from '../ceros-action'
import { resolveVanityToCanonical } from '../vanity'
import Entry from './EntryEditor'

const mockUseSDK = vi.mocked(useSDK)
const mockFindCerosActionId = vi.mocked(findCerosActionId)
const mockCallCerosAction = vi.mocked(callCerosAction)
const mockResolveVanity = vi.mocked(resolveVanityToCanonical)

const baseParameters = {
    contentTypeId: 'cerosExperience',
    titleFieldId: 'title',
    urlFieldId: 'url',
    embedCodeFieldId: 'embedCode',
}

const CEROS_EMBED_CODE =
    '<div class="ceros-experience" style="aspect-ratio:4/3">https://view.ceros.com/account/experience</div>'

const makeMockSdk = (overrides: Record<string, any> = {}) => ({
    parameters: {
        installation: baseParameters,
        ...overrides.parameters,
    },
    entry: {
        fields: {
            title: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
            url: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
            embedCode: { getValue: vi.fn().mockReturnValue(''), setValue: vi.fn(), removeValue: vi.fn() },
        },
        save: vi.fn().mockResolvedValue({}),
        getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: 'cerosExperience' } } }),
        ...overrides.entry,
    },
    ...overrides,
})

const makeLinkedSdk = (embedCode: string, title = 'My Experience') => {
    const sdk = makeMockSdk()
    sdk.entry.fields.title.getValue.mockReturnValue(title)
    sdk.entry.fields.embedCode.getValue.mockReturnValue(embedCode)
    return sdk
}

describe('Entry — configuration errors', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows a config error when installation parameters are missing', async () => {
        mockUseSDK.mockReturnValue({
            parameters: {
                installation: { contentTypeId: '', titleFieldId: '', urlFieldId: '', embedCodeFieldId: '' },
            },
            entry: {
                fields: {},
                save: vi.fn(),
                getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: '' } } }),
            },
        } as any)

        render(<Entry />)

        expect(screen.getByText(/isn't fully configured/i)).toBeInTheDocument()
    })

    it('shows a content type error when the entry content type does not match', async () => {
        mockUseSDK.mockReturnValue(
            makeMockSdk({
                entry: {
                    fields: {
                        title: { getValue: vi.fn().mockReturnValue('') },
                        url: { getValue: vi.fn().mockReturnValue('') },
                        embedCode: { getValue: vi.fn().mockReturnValue('') },
                    },
                    save: vi.fn(),
                    getSys: vi.fn().mockReturnValue({ contentType: { sys: { id: 'somethingElse' } } }),
                },
            }) as any
        )

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText(/isn't configured to use the Ceros app/i)).toBeInTheDocument()
        })
    })
})

describe('Entry — EmptyState (no linked experience)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockUseSDK.mockReturnValue(makeMockSdk() as any)
    })

    it('renders the URL input form', async () => {
        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/https:\/\/account\.ceros\.site\//i)).toBeInTheDocument()
        })
    })

    it('renders the Link Experience button', async () => {
        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText('Link Experience')).toBeInTheDocument()
        })
    })

    it('shows a validation error when the pasted value is not an https URL', async () => {
        render(<Entry />)

        const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: 'not-a-url' } })
        fireEvent.submit(input.closest('form')!)

        await waitFor(() => {
            expect(screen.getByText(/Enter a full experience URL/i)).toBeInTheDocument()
        })
    })

    // An unknown host is no longer rejected on its name — a vanity domain is an
    // arbitrary customer host — so it is attempted and reported on the outcome.
    it('reports an unresolvable host after attempting vanity resolution', async () => {
        mockResolveVanity.mockResolvedValue(null)
        render(<Entry />)

        const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: 'https://invalid.url/thing' } })
        fireEvent.submit(input.closest('form')!)

        await waitFor(() => {
            expect(screen.getByText(/couldn't find a published Ceros experience/i)).toBeInTheDocument()
        })
        expect(mockResolveVanity).toHaveBeenCalledWith('https://invalid.url/thing')
    })
})

describe('Entry — EmptyState paste flow', () => {
    let sdk: ReturnType<typeof makeMockSdk>

    const FLEX_MODEL = {
        isFlex: true,
        name: 'Fifth Brass Storm',
        url: 'https://myaccount.ceros.site/flex-experience',
        embedCodes: {
            fullHeight: '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>',
            inline: '<div data-flex-inline></div>',
        },
    }

    beforeEach(() => {
        vi.clearAllMocks()
        sdk = makeMockSdk()
        mockUseSDK.mockReturnValue(sdk as any)
        mockFindCerosActionId.mockResolvedValue('action-1')
    })

    const pasteAndSubmit = async (url: string) => {
        render(<Entry />)
        const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: url } })
        fireEvent.submit(input.closest('form')!)
    }

    it('resolves a pasted URL through the function and shows the confirmation screen', async () => {
        mockCallCerosAction.mockResolvedValue({ data: FLEX_MODEL })

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')

        await waitFor(() => expect(screen.getByText('Fifth Brass Storm')).toBeInTheDocument())
        expect(mockCallCerosAction).toHaveBeenCalledWith(expect.anything(), 'action-1', {
            action: 'resolveExperience',
            url: 'https://myaccount.ceros.site/flex-experience',
        })
        // Both variants offered → a radio group, not confirm-only.
        expect(screen.getAllByRole('radio')).toHaveLength(2)
    })

    it('renders confirm-only for a Studio paste and does not save until confirmed', async () => {
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: false,
                name: 'Untitled 85',
                url: 'https://view.ceros.com/myaccount/studio-experience',
                embedCodes: { fullHeight: '<div class="ceros-experience"></div>' },
            },
        })

        await pasteAndSubmit('https://view.ceros.com/myaccount/studio-experience/p/1')

        await waitFor(() => expect(screen.getByText('Untitled 85')).toBeInTheDocument())
        expect(screen.queryAllByRole('radio')).toHaveLength(0)
        expect(sdk.entry.save).not.toHaveBeenCalled()

        fireEvent.click(screen.getByRole('button', { name: /^insert$/i }))

        await waitFor(() => expect(sdk.entry.save).toHaveBeenCalled())
        expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith('<div class="ceros-experience"></div>')
        expect(sdk.entry.fields.url.setValue).toHaveBeenCalledWith('https://view.ceros.com/myaccount/studio-experience')
    })

    it('saves the inline snippet when the author picks the inline variant', async () => {
        mockCallCerosAction.mockResolvedValue({ data: FLEX_MODEL })

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')
        await waitFor(() => expect(screen.getByText('Fifth Brass Storm')).toBeInTheDocument())

        fireEvent.click(screen.getByLabelText(/embed script/i))
        fireEvent.click(screen.getByRole('button', { name: /^insert$/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith('<div data-flex-inline></div>')
        )
    })

    it('shows the function error and does not touch the entry when resolution fails', async () => {
        mockCallCerosAction.mockResolvedValue({ error: 'The experience URL is invalid.' })

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')

        await waitFor(() => expect(screen.getByText(/experience URL is invalid/i)).toBeInTheDocument())
        expect(sdk.entry.save).not.toHaveBeenCalled()
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalled()
    })

    it('clears a stale save error when a fresh URL resolves', async () => {
        const SECOND_MODEL = {
            isFlex: true,
            name: 'Second Brass Storm',
            url: 'https://myaccount.ceros.site/other-flex-experience',
            embedCodes: {
                fullHeight: '<iframe src="https://myaccount.ceros.site/other-flex-experience"></iframe>',
            },
        }
        mockCallCerosAction
            .mockResolvedValueOnce({ data: FLEX_MODEL })
            .mockResolvedValueOnce({ data: SECOND_MODEL })
        sdk.entry.save.mockRejectedValueOnce(new Error('save failed'))

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')
        await waitFor(() => expect(screen.getByText('Fifth Brass Storm')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: /^insert$/i }))

        await waitFor(() => expect(screen.getByText(/couldn't save this entry/i)).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: /^back$/i }))

        const input = screen.getByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: 'https://myaccount.ceros.site/other-flex-experience' } })
        fireEvent.submit(input.closest('form')!)

        await waitFor(() => expect(screen.getByText('Second Brass Storm')).toBeInTheDocument())
        expect(screen.queryByText(/couldn't save this entry/i)).not.toBeInTheDocument()
    })

    it('restores all three fields and stays unlinked when a paste save fails', async () => {
        mockCallCerosAction.mockResolvedValue({ data: FLEX_MODEL })
        sdk.entry.save.mockRejectedValueOnce(new Error('save failed'))

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')
        await waitFor(() => expect(screen.getByText('Fifth Brass Storm')).toBeInTheDocument())

        fireEvent.click(screen.getByRole('button', { name: /^insert$/i }))

        await waitFor(() => expect(screen.getByText(/couldn't save this entry/i)).toBeInTheDocument())

        // All three fields were written with the chosen experience, then rolled
        // back to their prior (empty) values once the save rejected.
        expect(sdk.entry.fields.title.setValue).toHaveBeenCalledWith('Fifth Brass Storm')
        expect(sdk.entry.fields.title.setValue).toHaveBeenLastCalledWith('')
        expect(sdk.entry.fields.url.setValue).toHaveBeenCalledWith('https://myaccount.ceros.site/flex-experience')
        expect(sdk.entry.fields.url.setValue).toHaveBeenLastCalledWith('')
        expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(FLEX_MODEL.embedCodes.fullHeight)
        expect(sdk.entry.fields.embedCode.setValue).toHaveBeenLastCalledWith('')

        // Never flipped to the linked view for a write that was never persisted.
        expect(screen.getByText('Fifth Brass Storm')).toBeInTheDocument()
    })

    it('never reaches the function when a non-Ceros host cannot be resolved', async () => {
        mockResolveVanity.mockResolvedValue(null)

        await pasteAndSubmit('https://example.com/not-ceros')

        await waitFor(() =>
            expect(screen.getByText(/couldn't find a published Ceros experience/i)).toBeInTheDocument()
        )
        expect(mockCallCerosAction).not.toHaveBeenCalled()
    })

    it('resolves a vanity URL to its canonical URL before calling the function', async () => {
        mockResolveVanity.mockResolvedValue('https://myaccount.ceros.site/flex-experience')
        mockCallCerosAction.mockResolvedValue({ data: FLEX_MODEL })

        await pasteAndSubmit('https://look.example.com/flex-experience')

        await waitFor(() => expect(mockCallCerosAction).toHaveBeenCalled())
        // The function only ever sees the canonical URL — it cannot fetch the vanity
        // host at all, which is the whole reason the translation happens in the browser.
        expect(mockCallCerosAction).toHaveBeenCalledWith(expect.anything(), 'action-1', {
            action: 'resolveExperience',
            url: 'https://myaccount.ceros.site/flex-experience',
        })
    })

    it('does not attempt vanity resolution for a known Ceros host', async () => {
        mockCallCerosAction.mockResolvedValue({ data: FLEX_MODEL })

        await pasteAndSubmit('https://myaccount.ceros.site/flex-experience')

        await waitFor(() => expect(mockCallCerosAction).toHaveBeenCalled())
        // The known-host path must stay request-for-request what it was before vanity
        // domains existed: no manifest probe for view.ceros.com or *.ceros.site.
        expect(mockResolveVanity).not.toHaveBeenCalled()
    })
})

describe('Entry — LinkedState (experience linked)', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows the Ceros experience preview for a valid Ceros view.ceros.com embed code', async () => {
        mockUseSDK.mockReturnValue(makeLinkedSdk(CEROS_EMBED_CODE) as any)

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText(/A Ceros experience is linked/i)).toBeInTheDocument()
        })
    })

    it('shows the Ceros experience preview for a *.ceros.site embed code', async () => {
        const cerosSiteEmbedCode = '<div>https://myaccount.ceros.site/experience</div>'
        mockUseSDK.mockReturnValue(makeLinkedSdk(cerosSiteEmbedCode) as any)

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText(/A Ceros experience is linked/i)).toBeInTheDocument()
        })
    })

    it('shows a warning for non-Ceros embed code', async () => {
        const nonCerosEmbed = '<iframe src="https://example.com/embed"></iframe>'
        mockUseSDK.mockReturnValue(makeLinkedSdk(nonCerosEmbed) as any)

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText(/doesn't look like a Ceros experience/i)).toBeInTheDocument()
        })
    })

    it('shows a warning when embed code has ceros-experience class but no view.ceros.com URL', async () => {
        const partialEmbed = '<div class="ceros-experience">https://example.com/something</div>'
        mockUseSDK.mockReturnValue(makeLinkedSdk(partialEmbed) as any)

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText(/doesn't look like a Ceros experience/i)).toBeInTheDocument()
        })
    })

    it('renders the Refresh Embed Code button for Ceros experiences', async () => {
        mockUseSDK.mockReturnValue(makeLinkedSdk(CEROS_EMBED_CODE) as any)

        render(<Entry />)

        await waitFor(() => {
            expect(screen.getByText('Refresh Embed Code')).toBeInTheDocument()
        })
    })

    it('clears all entry fields when unlinking', async () => {
        const sdk = makeLinkedSdk(CEROS_EMBED_CODE)
        mockUseSDK.mockReturnValue(sdk as any)

        render(<Entry />)

        const unlinkButton = await screen.findByText('Unlink Experience')
        fireEvent.submit(unlinkButton.closest('form')!)

        await waitFor(() => {
            expect(sdk.entry.fields.title.removeValue).toHaveBeenCalled()
            expect(sdk.entry.fields.url.removeValue).toHaveBeenCalled()
            expect(sdk.entry.fields.embedCode.removeValue).toHaveBeenCalled()
        })
    })

})

describe('Entry — LinkedState refresh and embed style', () => {
    const INLINE_SNIPPET = '<div data-flex-inline data-embed-height="auto"></div>'
    const IFRAME_SNIPPET = '<iframe src="https://myaccount.ceros.site/flex-experience"></iframe>'

    const RESOLVED = {
        isFlex: true,
        name: 'Fifth Brass Storm',
        url: 'https://myaccount.ceros.site/flex-experience',
        embedCodes: { fullHeight: IFRAME_SNIPPET, inline: INLINE_SNIPPET },
    }

    let sdk: ReturnType<typeof makeLinkedSdk>

    const renderLinked = async (storedEmbedCode: string) => {
        sdk = makeLinkedSdk(storedEmbedCode)
        sdk.entry.fields.url.getValue.mockReturnValue('https://myaccount.ceros.site/flex-experience')
        mockUseSDK.mockReturnValue(sdk as any)
        render(<Entry />)
        await screen.findByRole('button', { name: /refresh embed code/i })
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockFindCerosActionId.mockResolvedValue('action-1')
    })

    it('refreshes an inline entry with the inline snippet, never iframe HTML', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(INLINE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(INLINE_SNIPPET)
        )
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalledWith(IFRAME_SNIPPET)
    })

    it('refreshes an iframe entry with the iframe snippet', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(IFRAME_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(IFRAME_SNIPPET)
        )
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalledWith(INLINE_SNIPPET)
    })

    it('keeps the stored embed code when refresh fails', async () => {
        mockCallCerosAction.mockResolvedValue({ error: 'boom' })
        await renderLinked(INLINE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() => expect(screen.getByText(/error refreshing/i)).toBeInTheDocument())
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalled()
        expect(sdk.entry.save).not.toHaveBeenCalled()
    })

    it('opens the confirmation screen with the current mode preselected via Change embed style', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(INLINE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /change embed style/i }))

        await waitFor(() => expect(screen.getByLabelText(/embed script/i)).toBeChecked())
    })

    it('rewrites the stored code when a different style is confirmed', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(INLINE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /change embed style/i }))
        await waitFor(() => expect(screen.getByLabelText(/full height/i)).toBeInTheDocument())

        fireEvent.click(screen.getByLabelText(/full height/i))
        fireEvent.click(screen.getByRole('button', { name: /use this style/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(IFRAME_SNIPPET)
        )
    })

    it('preselects Scrollable via Change embed style when the stored code is the scrollable snippet', async () => {
        const SCROLLABLE_SNIPPET =
            '<iframe src="https://myaccount.ceros.site/flex-experience?scrollable=true"></iframe>'
        mockCallCerosAction.mockResolvedValue({
            data: { ...RESOLVED, embedCodes: { ...RESOLVED.embedCodes, scrollable: SCROLLABLE_SNIPPET } },
        })
        await renderLinked(SCROLLABLE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /change embed style/i }))

        await waitFor(() => expect(screen.getByLabelText(/scrollable/i)).toBeChecked())
        expect(screen.getByLabelText(/full height/i)).not.toBeChecked()
    })

    it('preserves an exact-match Scrollable entry on refresh, never full-height', async () => {
        // Restores coverage the scrollable-only-Studio test below doesn't
        // provide: here the model offers BOTH fullHeight and scrollable, and
        // the stored code is byte-identical to the scrollable snippet, so this
        // exercises currentVariant's exact-match branch specifically — the
        // exact-match result must still win over any fallback preference.
        const SCROLLABLE_SNIPPET =
            '<iframe src="https://myaccount.ceros.site/flex-experience?scrollable=true"></iframe>'
        mockCallCerosAction.mockResolvedValue({
            data: { ...RESOLVED, embedCodes: { ...RESOLVED.embedCodes, scrollable: SCROLLABLE_SNIPPET } },
        })
        await renderLinked(SCROLLABLE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(SCROLLABLE_SNIPPET)
        )
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalledWith(IFRAME_SNIPPET)
    })

    it('refreshes a scrollable-only Studio entry with the updated snippet, with no fullHeight variant to fall back on', async () => {
        // Realistic Studio-scrollable shape: resolveViaOembed returns exactly
        // ONE key (scrollable), never a fullHeight key alongside it. The stored
        // code is also byte-DIFFERENT from what's returned, so the exact-match
        // branch of currentVariant can't fire — this is the only case where
        // Refresh does any actual work, and the one the naive
        // "guess fullHeight, else throw" fallback broke.
        const OLD_SCROLLABLE_SNIPPET =
            '<div class="ceros-experience">https://view.ceros.com/myaccount/scrollable-experience</div>'
        const NEW_SCROLLABLE_SNIPPET =
            '<div class="ceros-experience" data-refreshed="true">https://view.ceros.com/myaccount/scrollable-experience</div>'
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: false,
                name: 'Scrollable One',
                url: 'https://view.ceros.com/myaccount/scrollable-experience',
                embedCodes: { scrollable: NEW_SCROLLABLE_SNIPPET },
            },
        })
        await renderLinked(OLD_SCROLLABLE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(NEW_SCROLLABLE_SNIPPET)
        )
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
    })

    it('never overwrites an inline entry with an iframe snippet when the model is missing inline (degraded resolveExperience response)', async () => {
        // Designed, transient shape: resolveExperience falls back to fullHeight
        // and flags inlineUnavailable when the Flex manifest can't be read (see
        // functions/ceros-api.ts). An inline entry refreshed against this
        // response has no exact match and no inline key to fall back to — it
        // must report that the style is unavailable and leave the stored code
        // alone, rather than silently rewriting the author's inline choice as
        // iframe HTML.
        //
        // The note is the style-unavailable one, NOT the refresh/unlink error:
        // the experience resolved fine here, so telling the author to check
        // that it is still published and to unlink and relink would send them
        // after a problem they do not have.
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: true,
                name: 'Fifth Brass Storm',
                url: 'https://myaccount.ceros.site/flex-experience',
                embedCodes: { fullHeight: IFRAME_SNIPPET },
                inlineUnavailable: true,
            },
        })
        await renderLinked(INLINE_SNIPPET)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() => expect(screen.getByText(/no Inline embed code/i)).toBeInTheDocument())
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalledWith(IFRAME_SNIPPET)
        expect(sdk.entry.save).not.toHaveBeenCalled()
    })

    it('leaves a Flex Scrollable entry untouched when the resolved model carries no scrollable snippet', async () => {
        // The review case, and the DEFAULT for Flex rather than an edge: the
        // picker can always insert Scrollable for Flex, but resolveExperience
        // can never return a scrollable snippet for one — the manifest has no
        // scrollable delivery mode and Flex oEmbed is full-height only. Refresh
        // used to fall back to fullHeight here and report success, silently
        // converting a deliberate Scrollable entry to Full height.
        const FLEX_SCROLLABLE =
            '<div data-embed-width="100%" data-embed-height="800px" data-ceros-experience="https://myaccount.ceros.site/flex-experience"></div>\n' +
            '<script src="https://assets.ceros.site/js/embed.v1.js"></script>'
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(FLEX_SCROLLABLE)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() => expect(screen.getByText(/no Scrollable embed code/i)).toBeInTheDocument())
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalled()
        expect(sdk.entry.save).not.toHaveBeenCalled()
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
    })

    it('leaves a Flex Full height entry untouched when the resolved model carries only an inline snippet', async () => {
        // Reachable degraded shape: a manifest can expose an inline delivery
        // mode and no iframe one, so resolveExperience returns inline alone.
        // The stored full-height snippet is still identifiable from its own
        // markup, so refresh must name Full height as the unavailable style and
        // keep the stored code — the old preference-order fallback reported the
        // publish/unlink error here instead, which describes a problem this
        // entry does not have.
        const FLEX_FULL_HEIGHT =
            '<div data-embed-width="100%" data-embed-height="auto" data-ceros-experience="https://myaccount.ceros.site/flex-experience"></div>\n' +
            '<script src="https://assets.ceros.site/js/embed.v1.js"></script>'
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: true,
                name: 'Fifth Brass Storm',
                url: 'https://myaccount.ceros.site/flex-experience',
                embedCodes: { inline: INLINE_SNIPPET },
            },
        })
        await renderLinked(FLEX_FULL_HEIGHT)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() => expect(screen.getByText(/no Full height embed code/i)).toBeInTheDocument())
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalled()
        expect(sdk.entry.save).not.toHaveBeenCalled()
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
    })

    it('refreshes a Scrollable entry by its markup when both iframe variants are offered and neither matches byte-for-byte', async () => {
        // Pins "identify the stored style from the markup, never from a
        // preference order". Nothing on the wire offers both iframe variants
        // today, but a scrollable-capable resolve path would, and this is the
        // exact shape in which the old fallback silently chose fullHeight.
        const STORED_SCROLLABLE =
            '<div data-embed-width="100%" data-embed-height="800px" data-ceros-experience="https://myaccount.ceros.site/flex-experience"></div>'
        const NEW_FULL_HEIGHT =
            '<div data-embed-width="100%" data-embed-height="auto" data-ceros-experience="https://myaccount.ceros.site/flex-experience" data-republished="true"></div>'
        const NEW_SCROLLABLE =
            '<div data-embed-width="100%" data-embed-height="800px" data-ceros-experience="https://myaccount.ceros.site/flex-experience" data-republished="true"></div>'
        mockCallCerosAction.mockResolvedValue({
            data: { ...RESOLVED, embedCodes: { fullHeight: NEW_FULL_HEIGHT, scrollable: NEW_SCROLLABLE } },
        })
        await renderLinked(STORED_SCROLLABLE)

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        await waitFor(() => expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(NEW_SCROLLABLE))
        expect(sdk.entry.fields.embedCode.setValue).not.toHaveBeenCalledWith(NEW_FULL_HEIGHT)
    })

    it('rolls back the in-memory draft when a refresh save fails, showing the save-failure note', async () => {
        const REFRESHED_INLINE_SNIPPET = '<div data-flex-inline data-embed-height="480"></div>'
        mockCallCerosAction.mockResolvedValue({
            data: { ...RESOLVED, embedCodes: { ...RESOLVED.embedCodes, inline: REFRESHED_INLINE_SNIPPET } },
        })
        await renderLinked(INLINE_SNIPPET)
        sdk.entry.save.mockRejectedValueOnce(new Error('save failed'))

        fireEvent.click(screen.getByRole('button', { name: /refresh embed code/i }))

        // A save/version-conflict failure during Refresh is a save problem, not
        // a sign the experience is unpublished — it must show the save-failure
        // note, not the "unlink and relink" resolve-failure message.
        await waitFor(() => expect(screen.getByText(/couldn't save this entry/i)).toBeInTheDocument())
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
        expect(sdk.entry.fields.embedCode.setValue).toHaveBeenCalledWith(REFRESHED_INLINE_SNIPPET)
        expect(sdk.entry.fields.embedCode.setValue).toHaveBeenLastCalledWith(INLINE_SNIPPET)
    })

    it('shows a save-failure note, not the refresh/unlink message, when applying a new style fails to save', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(INLINE_SNIPPET)
        sdk.entry.save.mockRejectedValueOnce(new Error('save failed'))

        fireEvent.click(screen.getByRole('button', { name: /change embed style/i }))
        await waitFor(() => expect(screen.getByLabelText(/full height/i)).toBeInTheDocument())

        fireEvent.click(screen.getByLabelText(/full height/i))
        fireEvent.click(screen.getByRole('button', { name: /use this style/i }))

        await waitFor(() => expect(screen.getByText(/couldn't save this entry/i)).toBeInTheDocument())
        expect(screen.queryByText(/error refreshing/i)).not.toBeInTheDocument()
    })

    it('clears a stale save-failure note once a retried style change succeeds', async () => {
        mockCallCerosAction.mockResolvedValue({ data: RESOLVED })
        await renderLinked(INLINE_SNIPPET)
        sdk.entry.save.mockRejectedValueOnce(new Error('save failed'))

        fireEvent.click(screen.getByRole('button', { name: /change embed style/i }))
        await waitFor(() => expect(screen.getByLabelText(/full height/i)).toBeInTheDocument())
        fireEvent.click(screen.getByLabelText(/full height/i))
        fireEvent.click(screen.getByRole('button', { name: /use this style/i }))
        await waitFor(() => expect(screen.getByText(/couldn't save this entry/i)).toBeInTheDocument())

        // Retry the same pending choice — this time the save succeeds.
        fireEvent.click(screen.getByRole('button', { name: /use this style/i }))

        await waitFor(() =>
            expect(sdk.entry.fields.embedCode.setValue).toHaveBeenLastCalledWith(IFRAME_SNIPPET)
        )
        expect(screen.queryByText(/couldn't save this entry/i)).not.toBeInTheDocument()
    })
})

describe('Entry — EmptyState trims the pasted URL', () => {
    let sdk: ReturnType<typeof makeMockSdk>

    beforeEach(() => {
        vi.clearAllMocks()
        sdk = makeMockSdk()
        mockUseSDK.mockReturnValue(sdk as any)
        mockFindCerosActionId.mockResolvedValue('action-1')
    })

    const pasteAndSubmit = async (url: string) => {
        render(<Entry />)
        const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: url } })
        fireEvent.submit(input.closest('form')!)
    }

    it('sends a trimmed URL to the function', async () => {
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: true, name: 'Fifth Brass Storm',
                url: 'https://myaccount.ceros.site/flex-experience',
                embedCodes: { fullHeight: '<iframe></iframe>' },
            },
        })

        await pasteAndSubmit('  https://myaccount.ceros.site/flex-experience\n')

        await waitFor(() => expect(mockCallCerosAction).toHaveBeenCalled())
        expect(mockCallCerosAction).toHaveBeenCalledWith(expect.anything(), 'action-1', {
            action: 'resolveExperience',
            url: 'https://myaccount.ceros.site/flex-experience',
        })
    })

    it('rejects a whitespace-only paste without calling the function', async () => {
        await pasteAndSubmit('   ')

        await waitFor(() => expect(screen.getByText(/Enter a full experience URL/i)).toBeInTheDocument())
        expect(mockCallCerosAction).not.toHaveBeenCalled()
    })
})


describe('Entry — EmptyState trims the pasted URL', () => {
    let sdk: ReturnType<typeof makeMockSdk>

    beforeEach(() => {
        vi.clearAllMocks()
        sdk = makeMockSdk()
        mockUseSDK.mockReturnValue(sdk as any)
        mockFindCerosActionId.mockResolvedValue('action-1')
    })

    const pasteAndSubmit = async (url: string) => {
        render(<Entry />)
        const input = await screen.findByPlaceholderText(/https:\/\/account\.ceros\.site\//i)
        fireEvent.change(input, { target: { value: url } })
        fireEvent.submit(input.closest('form')!)
    }

    it('sends a trimmed URL to the function', async () => {
        mockCallCerosAction.mockResolvedValue({
            data: {
                isFlex: true, name: 'Fifth Brass Storm',
                url: 'https://myaccount.ceros.site/flex-experience',
                embedCodes: { fullHeight: '<iframe></iframe>' },
            },
        })

        await pasteAndSubmit('  https://myaccount.ceros.site/flex-experience\n')

        await waitFor(() => expect(mockCallCerosAction).toHaveBeenCalled())
        expect(mockCallCerosAction).toHaveBeenCalledWith(expect.anything(), 'action-1', {
            action: 'resolveExperience',
            url: 'https://myaccount.ceros.site/flex-experience',
        })
    })

    it('rejects a whitespace-only paste without calling the function', async () => {
        await pasteAndSubmit('   ')

        await waitFor(() => expect(screen.getByText(/Enter a full experience URL/i)).toBeInTheDocument())
        expect(mockCallCerosAction).not.toHaveBeenCalled()
    })
})
