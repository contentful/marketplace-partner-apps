import { ConfigAppSDK } from '@contentful/app-sdk'
import { Box, Checkbox, Flex, Form, FormControl, Heading, Note, Paragraph, Select, TextInput } from '@contentful/f36-components'
import { useSDK } from '@contentful/react-apps-toolkit'
import { css } from '@emotion/css'
import { ContentTypeProps } from 'contentful-management'
import React, { useCallback, useEffect, useState } from 'react'

import cerosLogo from '../assets/ceros-logo.svg'
import { DEFAULT_CONTENT_TYPE, DEFAULT_CONTENT_TYPE_ID, DEFAULT_CONTENT_TYPE_NAME } from '../config'
import styles from '../styles'
import { createDefaultContentType, fetchAllContentTypes, handleError } from '../util'

// Define the type for the app installation parameters
export interface AppInstallationParameters {
    contentTypeId: string
    titleFieldId: string
    urlFieldId: string
    embedCodeFieldId: string
    // `cerosApiKey` is a Secret installation parameter on the App Definition. Reads from the
    // browser (sdk.app.getParameters, sdk.parameters.installation) come back REDACTED — a mask,
    // not the key — so its presence means "a key is stored" and its value means nothing. Only
    // the Contentful Function sees the real value, via context.appInstallationParameters.
    cerosApiKey?: string
}

