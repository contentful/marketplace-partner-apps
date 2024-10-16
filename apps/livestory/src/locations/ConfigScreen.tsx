import { ConfigAppSDK } from '@contentful/app-sdk'
import { Box, Checkbox, Flex, Form, FormControl, Heading, Note, Paragraph, Select } from '@contentful/f36-components'
import { useCMA, useSDK } from '@contentful/react-apps-toolkit'
import { css } from '@emotion/css'
import { ContentTypeProps } from 'contentful-management'
import React, { useCallback, useEffect, useState } from 'react'

import livestoryLogo from '../assets/livestory-logo.png'
import { DEFAULT_CONTENT_TYPE, DEFAULT_CONTENT_TYPE_ID, DEFAULT_CONTENT_TYPE_NAME } from '../config'
import styles from '../styles'
import { createDefaultContentType, fetchAllContentTypes, handleError } from '../util'

// Define the type for the app installation parameters
export interface AppInstallationParameters {
    contentTypeId: string
    titleFieldId: string
    contentIdFieldId: string
    contentTypeFieldId: string
}

const ConfigScreen = () => {
    const createDefaultContentTypeValue = 'create-default'

    // Access to the SDK and CMA provided by the @contentful/react-apps-toolkit
    const sdk = useSDK<ConfigAppSDK>()
    const cma = useCMA()

    // State to store various UI elements
    const [selectedContentType, setSelectedContentType] = useState<ContentTypeProps | null>(null)
    const [assignAsEntryEditor, setAssignAsEntryEditor] = useState<boolean>(false)
    const [isValidTargetContentType, setIsValidTargetContentType] = useState<boolean>(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    // State to store the app installation parameters
    const [parameters, setParameters] = useState<AppInstallationParameters>({
        contentTypeId: '',
        titleFieldId: '',
        contentIdFieldId: '',
        contentTypeFieldId: ''
    })

    useEffect(() => {
        ;(async () => {
            const currentParameters = await sdk.app.getParameters()
            if (currentParameters) {
                setParameters(currentParameters as AppInstallationParameters)
            }

            sdk.app.setReady()
            console.debug('Live Story app marked as ready.')
        })()
    }, [sdk])

    // State to store content types
    const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([])

    useEffect(() => {
        ;(async () => {
            fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes)
        })()
    }, [cma, sdk.ids.space, sdk.ids.environment])

    useEffect(() => {
        if (!parameters.contentTypeId) return

        const targetContentType = allContentTypes.find((contentType) => contentType.sys.id === parameters.contentTypeId)
        
        if (targetContentType?.fields.some((field) => field.id === 'title' && field.type === 'Symbol') &&
                targetContentType?.fields.some((field) => field.id === 'id' && field.type === 'Symbol') &&
                targetContentType?.fields.some((field) => field.id === 'type' && field.type === 'Symbol')) {

            setIsValidTargetContentType(true)

            setParameters((p) => ({
                ...p,
                titleFieldId: 'title',
                contentIdFieldId: 'id',
                contentTypeFieldId: 'type'
            }))
        }
    }, [parameters.contentTypeId, allContentTypes])

    const onContentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setIsValidTargetContentType(false)

        setParameters((p) => ({
            ...p,
            contentTypeId: e?.target?.value,
            titleFieldId: '',
            contentIdFieldId: '',
            contentTypeFieldId: ''
        }))

        const targetContentType = allContentTypes.find((contentType) => contentType.sys.id === e.target.value)
        
        if (targetContentType?.fields.some((field) => field.id === 'title' && field.type === 'Symbol') &&
                targetContentType?.fields.some((field) => field.id === 'id' && field.type === 'Symbol') &&
                targetContentType?.fields.some((field) => field.id === 'type' && field.type === 'Symbol')) {

            setIsValidTargetContentType(true)

            setParameters((p) => ({
                ...p,
                titleFieldId: 'title',
                contentIdFieldId: 'id',
                contentTypeFieldId: 'type'
            }))
        }
    }

    // Handles when a user clicks either "Install" or "Save" but before an app is installed or updated
    const onConfigure = useCallback(async () => {
        if (parameters.contentTypeId === createDefaultContentTypeValue) {
            // Create default content type
            try {
                parameters.contentTypeId = await createDefaultContentType(sdk, cma)
                parameters.titleFieldId = DEFAULT_CONTENT_TYPE.fields[0].id
                parameters.contentIdFieldId = DEFAULT_CONTENT_TYPE.fields[3].id
                parameters.contentTypeFieldId = DEFAULT_CONTENT_TYPE.fields[4].id
                fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes)
            } catch (error) {
                handleError(
                    'An unexpected error was encountered while creating the content type. Please try again.',
                    setErrorMessage,
                    error
                )
                return false
            }
        } else if (
            !parameters.contentTypeId ||
            !isValidTargetContentType ||
            !parameters.contentIdFieldId ||
            !parameters.contentTypeFieldId
        ) {
            handleError('Select a valid content type before saving.', setErrorMessage)
            return false
        } 
        else if (
            parameters.titleFieldId === parameters.contentIdFieldId ||
            parameters.titleFieldId === parameters.contentTypeFieldId ||
            parameters.contentIdFieldId === parameters.contentTypeFieldId
        ) {
            handleError('Title field, content id field, and content type field cannot be the same.', setErrorMessage)
            return false
        }

        var state = await sdk.app.getCurrentState()

        // If the app is being assigned as an entry editor, add it to the state
        if (assignAsEntryEditor) {
            try {
                state = {
                    EditorInterface: {
                        ...state?.EditorInterface,
                        [parameters.contentTypeId]: {
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

        setErrorMessage(null)
        return {
            parameters: parameters,
            targetState: state,
        }
    }, [assignAsEntryEditor, cma, parameters, sdk, isValidTargetContentType])

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

            <img src={livestoryLogo} alt="Live Story Logo" className={styles.logo} width="150px" />

            <Box>
                <Heading>Live Story App Config</Heading>
            </Box>

            <Box marginBottom="spacingXl">
                <Paragraph>
                    The Live Story app allows you to easily link a Live Story experience to an entry in Contentful and preview it.
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
                            onChange={(e) => onContentTypeChange(e)
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

                        { selectedContentType && !isValidTargetContentType && (
                            <FormControl.ValidationMessage>
                                Selected Content Type doesn't appear to be a valid Live Story content type. Content ID (id) and Content Type (type) 
                                are not present in selected content type fields.
                            </FormControl.ValidationMessage>
                        )}
                    </FormControl>

                    <FormControl marginLeft={'spacingL'}>
                        <Checkbox
                            isDisabled={
                                !parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue
                            }
                            isChecked={assignAsEntryEditor}
                            onChange={() => setAssignAsEntryEditor(!assignAsEntryEditor)}
                        >
                            Assign the Live Story app as an entry editor for this content type
                        </Checkbox>
                    </FormControl>
                </Form>
            </Box>
        </Flex>
    )
}

export default ConfigScreen
