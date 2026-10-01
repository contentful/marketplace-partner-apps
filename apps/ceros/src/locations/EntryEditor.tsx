import { EditorAppSDK, EntryAPI } from '@contentful/app-sdk'
import {
    Box,
    Button,
    Flex,
    Form,
    FormControl,
    Note,
    Paragraph,
    TextInput,
} from '@contentful/f36-components'
import { useSDK } from '@contentful/react-apps-toolkit'
import React, { Dispatch, useEffect, useState } from 'react'

import cerosLogo from '../assets/ceros-logo.svg'
import styles from '../styles'
import { isKnownCerosHost, isPasteableUrl } from '../oembed'
import { resolveVanityToCanonical } from '../vanity'
import { AppInstallationParameters } from './ConfigScreen'
import tokens from '@contentful/f36-tokens'
import { ExperiencePicker, SelectedExperience } from './ExperiencePicker'
import { classifyEmbed, classifyVariant, EmbedKind } from '../embed-classify'
import { EmbedPreview } from '../EmbedPreview'
import { callCerosAction, findCerosActionId } from '../ceros-action'
import { ConfirmationModel, EmbedVariant, ExperienceConfirmation } from '../ExperienceConfirmation'

export { classifyEmbed } from '../embed-classify'
export type { EmbedKind } from '../embed-classify'

// Restores a field to a previously-captured value. getValue() returns
// undefined for a field that was never set (e.g. a fresh entry) — setValue()
// is the wrong API for clearing a field in that case (it also leaves an
// unhandled promise), so an absent previous value is restored with
// removeValue() instead.
const restoreField = (
    field: { setValue: (value: unknown) => unknown; removeValue: () => unknown },
    previousValue: unknown
) => {
    if (previousValue === undefined) {
        field.removeValue()
    } else {
        field.setValue(previousValue)
    }
}

// Style names for the style-unavailable note. Deliberately not
// ExperienceConfirmation's VARIANT_LABELS, whose inline label ("Inline (embed
// script) — no iframe") is written to label a radio, not to sit in a sentence.
const VARIANT_NOUNS: Record<EmbedVariant, string> = {
    fullHeight: 'Full height',
    scrollable: 'Scrollable',
    inline: 'Inline',
}

// resolveVanityToCanonical returns null for every case it cannot read, and a vanity
// host exposes nothing that would let us tell those cases apart: a Studio experience
// served there has no manifest, and neither does a site that isn't Ceros at all. So
// one message has to cover both, and it names the Studio case explicitly because that
// is the one an actual Ceros customer will hit.
const UNRECOGNISED_URL_ERROR =
    "We couldn't find a published Ceros experience at that URL. If it's a Studio experience on a " +
    'custom domain, paste its view.ceros.com URL instead — custom domains are currently supported ' +
    'for Flex experiences only.'

interface StateProps {
    entry: EntryAPI
    setLinked: Dispatch<any>
    parameters: AppInstallationParameters
}

