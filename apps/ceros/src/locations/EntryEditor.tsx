import { EditorAppSDK, EntryAPI } from '@contentful/app-sdk'
import { Box, Button, Flex, Form, FormControl, Note, Paragraph, TextInput } from '@contentful/f36-components'
import { useSDK } from '@contentful/react-apps-toolkit'
import React, { Dispatch, useEffect, useState } from 'react'

import cerosLogo from '../assets/ceros-logo.svg'
import styles from '../styles'
import { getExperienceMetadata } from '../oembed'
import { AppInstallationParameters } from './ConfigScreen'
import tokens from '@contentful/f36-tokens'

interface StateProps {
    entry: EntryAPI
    setLinked: Dispatch<any>
    parameters: AppInstallationParameters
}

function EmptyState({ entry, setLinked, parameters }: StateProps) {
    const [experienceUrl, setExperienceUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [isCerosExperienceInvalid, setIsCerosExperienceInvalid] = useState(false)

    const linkExperience = async () => {
        // Set form to submitted
        setLoading(true)

        // Get experience metadata
        const experienceMetadata = await getExperienceMetadata(experienceUrl)

        // Save the data to the entry
        if (experienceMetadata) {
            entry.fields[parameters.titleFieldId].setValue(experienceMetadata['title'])
            entry.fields[parameters.urlFieldId].setValue(experienceMetadata['url'])
            entry.fields[parameters.embedCodeFieldId].setValue(experienceMetadata['html'])

            entry.save().then(() => {
                setLoading(false)
                setLinked(true)
            })
        } else {
            console.error(`Couldn't get experience metadata for url: '${experienceUrl}'`)
            setIsCerosExperienceInvalid(true)
            setLoading(false)
        }
    }

    return (
        <>
            <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />

            <Paragraph>
                Enter the link to your published Ceros experience below. The experience's name, embed code, etc. will be
                pulled and saved to Contentful.
            </Paragraph>

            <Form onSubmit={linkExperience}>
                <FormControl isInvalid={isCerosExperienceInvalid}>
                    <FormControl.Label isRequired>Ceros Experience URL</FormControl.Label>
                    <TextInput
                        value={experienceUrl}
                        type="text"
                        name="experienceUrl"
                        placeholder="https://view.ceros.com/account/experience"
                        onChange={(e) => setExperienceUrl(e.target.value)}
                    />
                    {isCerosExperienceInvalid && (
                        <FormControl.ValidationMessage>
                            The experience URL is invalid. Make sure it looks like
                            'https://view.ceros.com/account/experience' and that the experience is published.
                        </FormControl.ValidationMessage>
                    )}
                </FormControl>

                <Button variant="positive" type="submit" isDisabled={loading} isLoading={loading}>
                    {loading ? 'Linking Experience' : 'Link Experience'}
                </Button>
            </Form>
        </>
    )
}

function LinkedState({ entry, setLinked, parameters }: StateProps) {
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
    const [isRefreshError, setIsRefreshError] = useState(false)

    // Fetches the embed code again and saves it to the entry
    const refreshEmbedCode = async () => {
        setRefreshLoading(true)

        const experienceUrl = entry.fields[parameters.urlFieldId].getValue()
        const experienceMetadata = await getExperienceMetadata(experienceUrl)

        // Check if the metadata was able to be retrieved
        if (experienceMetadata) {
            entry.fields[parameters.embedCodeFieldId].setValue(experienceMetadata['html'])

            entry.save().then(() => {
                setEmbedCode(experienceMetadata['html'])
                setIsRefreshError(false)
                setRefreshLoading(false)
            })
        } else {
            console.error(`Couldn't get experience metadata for url: '${experienceUrl}'`)
            setIsRefreshError(true)
            setRefreshLoading(false)
        }
    }

    // State for the embed code
    const [embedCode, setEmbedCode] = useState(entry.fields[parameters.embedCodeFieldId].getValue())
    const [isCerosExperience, setIsCerosExperience] = useState(false)
    useEffect(() => {
        ;(async () => {
            // Determine if the embed code is for a Ceros experience
            setIsCerosExperience(
                Boolean(embedCode.includes('class="ceros-experience"') && embedCode.includes('https://view.ceros.com/'))
            )
        })()
    }, [embedCode])

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

            <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />

            {isCerosExperience ? (
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
                    </Flex>

                    <div className={styles.experienceEmbed} dangerouslySetInnerHTML={{ __html: embedCode }}></div>
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
            {Object.values(parameters).some((value) => value === null || value === undefined || value === '') ? (
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
