import { EditorAppSDK, EntryAPI } from '@contentful/app-sdk'
import { Box, Button, Flex, Form, FormControl, Note, Paragraph, TextInput, Select } from '@contentful/f36-components'
import { useSDK } from '@contentful/react-apps-toolkit'
import React, { Dispatch, useEffect, useState } from 'react'

import livestoryLogo from '../assets/livestory-logo.png'
import styles from '../styles'
import { AppInstallationParameters } from './ConfigScreen'
import tokens from '@contentful/f36-tokens'
import Superagent from 'superagent'
import { DEFAULT_API_URL } from '../config'

declare global {
    var LiveStory: new (a: string, b: any) => void;
}

interface StateProps {
    entry: EntryAPI
    setLinked: Dispatch<any>
    parameters: AppInstallationParameters
}

function EmptyState({ entry, setLinked, parameters }: StateProps) {
    const [experienceId, setExperienceId] = useState('')
    const [experienceType, setExperienceType] = useState('wall')
    const [loading, setLoading] = useState(false)
    const [isLiveStoryExperienceInvalid, setIsLiveStoryExperienceInvalid] = useState(false)

    const linkExperience = async () => {
        // Set form to submitted
        setLoading(true)
        const regex = new RegExp(/^[a-f\d]{24}$/i)

        // Save the data to the entry
        if (regex.test(experienceId) && ['wall', 'wallgroup'].includes(experienceType)) {
        
            entry.fields[parameters.contentIdFieldId].setValue(experienceId)
            entry.fields[parameters.contentTypeFieldId].setValue(experienceType)

            try {
                const res = await Superagent.get(`${DEFAULT_API_URL}/front/v4/${experienceType}/${experienceId}`)
                if (res && res.body) {

                    entry.fields[parameters.titleFieldId].setValue(res.body.title)
                    entry.fields['description'].setValue(res.body.description)

                    entry.save().then(() => {
                        setLoading(false)
                        setLinked(true)
                    })
                }
            } catch (err: any) {
                console.error(err)
                setLoading(false)
                if (err.status === 404) {
                    setIsLiveStoryExperienceInvalid(true)
                }
            }
            

           
        } else {
            console.error(`Couldn't load Live Story experience for id: '${experienceId}' and type: ${experienceType}`)
            setIsLiveStoryExperienceInvalid(true)
            setLoading(false)
        }
    }

    return (
        <>
            <img src={livestoryLogo} alt="Live Story Logo" className={styles.logo} width="150px" />

            <Paragraph>
                Enter the Content ID and Content Type of your published Live Story experience below. The experience's data will be
                pulled and saved to Contentful.
            </Paragraph>

            <Form onSubmit={linkExperience}>
                <FormControl isInvalid={isLiveStoryExperienceInvalid}>
                    <FormControl.Label isRequired>Live Story Experience ID</FormControl.Label>
                    <TextInput
                        value={experienceId}
                        type="text"
                        name="experienceUrl"
                        placeholder="Live Story Content ID"
                        onChange={(e) => setExperienceId(e.target.value)}
                    />
                    {isLiveStoryExperienceInvalid && (
                        <FormControl.ValidationMessage>
                            The experience ID is invalid. Make sure it follows <code>/^[a-f\d]{24}$/i</code> regex, that the experience is published and 
                            to have selected the right Live Story experience content type.
                        </FormControl.ValidationMessage>
                    )}
                </FormControl>
                <FormControl>
                    <FormControl.Label isRequired>Live Story Experience Type</FormControl.Label>
                    <Select
                        value={experienceType}
                        onChange={(e) => setExperienceType(e.target.value)}
                    >
                        {/* Render all available types */}
                        {['wall', 'wallgroup'].map((type) => (
                                <Select.Option key={type} value={type}>
                                    {type}
                                </Select.Option>
                            ))}
                    </Select>
                </FormControl>

                <Button variant="positive" type="submit" isDisabled={loading} isLoading={loading}>
                    {loading ? 'Linking Experience' : 'Link Experience'}
                </Button>
            </Form>
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
            if (field.id === 'id' || field.id === 'type') { // remove only Content ID and Content Type fields
                field.removeValue()
            }
        }

        entry.save().then(() => {
            setUnlinkLoading(false)
        })
    }

    // State for the LS experience
    const [isLSExperience, setIsLSExperience] = useState(false)
    useEffect(() => {
        ;(async () => {
            // Determine if the content id and content type represent a Live Story experience
            let res
            try {
                res = await Superagent.get(`${DEFAULT_API_URL}/front/v4/`+
                    `${entry.fields[parameters.contentTypeFieldId].getValue()}/${entry.fields[parameters.contentIdFieldId].getValue()}`)
            } catch (err) {
                res = null
            }
            
            setIsLSExperience(
                Boolean(!!res)
            )
        })()
    }, [entry.fields, parameters.contentIdFieldId, parameters.contentTypeFieldId])

    useEffect(() => {
        if (!isLSExperience || !entry.fields.id.getValue() || !entry.fields.type.getValue()) return
    
        new window.LiveStory(`ls-${entry.fields.id.getValue()}`, { type: entry.fields.type.getValue() });
    
    }, [isLSExperience, entry.fields.id, entry.fields.type])

    const currentLocale = () => {
        const locales = sdk.editor.getLocaleSettings().active
        return locales && locales.length ? locales[0].replace('-', '_') : ''
    }

    return (
        <>
            <img src={livestoryLogo} alt="Live Story Logo" className={styles.logo} width="150px" />

            {isLSExperience ? (
                <>
                    <Paragraph>
                        A Live Story content experience is linked to this entry. You can see a preview of it below.
                    </Paragraph>

                    <Flex>
                        <Box marginRight="spacingM">
                            <Form onSubmit={unlinkExperience}>
                                <Button
                                    variant="negative"
                                    type="submit"
                                    isDisabled={unlinkLoading}
                                    isLoading={unlinkLoading}
                                >
                                    {unlinkLoading ? 'Unlinking Experience...' : 'Unlink Experience'}
                                </Button>
                            </Form>
                        </Box>
                    </Flex>
                    
                    <div className={styles.experienceEmbed} id={`ls-${entry.fields.id.getValue()}`} data-id={entry.fields.id.getValue()} 
                    data-store="STORE_ID" data-lang={currentLocale()}>
                    </div>
                </>
            ) : (
                <>
                    <Paragraph>The Content ID and Content Type in this entry doesn't look like a Live Story experience</Paragraph>

                    <Box marginTop="spacingL" marginBottom="spacingL" style={{ backgroundColor: tokens.gray100 }}>
                        <code> id: { entry.fields.id.getValue() } </code>
                        <code> type: { entry.fields.type.getValue() } </code>
                    </Box>

                    <Paragraph>
                        If want to link a Live Story experience to this entry, click "Reset Entry" and then enter your
                        published experience id and type.
                    </Paragraph>

                    <Form onSubmit={unlinkExperience}>
                        <Button
                            variant="negative"
                            type="submit"
                            isDisabled={unlinkLoading}
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
        contentIdFieldId: '',
        contentTypeFieldId: ''
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
                    sdk.entry.fields[parameters.contentIdFieldId]?.getValue() &&
                        sdk.entry.fields[parameters.contentTypeFieldId]?.getValue()
                )
            )
        })()
    }, [sdk.entry, parameters.contentIdFieldId, parameters.contentTypeFieldId])

    return (
        <div className={styles.body}>
            {Object.values(parameters).some((value) => value === null || value === undefined || value === '') ? (
                <Note variant="negative">
                    The Live Story app isn't fully configured. Please go to the Live Story app configuration screen to configure
                    it.
                </Note>
            ) : sdk.entry.getSys().contentType.sys.id !== parameters.contentTypeId ? (
                <Note variant="negative">
                    The content type of this entry isn't configured to use the Live Story app. Please go to the Live Story app
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