function EmptyState({ entry, setLinked, parameters }: StateProps) {
    const sdk = useSDK<EditorAppSDK>()
    const [experienceUrl, setExperienceUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [isCerosExperienceInvalid, setIsCerosExperienceInvalid] = useState(false)
    const [isChooserOpen, setIsChooserOpen] = useState(false)
    const [saveError, setSaveError] = useState(false)
    const [confirming, setConfirming] = useState<ConfirmationModel | null>(null)
    const [resolveError, setResolveError] = useState<string | null>(null)

    // Commits a chosen experience + embed code to the entry. Shared by the
    // picker and the paste flow so both save identically.
    const commit = (name: string, url: string, embedCode: string) => {
        setLoading(true)

        // Capture the persisted values before writing the draft, so a failed
        // save can roll the in-memory fields back instead of leaving the
        // editor holding values that were never actually stored.
        const previousTitle = entry.fields[parameters.titleFieldId].getValue()
        const previousUrl = entry.fields[parameters.urlFieldId].getValue()
        const previousEmbedCode = entry.fields[parameters.embedCodeFieldId].getValue()

        entry.fields[parameters.titleFieldId].setValue(name)
        entry.fields[parameters.urlFieldId].setValue(url)
        entry.fields[parameters.embedCodeFieldId].setValue(embedCode)

        setSaveError(false)
        entry.save()
            .then(() => {
                setLoading(false)
                setLinked(true)
            })
            .catch((err) => {
                console.error('Failed to save entry:', err)
                // Flip the UI state first: if a rollback call below ever threw,
                // the note would otherwise be dropped and the button would be
                // stuck on its loading label — the exact failure mode the
                // rollback itself was added to eliminate.
                setSaveError(true)
                setLoading(false)
                restoreField(entry.fields[parameters.titleFieldId], previousTitle)
                restoreField(entry.fields[parameters.urlFieldId], previousUrl)
                restoreField(entry.fields[parameters.embedCodeFieldId], previousEmbedCode)
            })
    }

    const linkByUrl = async (rawUrl: string) => {
        setIsCerosExperienceInvalid(false)
        setResolveError(null)
        setSaveError(false)

        // Copied URLs routinely arrive with surrounding whitespace or a trailing
        // newline. Trim once here so everything downstream — the pre-filter, the
        // function call, and the oEmbed query the function builds from this
        // string — sees the same clean value.
        const url = rawUrl.trim()

        // The pre-filter can only reject input that isn't an https URL at all. It
        // deliberately does NOT check the hostname any more: a vanity domain is an
        // arbitrary customer host, so its name says nothing about whether it fronts a
        // Ceros experience. That question is settled by actually trying to resolve it.
        if (!isPasteableUrl(url)) {
            setIsCerosExperienceInvalid(true)
            return
        }

        setLoading(true)
        try {
            // A known Ceros host needs no discovery — resolveExperience HEADs it and
            // reads x-flex-manifest itself — so this path stays request-for-request
            // what it was before vanity domains existed. Anything else is translated
            // to its canonical URL first, in the browser, because the function cannot
            // fetch an arbitrary host at all (allowNetworks cannot express one).
            let resolvableUrl = url
            if (!isKnownCerosHost(url)) {
                const canonicalUrl = await resolveVanityToCanonical(url)
                if (!canonicalUrl) throw new Error(UNRECOGNISED_URL_ERROR)
                resolvableUrl = canonicalUrl
            }

            const actionId = await findCerosActionId(sdk)
            const res = await callCerosAction(sdk, actionId, {
                action: 'resolveExperience',
                url: resolvableUrl,
            })
            if (res.error) throw new Error(String(res.error))

            const d = res.data as ConfirmationModel
            if (!d || !d.embedCodes || Object.keys(d.embedCodes).length === 0) {
                throw new Error('No embed code could be generated for this experience.')
            }
            setConfirming(d)
        } catch (err) {
            console.error('Failed to resolve experience:', err)
            setResolveError(err instanceof Error ? err.message : String(err))
        } finally {
            setLoading(false)
        }
    }

    const handleSelectExperience = ({ name, url, embedCode }: SelectedExperience) => {
        setIsChooserOpen(false)
        commit(name, url, embedCode)
    }

    return (
        <>
            {saveError && (
                <Box marginBottom="spacingM">
                    <Note variant="negative">
                        Couldn't save this entry. Please try again. If the problem persists, refresh Contentful and retry.
                    </Note>
                </Box>
            )}
            {confirming ? (
                <>
                    <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />
                    <ExperienceConfirmation
                        model={confirming}
                        onInsert={(embedCode) => commit(confirming.name, confirming.url, embedCode)}
                        onBack={() => setConfirming(null)}
                        isBusy={loading}
                    />
                </>
            ) : (
                <>
                    <ExperiencePicker
                        isShown={isChooserOpen}
                        onClose={() => setIsChooserOpen(false)}
                        onSelect={handleSelectExperience}
                    />

                    {resolveError && (
                        <Box marginBottom="spacingM">
                            <Note variant="negative">{resolveError}</Note>
                        </Box>
                    )}

                    <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />

                    <Paragraph>
                        Enter the link to your published Ceros experience below, or browse your experiences using the Ceros
                        API.
                    </Paragraph>

                    <Form onSubmit={() => linkByUrl(experienceUrl)}>
                        <FormControl isInvalid={isCerosExperienceInvalid}>
                            <FormControl.Label isRequired>Ceros Experience URL</FormControl.Label>
                            <TextInput
                                value={experienceUrl}
                                type="text"
                                name="experienceUrl"
                                placeholder="https://account.ceros.site/experience"
                                onChange={(e) => setExperienceUrl(e.target.value)}
                            />
                            {isCerosExperienceInvalid && (
                                <FormControl.ValidationMessage>
                                    Enter a full experience URL beginning with https://
                                </FormControl.ValidationMessage>
                            )}
                        </FormControl>

                        <Flex gap="spacingM">
                            <Button variant="positive" type="submit" isDisabled={loading} isLoading={loading}>
                                {loading ? 'Linking Experience' : 'Link Experience'}
                            </Button>
                            <Button
                                variant="secondary"
                                isDisabled={loading}
                                onClick={(e: React.MouseEvent) => {
                                    e.preventDefault()
                                    setIsChooserOpen(true)
                                }}
                            >
                                Browse Experiences
                            </Button>
                        </Flex>
                    </Form>
                </>
            )}
        </>
    )
}

function LinkedState({ entry, setLinked, parameters }: StateProps) {
    const sdk = useSDK<EditorAppSDK>()

    // State for unlinking experience
    const [unlinkLoading, setUnlinkLoading] = useState(false)

    // Unlinks the experience from the entry
    const unlinkExperience = async () => {
        setUnlinkLoading(true)
        setLinked(false)

        for (const field of Object.values(entry.fields)) {
            field.removeValue()
        }

        entry.save().then(() => {
            setUnlinkLoading(false)
        })
    }

    // State for refreshing embed code
    const [refreshLoading, setRefreshLoading] = useState(false)
    // Set by a failure to RESOLVE the experience — refreshEmbedCode's or
    // openStyleChooser's call to resolveLinked, or refreshEmbedCode finding no
    // matching variant. The message is specifically about the experience being
    // unreachable/unpublished, so it must never fire for a save problem.
    const [isRefreshError, setIsRefreshError] = useState(false)
    // Set by a failed entry.save() — from refreshEmbedCode's write or
    // applyStyle's write. Kept separate from isRefreshError so a save or
    // version-conflict failure never shows advice ("unlink and relink") that's
    // meant for an unresolvable experience — see EmptyState's
    // saveError/resolveError split, which this mirrors.
    const [isSaveError, setIsSaveError] = useState(false)
    // Set when refresh positively identified the stored style but the resolved
    // model has no snippet in it — the stored code is kept and the author is
    // told which style was unavailable. Held as the variant rather than a
    // boolean so the note can name it. Kept apart from isRefreshError because
    // the experience resolved fine, and from isSaveError because nothing was
    // written.
    const [styleUnavailable, setStyleUnavailable] = useState<EmbedVariant | null>(null)

    // State for the embed code
    const [embedCode, setEmbedCode] = useState(entry.fields[parameters.embedCodeFieldId].getValue())
    const [embedKind, setEmbedKind] = useState<EmbedKind>('none')
    useEffect(() => {
        setEmbedKind(classifyEmbed(embedCode))
    }, [embedCode])

    const [confirming, setConfirming] = useState<ConfirmationModel | null>(null)
    const [styleLoading, setStyleLoading] = useState(false)
    const [applyingStyle, setApplyingStyle] = useState(false)

    // Resolves the linked experience's currently-available variants. Shared by
    // refresh and "Change embed style" so both see the same set.
    const resolveLinked = async (): Promise<ConfirmationModel> => {
        const experienceUrl = entry.fields[parameters.urlFieldId].getValue()
        const actionId = await findCerosActionId(sdk)
        const res = await callCerosAction(sdk, actionId, { action: 'resolveExperience', url: experienceUrl })
        if (res.error) throw new Error(String(res.error))
        const model = res.data as ConfirmationModel
        if (!model?.embedCodes) throw new Error('No embed code could be generated for this experience.')
        return model
    }

    // Identifies which variant is currently stored, so refresh can rewrite the
    // entry in the style it was inserted with and "Change embed style" can
    // preselect it. Three tiers, in descending order of certainty:
    //
    // 1. An exact match against the model's own codes — unambiguous.
    // 2. classifyVariant on the stored markup. This is what makes a scrollable
    //    entry identifiable at all: resolveExperience cannot offer every
    //    variant the picker inserted from (the Flex manifest carries no
    //    scrollable snippet, and Studio's oEmbed payload carries whichever
    //    single variant the experience published with), so for those entries
    //    tier 1 can never match and the markup is the only evidence left.
    // 3. Only when the markup is genuinely unreadable, and only for an iframe
    //    entry: accept the model's offer if it leaves no choice. One iframe
    //    variant offered means one possible answer; two means we would be
    //    guessing, so this returns null instead.
    //
    // null means "unknown" — callers must refuse to rewrite rather than guess.
    // Guessing is what this replaced: preferring fullHeight whenever both
    // iframe variants were absent from the comparison silently rewrote a
    // deliberate Scrollable entry as Full height, and the same guess across the
    // iframe/inline boundary would rewrite an inline entry as an iframe one
    // whenever resolveExperience returned its designed degraded response
    // (`inlineUnavailable: true`, only an iframe key present — see
    // functions/ceros-api.ts).
    const currentVariant = (model: ConfirmationModel): EmbedVariant | null => {
        const match = (Object.entries(model.embedCodes) as [EmbedVariant, string | undefined][]).find(
            ([, code]) => code === embedCode
        )
        if (match) return match[0]

        const identified = classifyVariant(embedCode)
        if (identified) return identified

        // Gating on the kind rather than assuming it: classifyVariant answers
        // every inline snippet, so an inline entry cannot reach this line
        // today, and 'none' cannot either (the buttons that call this render
        // only when the kind is not 'none'). The guard is what keeps a
        // cross-kind rewrite impossible if either of those ever stops holding.
        if (embedKind !== 'iframe') return null

        const offered = (['fullHeight', 'scrollable'] as const).filter((v) => model.embedCodes[v])
        return offered.length === 1 ? offered[0] : null
    }

    // Refresh rewrites the embed code in the SAME variant it was stored in, and
    // rewrites nothing at all when it cannot get that variant — the one thing
    // it must never do is hand back a different style and report success.
    //
    // Two distinct non-success outcomes, kept apart because they ask the author
    // for different things: the style is unavailable (the experience is fine;
    // Ceros just doesn't offer that snippet, which for a Flex Scrollable entry
    // is permanent — see styleUnavailable), versus the variant is unknown (we
    // cannot read the stored markup, which is a bug or a snippet shape we don't
    // recognise, and is reported through isRefreshError).
    const refreshEmbedCode = async () => {
        setRefreshLoading(true)
        setIsRefreshError(false)
        setIsSaveError(false)
        setStyleUnavailable(null)
        // Distinguishes a save failure (routed to isSaveError below) from every
        // other failure in this function (routed to isRefreshError), without
        // losing that distinction if the rollback setValue itself throws.
        let saveFailed = false
        try {
            const model = await resolveLinked()
            const variant = currentVariant(model)
            if (!variant) throw new Error('Could not determine which embed style this entry is stored in.')

            const next = model.embedCodes[variant]
            if (!next) {
                // The experience resolved; it just has no snippet in this
                // style. Leave the stored code alone and say so — this is not
                // a failure of the experience, so it must not route to
                // isRefreshError's "make sure it's still published" advice.
                setStyleUnavailable(variant)
                return
            }

            // Capture the persisted value before writing the draft, so a failed
            // save can roll the in-memory field back instead of leaving the
            // editor showing a value that was never actually stored.
            const previous = embedCode
            entry.fields[parameters.embedCodeFieldId].setValue(next)
            try {
                await entry.save()
            } catch (saveErr) {
                saveFailed = true
                entry.fields[parameters.embedCodeFieldId].setValue(previous)
                throw saveErr
            }
            setEmbedCode(next)
        } catch (err) {
            // Leave the stored value untouched on every failure path.
            console.error('Failed to refresh embed code:', err)
            if (saveFailed) {
                // A version conflict or transient save failure — not a sign the
                // experience is unpublished, so never suggest unlinking here.
                setIsSaveError(true)
            } else {
                setIsRefreshError(true)
            }
        } finally {
            setRefreshLoading(false)
        }
    }

    const openStyleChooser = async () => {
        setStyleLoading(true)
        setIsRefreshError(false)
        setIsSaveError(false)
        setStyleUnavailable(null)
        try {
            setConfirming(await resolveLinked())
        } catch (err) {
            console.error('Failed to resolve experience:', err)
            setIsRefreshError(true)
        } finally {
            setStyleLoading(false)
        }
    }

    const applyStyle = async (nextEmbedCode: string) => {
        setApplyingStyle(true)
        // Clear both error states, not just this call's own: a prior failed
        // Refresh could otherwise leave "unlink and relink" on screen above a
        // style change that just succeeded.
        setIsRefreshError(false)
        setIsSaveError(false)
        // Also cleared here: the author has just chosen a style that IS
        // available, so a note about the previous one being unavailable would
        // linger over a successful change.
        setStyleUnavailable(null)
        const previous = embedCode
        entry.fields[parameters.embedCodeFieldId].setValue(nextEmbedCode)
        try {
            try {
                await entry.save()
            } catch (saveErr) {
                entry.fields[parameters.embedCodeFieldId].setValue(previous)
                throw saveErr
            }
            setEmbedCode(nextEmbedCode)
            setConfirming(null)
        } catch (err) {
            // A save failure here is a save/version-conflict problem, not a
            // sign the experience is unpublished — keep it out of isRefreshError
            // so the unlink/relink advice never shows for it.
            console.error('Failed to save embed style:', err)
            setIsSaveError(true)
        } finally {
            setApplyingStyle(false)
        }
    }

    return (
        <>
            {isRefreshError && (
                <Box marginBottom="spacingXl">
                    <Note variant="negative">
                        There was an error refreshing the embed code. Make sure the experience is still published. If
                        you still have trouble, try unlinking and relinking the experience.
                    </Note>
                </Box>
            )}

            {isSaveError && (
                <Box marginBottom="spacingXl">
                    <Note variant="negative">
                        Couldn't save this entry. Please try again. If the problem persists, refresh Contentful and
                        retry.
                    </Note>
                </Box>
            )}

            {styleUnavailable && (
                <Box marginBottom="spacingXl">
                    {/* One template literal rather than JSX interpolation, so
                        the sentence stays a single text node and reads as one
                        string to anything matching on it. */}
                    <Note variant="warning">
                        {`Ceros returned no ${VARIANT_NOUNS[styleUnavailable]} embed code for this experience, so the ` +
                            `stored embed code was left unchanged. Use "Change embed style" to switch to a style ` +
                            `Ceros can provide.`}
                    </Note>
                </Box>
            )}

            <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />

            {embedKind !== 'none' ? (
                <>
                    <Paragraph>
                        A Ceros experience is linked to this entry. You can see a preview of it below.
                    </Paragraph>

                    <Paragraph>
                        If you recently changed the canvas size of the experience or added a tablet or mobile variant,
                        click "Refresh Embed Code" to pull the latest changes.
                    </Paragraph>

                    <Flex>
                        <Box marginRight="spacingM">
                            <Form onSubmit={unlinkExperience}>
                                <Button
                                    variant="negative"
                                    type="submit"
                                    isDisabled={unlinkLoading || refreshLoading}
                                    isLoading={unlinkLoading}
                                >
                                    {unlinkLoading ? 'Unlinking Experience...' : 'Unlink Experience'}
                                </Button>
                            </Form>
                        </Box>
                        <Box marginRight="spacingM">
                            <Form onSubmit={refreshEmbedCode}>
                                <Button
                                    variant="secondary"
                                    type="submit"
                                    isDisabled={unlinkLoading || refreshLoading}
                                    isLoading={refreshLoading}
                                >
                                    {refreshLoading ? 'Refreshing Embed Code...' : 'Refresh Embed Code'}
                                </Button>
                            </Form>
                        </Box>
                        <Box marginRight="spacingM">
                            <Button
                                variant="secondary"
                                isDisabled={unlinkLoading || refreshLoading || styleLoading}
                                isLoading={styleLoading}
                                onClick={openStyleChooser}
                            >
                                Change embed style
                            </Button>
                        </Box>
                    </Flex>

                    {confirming ? (
                        <ExperienceConfirmation
                            model={confirming}
                            // undefined, not null: an unidentifiable stored
                            // style means "no preselection", which is exactly
                            // ExperienceConfirmation's default-variant path.
                            initialVariant={currentVariant(confirming) ?? undefined}
                            onInsert={(nextEmbedCode) => applyStyle(nextEmbedCode)}
                            onBack={() => setConfirming(null)}
                            insertLabel="Use this style"
                            isBusy={applyingStyle}
                        />
                    ) : (
                        <EmbedPreview embedCode={embedCode} />
                    )}
                </>
            ) : (
                <>
                    <Paragraph>The embed code in this entry doesn't look like a Ceros experience:</Paragraph>

                    <Box marginTop="spacingL" marginBottom="spacingL" style={{ backgroundColor: tokens.gray200 }}>
                        <code>{embedCode}</code>
                    </Box>

                    <Paragraph>
                        If want to link a Ceros experience to this entry, click "Reset Entry" and then enter your
                        published experience URL.
                    </Paragraph>

                    <Form onSubmit={unlinkExperience}>
                        <Button
                            variant="negative"
                            type="submit"
                            isDisabled={unlinkLoading || refreshLoading}
                            isLoading={unlinkLoading}
                        >
                            {unlinkLoading ? 'Resetting entry...' : 'Reset Entry'}
                        </Button>
                    </Form>
                </>
            )}
        </>
    )
}

const Entry = () => {
    // Access to the SDK provided by the @contentful/react-apps-toolkit
    const sdk = useSDK<EditorAppSDK>()

    // Fetch current app installation parameters
    const [parameters, setParameters] = useState<AppInstallationParameters>({
        contentTypeId: '',
        titleFieldId: '',
        urlFieldId: '',
        embedCodeFieldId: '',
    })
    useEffect(() => {
        ;(async () => {
            console.debug('Loading current app installation parameters...')
            setParameters(sdk.parameters.installation as AppInstallationParameters)
        })()
    }, [sdk.parameters.installation])

    // Set linked state
    const [linked, setLinked] = useState(false)
    useEffect(() => {
        ;(async () => {
            setLinked(
                Boolean(
                    sdk.entry.fields[parameters.titleFieldId]?.getValue() &&
                        sdk.entry.fields[parameters.embedCodeFieldId]?.getValue()
                )
            )
        })()
    }, [sdk.entry, parameters.titleFieldId, parameters.urlFieldId, parameters.embedCodeFieldId])

    return (
        <div className={styles.body}>
            {[parameters.contentTypeId, parameters.titleFieldId, parameters.urlFieldId, parameters.embedCodeFieldId].some((v) => !v) ? (
                <Note variant="negative">
                    The Ceros app isn't fully configured. Please go to the Ceros app configuration screen to configure
                    it.
                </Note>
            ) : sdk.entry.getSys().contentType.sys.id !== parameters.contentTypeId ? (
                <Note variant="negative">
                    The content type of this entry isn't configured to use the Ceros app. Please go to the Ceros app
                    configuration screen to configure it.
                </Note>
            ) : linked ? (
                <LinkedState key={linked.toString()} entry={sdk.entry} setLinked={setLinked} parameters={parameters} />
            ) : (
                <EmptyState key={linked.toString()} entry={sdk.entry} setLinked={setLinked} parameters={parameters} />
            )}
        </div>
    )
}

export default Entry
