import { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Checkbox, Flex, Form, FormControl, Heading, Note, Paragraph, Select } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import { ContentTypeProps } from 'contentful-management';
import React, { useCallback, useEffect, useState } from 'react';

import cerosLogo from '../assets/ceros-logo.svg';
import { DEFAULT_CONTENT_TYPE, DEFAULT_CONTENT_TYPE_ID, DEFAULT_CONTENT_TYPE_NAME } from '../config';
import styles from '../styles';
import { createDefaultContentType, fetchAllContentTypes, handleError } from '../util';

// Define the type for the app installation parameters
export interface AppInstallationParameters {
  contentTypeId: string;
  titleFieldId: string;
  urlFieldId: string;
  embedCodeFieldId: string;
}

const ConfigScreen = () => {
  const createDefaultContentTypeValue = 'create-default';

  // Access to the SDK and CMA provided by the @contentful/react-apps-toolkit
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  // State to store various UI elements
  const [selectedContentType, setSelectedContentType] = useState<ContentTypeProps | null>(null);
  const [assignAsEntryEditor, setAssignAsEntryEditor] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State to store the app installation parameters
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    contentTypeId: '',
    titleFieldId: '',
    urlFieldId: '',
    embedCodeFieldId: '',
  });

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) {
        setParameters(currentParameters as AppInstallationParameters);
      }

      sdk.app.setReady();
      console.debug('Ceros app marked as ready.');
    })();
  }, [sdk]);

  // State to store content types
  const [allContentTypes, setAllContentTypes] = useState<ContentTypeProps[]>([]);

  useEffect(() => {
    (async () => {
      fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes);
    })();
  }, [cma, sdk.ids.space, sdk.ids.environment]);

  // Handles when a user clicks either "Install" or "Save" but before an app is installed or updated
  const onConfigure = useCallback(async () => {
    if (parameters.contentTypeId === createDefaultContentTypeValue) {
      // Create default content type
      try {
        parameters.contentTypeId = await createDefaultContentType(sdk, cma);
        parameters.titleFieldId = DEFAULT_CONTENT_TYPE.fields[0].id;
        parameters.urlFieldId = DEFAULT_CONTENT_TYPE.fields[1].id;
        parameters.embedCodeFieldId = DEFAULT_CONTENT_TYPE.fields[2].id;
        fetchAllContentTypes(cma, sdk.ids.space, sdk.ids.environment, setAllContentTypes);
      } catch (error) {
        handleError('An unexpected error was encountered while creating the content type. Please try again.', setErrorMessage, error);
        return false;
      }
    } else if (!parameters.contentTypeId || !parameters.titleFieldId || !parameters.urlFieldId || !parameters.embedCodeFieldId) {
      handleError('All fields must be filled out before saving.', setErrorMessage);
      return false;
    } else if (
      parameters.titleFieldId === parameters.embedCodeFieldId ||
      parameters.titleFieldId === parameters.urlFieldId ||
      parameters.embedCodeFieldId === parameters.urlFieldId
    ) {
      handleError('Title field, embed code field, and URL field cannot be the same.', setErrorMessage);
      return false;
    }

    var state = await sdk.app.getCurrentState();

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
        };
      } catch (error) {
        handleError('An unexpected error was encountered while assigning the entry editor. Please try again.', setErrorMessage, error);
        return false;
      }
    }

    setErrorMessage(null);
    return {
      parameters: parameters,
      targetState: state,
    };
  }, [assignAsEntryEditor, cma, parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  // Whenever content type changes, update some UI elements
  useEffect(() => {
    if (!parameters.contentTypeId) {
      setSelectedContentType(null);
      setAssignAsEntryEditor(false);
      return;
    }

    if (parameters.contentTypeId === createDefaultContentTypeValue) {
      setSelectedContentType(null);
      setAssignAsEntryEditor(true);
      return;
    }

    // Find the selected content type (given the selected ID)
    const selectedContentType = allContentTypes.find((contentType) => contentType.sys.id === parameters.contentTypeId);

    if (allContentTypes.length > 0 && !selectedContentType) {
      handleError('The configured content type cannot be found. Please select a new one.', setErrorMessage);
      return;
    }
    setSelectedContentType(selectedContentType || null);

    // Set the assign as entry editor flag as true
    setAssignAsEntryEditor(true);
  }, [parameters.contentTypeId, allContentTypes]);

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
        <Paragraph>The Ceros app allows you to easily link a Ceros experience to an entry in Contentful.</Paragraph>
        <Paragraph>
          On this page, you can assign the app to an existing content type or create the default one (called '{DEFAULT_CONTENT_TYPE_NAME}').
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
              }>
              {!allContentTypes && <Select.Option>Loading...</Select.Option>}
              {allContentTypes && <Select.Option value="">--- Select a content type ---</Select.Option>}

              {/* If default content type hasn't been created, offer to create it */}
              {!allContentTypes.some((contentType) => contentType.sys.id === DEFAULT_CONTENT_TYPE_ID) && (
                <Select.Option value={createDefaultContentTypeValue}>&gt;&gt;&gt; Create new '{DEFAULT_CONTENT_TYPE_NAME}' content type</Select.Option>
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
              isDisabled={!parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue}
              isChecked={assignAsEntryEditor}
              onChange={() => setAssignAsEntryEditor(!assignAsEntryEditor)}>
              Assign the Ceros app as an entry editor for this content type
            </Checkbox>
          </FormControl>

          <FormControl>
            <FormControl.Label>Title Field</FormControl.Label>
            <Select
              isDisabled={!parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue}
              value={parameters.titleFieldId}
              onChange={(e) => setParameters((p) => ({ ...p, titleFieldId: e.target.value }))}>
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
              isDisabled={!parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue}
              value={parameters.urlFieldId}
              onChange={(e) => setParameters((p) => ({ ...p, urlFieldId: e.target.value }))}>
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
              isDisabled={!parameters.contentTypeId || parameters.contentTypeId === createDefaultContentTypeValue}
              value={parameters.embedCodeFieldId}
              onChange={(e) => setParameters((p) => ({ ...p, embedCodeFieldId: e.target.value }))}>
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
        </Form>
      </Box>
    </Flex>
  );
};

export default ConfigScreen;