const ConfigScreen = () => {
    const createDefaultContentTypeValue = 'create-default'

    // Access to the SDK and CMA provided by the @contentful/react-apps-toolkit
    const sdk = useSDK<ConfigAppSDK>()
    const cma = sdk.cma

    // State to store various UI elements
    const [selectedContentType, setSelectedContentType] = useState<ContentTypeProps | null>(null)
    const [assignAsEntryEditor, setAssignAsEntryEditor] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // State to store the app installation parameters
    const [parameters, setParameters] = useState<AppInstallationParameters>({
        contentTypeId: '',
        titleFieldId: '',
        urlFieldId: '',
        embedCodeFieldId: '',
    })

    // The API key is kept out of `parameters` so it can never be saved by accident. What we load
    // back is Contentful's fixed-width mask, not the key — the config screen cannot read the real
    // value at all. `storedApiKey` holds that mask (empty when no key is stored) and `apiKeyInput`
    // holds whatever the user typed this session.
    const [storedApiKey, setStoredApiKey] = useState<string>('')
    const [apiKeyInput, setApiKeyInput] = useState<string>('')
    const hasStoredApiKey = Boolean(storedApiKey)

    // Reads what is actually stored and syncs local state to it.
    const loadParameters = useCallback(async () => {
        const currentParameters = await sdk.app.getParameters()
        const { cerosApiKey, ...rest } = (currentParameters ?? {}) as AppInstallationParameters

        if (currentParameters) {
            setParameters(rest)
        }
        // Presence, not value — the mask is truthy but is not the key.
        setStoredApiKey(cerosApiKey ?? '')
        setApiKeyInput('')
    }, [sdk])

    useEffect(() => {
        ;(async () => {
            await loadParameters()

            sdk.app.setReady()
            console.debug('Ceros app marked as ready.')
        })()
    }, [sdk, loadParameters])

    // Re-read after every save. Without this, "an API key is already saved" keeps reporting the
    // state as of page load and can outlive the key it describes — the hint stays reassuring while
    // the stored key is gone.
    useEffect(() => {
        sdk.app.onConfigurationCompleted((error) => {
            if (!error) {
                loadParameters()
            }
        })
    }, [sdk, loadParameters])

    // State to store content types
    const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([])

    useEffect(() => {
        ;(async () => {
            fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes)
        })()
    }, [cma, sdk.ids.space, sdk.ids.environment])

    // Handles when a user clicks either "Install" or "Save" but before an app is installed or updated
    const onConfigure = useCallback(async () => {
        // Build the saved values locally rather than mutating `parameters` in place, and return a
        // payload assembled field by field. Returning the state object verbatim is what would let
        // a redacted API key be written back over the real one.
        let { contentTypeId, titleFieldId, urlFieldId, embedCodeFieldId } = parameters

        if (contentTypeId === createDefaultContentTypeValue) {
            // Create default content type
            try {
                contentTypeId = await createDefaultContentType(sdk, cma)
                titleFieldId = DEFAULT_CONTENT_TYPE.fields[0].id
                urlFieldId = DEFAULT_CONTENT_TYPE.fields[1].id
                embedCodeFieldId = DEFAULT_CONTENT_TYPE.fields[2].id
                fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes)
            } catch (error) {
                handleError(
                    'An unexpected error was encountered while creating the content type. Please try again.',
                    setErrorMessage,
                    error
                )
                return false
            }
        } else if (!contentTypeId || !titleFieldId || !urlFieldId || !embedCodeFieldId) {
            handleError('All fields must be filled out before saving.', setErrorMessage)
            return false
        } else if (
            titleFieldId === embedCodeFieldId ||
            titleFieldId === urlFieldId ||
            embedCodeFieldId === urlFieldId
        ) {
            handleError('Title field, embed code field, and URL field cannot be the same.', setErrorMessage)
            return false
        }

        var state = await sdk.app.getCurrentState()

        // If the app is being assigned as an entry editor, add it to the state
        if (assignAsEntryEditor) {
            try {
                state = {
                    EditorInterface: {
                        ...state?.EditorInterface,
                        [contentTypeId]: {
                            editors: { position: 0 },
                        },
                    },
                }
            } catch (error) {
                handleError(
                    'An unexpected error was encountered while assigning the entry editor. Please try again.',
                    setErrorMessage,
                    error
                )
                return false
            }
        }

        const savedParameters: AppInstallationParameters = {
            contentTypeId,
            titleFieldId,
            urlFieldId,
            embedCodeFieldId,
        }

        // Send the typed key when there is one. When there isn't, send back the mask we loaded:
        // omitting the property clears the stored secret (verified against a Secret-declared App
        // Definition on 2026-08-31), so "leave it out and it will be preserved" is not available
        // to us. Sending the mask back is the only remaining way to re-save this screen without
        // destroying a key the screen is not permitted to read.
        const typedApiKey = apiKeyInput.trim()
        const apiKeyToSave = typedApiKey || storedApiKey
        if (apiKeyToSave) {
            savedParameters.cerosApiKey = apiKeyToSave
        }

        setErrorMessage(null)
        return {
            parameters: savedParameters,
            targetState: state,
        }
    }, [apiKeyInput, assignAsEntryEditor, cma, parameters, sdk, storedApiKey])

    useEffect(() => {
        sdk.app.onConfigure(() => onConfigure())
    }, [sdk, onConfigure])

    // Whenever content type changes, update some UI elements
    useEffect(() => {
        if (!parameters.contentTypeId) {
            setSelectedContentType(null)
            setAssignAsEntryEditor(false)
            return
        }

        if (parameters.contentTypeId === createDefaultContentTypeValue) {
            setSelectedContentType(null)
            setAssignAsEntryEditor(true)
            return
        }

        // Find the selected content type (given the selected ID)
        const selectedContentType = allContentTypes.find(
            (contentType) => contentType.sys.id === parameters.contentTypeId
        )

        if (allContentTypes.length > 0 && !selectedContentType) {
            handleError('The configured content type cannot be found. Please select a new one.', setErrorMessage)
            return
        }
        setSelectedContentType(selectedContentType || null)

        // Set the assign as entry editor flag as true
        setAssignAsEntryEditor(true)
    }, [parameters.contentTypeId, allContentTypes])

    // Render the configuration screen
    return (
        <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
            {/* If any errors are encountered while saving, they'll show up here. */}
            {errorMessage && (
                <Box marginBottom="spacingXl">
                    <Note variant="negative">{errorMessage}</Note>
                </Box>
            )}

            <img src={cerosLogo} alt="Ceros Logo" className={styles.logo} width="150px" />

            <Box>
                <Heading>Ceros App Config</Heading>
            </Box>

            <Box marginBottom="spacingXl">
                <Paragraph>
                    The Ceros app allows you to easily link a Ceros experience to an entry in Contentful.
                </Paragraph>
                <Paragraph>
                    On this page, you can assign the app to an existing content type or create the default one (called '
                    {DEFAULT_CONTENT_TYPE_NAME}').
                </Paragraph>
            </Box>

            <Box>
                <Form>
                    <FormControl>
                        <FormControl.Label>Content Type</FormControl.Label>
                        <Select
                            value={parameters.contentTypeId}
                            onChange={(e) =>
                                setParameters((p) => ({
                                    ...p,
                                    contentTypeId: e.target.value,
                                    titleFieldId: '',
                                    urlFieldId: '',
                                    embedCodeFieldId: '',
                                }))
                            }
                        >
                            {!allContentTypes && <Select.Option>Loading...</Select.Option>}
                            {allContentTypes && <Select.Option value="">--- Select a content type ---</Select.Option>}

                            {/* If default content type hasn't been created, offer to create it */}
                            {!allContentTypes.some((contentType) => contentType.sys.id === DEFAULT_CONTENT_TYPE_ID) && (
                                <Select.Option value={createDefaultContentTypeValue}>
                                    &gt;&gt;&gt; Create new '{DEFAULT_CONTENT_TYPE_NAME}' content type
                                </Select.Option>
                            )}

                            {/* Render all available content types */}
                            {allContentTypes &&
                                allContentTypes.map((contentType) => (
                                    <Select.Option key={contentType.sys.id} value={contentType.sys.id}>
                                        {contentType.name}
                                    </Select.Option>
                                ))}
                        </Select>
                    </FormControl>

                    <FormControl marginLeft={'spacingL'}>
                        <Checkbox
                            isDisabled={
                                !parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue
                            }
                            isChecked={assignAsEntryEditor}
                            onChange={() => setAssignAsEntryEditor(!assignAsEntryEditor)}
                        >
                            Assign the Ceros app as an entry editor for this content type
                        </Checkbox>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>Title Field</FormControl.Label>
                        <Select
                            isDisabled={
                                !parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue
                            }
                            value={parameters.titleFieldId}
                            onChange={(e) => setParameters((p) => ({ ...p, titleFieldId: e.target.value }))}
                        >
                            <Select.Option value="">--- Select a title field ---</Select.Option>

                            {/* Render all available fields on the selected content type with the specified field type */}
                            {selectedContentType?.fields
                                .filter((field) => field.type === 'Symbol')
                                .map((field) => (
                                    <Select.Option key={field.id} value={field.id}>
                                        {field.name}
                                    </Select.Option>
                                ))}
                        </Select>
                        <FormControl.HelpText>This field needs to be of the type "Symbol".</FormControl.HelpText>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>URL Field</FormControl.Label>
                        <Select
                            isDisabled={
                                !parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue
                            }
                            value={parameters.urlFieldId}
                            onChange={(e) => setParameters((p) => ({ ...p, urlFieldId: e.target.value }))}
                        >
                            <Select.Option value="">--- Select a URL field ---</Select.Option>

                            {/* Render all available fields on the selected content type with the specified field type */}
                            {selectedContentType?.fields
                                .filter((field) => field.type === 'Symbol')
                                .map((field) => (
                                    <Select.Option key={field.id} value={field.id}>
                                        {field.name}
                                    </Select.Option>
                                ))}
                        </Select>
                        <FormControl.HelpText>This field needs to be of the type "Symbol".</FormControl.HelpText>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>Embed Code Field</FormControl.Label>
                        <Select
                            isDisabled={
                                !parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue
                            }
                            value={parameters.embedCodeFieldId}
                            onChange={(e) => setParameters((p) => ({ ...p, embedCodeFieldId: e.target.value }))}
                        >
                            <Select.Option value="">--- Select an embed code field ---</Select.Option>

                            {/* Render all available fields on the selected content type with the specified field type */}
                            {selectedContentType?.fields
                                .filter((field) => field.type === 'Text')
                                .map((field) => (
                                    <Select.Option key={field.id} value={field.id}>
                                        {field.name}
                                    </Select.Option>
                                ))}
                        </Select>
                        <FormControl.HelpText>This field needs to be of the type "Text".</FormControl.HelpText>
                    </FormControl>

                    <FormControl>
                        <FormControl.Label>Ceros API Key</FormControl.Label>
                        <TextInput
                            type="password"
                            name="cerosApiKey"
                            testId="ceros-api-key"
                            value={apiKeyInput}
                            placeholder={
                                hasStoredApiKey
                                    ? 'Leave blank to keep the saved API key'
                                    : 'Enter your Ceros REST API key'
                            }
                            onChange={(e) => setApiKeyInput(e.target.value)}
                        />
                        <FormControl.HelpText>
                            {hasStoredApiKey
                                ? 'An API key is already saved. Leave this blank to keep it, or enter a new key to replace it.'
                                : 'Contact your Ceros account owner to get your REST API key.'}
                        </FormControl.HelpText>
                    </FormControl>
                </Form>
            </Box>
        </Flex>
    )
}

export default ConfigScreen
