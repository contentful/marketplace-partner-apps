import React, { useCallback, useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  Flex,
  Box,
  Form,
  Heading,
  Paragraph,
  Button,
  Note,
  Stack,
  Checkbox,
  Badge,
  Radio,
  SectionHeading,
  Spinner,
  Text,
  TextLink,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { createClient } from 'contentful-management';
import { ExternalLinkIcon } from '@contentful/f36-icons';

/* eslint-disable import/extensions */
import {
  get, post, deleteMethod, useBackOff,
} from '../api.js';

import logo from '../assets/img/logo.png';

// Hook to fetch content types using the contentful SDK
const useContentTypes = (sdk) => {
  const { data } = useQuery('contentTypes', async () => {
    const contentTypesResponse = await sdk.cma.contentType.getMany({});
    return contentTypesResponse.items;
  });

  return { contentTypes: data };
};

// Hook to fetch locales  using the contentful SDK.
const useLocales = (sdk) => {
  const { data } = useQuery('locales', async () => {
    const localesResponse = await sdk.cma.locale.getMany({});
    return localesResponse.items;
  });

  return { locales: data };
};

// Check if Transifex token exists for the provided spaceId and environment.
const fetchIdentity = async ({ space, environment, app }) => {
  const queryParams = {
    'filter[space_id]': space,
    'filter[environment]': environment,
  };
  const headers = {
    Accept: 'application/json',
    'X-Contentful-app': app,
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const urlWithQueryParams = `${
    import.meta.env.VITE_BACKEND_HOST
  }/api/native-identities/me?${queryString}`;
  const response = await get(urlWithQueryParams, headers);

  return response;
};

// Remove installation
const removeInstallation = async ({ space, environment, app }) => {
  const queryParams = {
    'filter[space_id]': space,
    'filter[environment]': environment,
  };
  const headers = {
    Accept: 'application/json',
    'X-Contentful-app': app,
  };

  const queryString = new URLSearchParams(queryParams).toString();
  const urlWithQueryParams = `${
    import.meta.env.VITE_BACKEND_HOST
  }/api/native-identities/me?${queryString}`;
  const response = await deleteMethod(urlWithQueryParams, headers);

  return response;
};

function ConfigScreen() {
  const sdk = useSDK();

  const [parameters, setParameters] = useState({});
  const { contentTypes } = useContentTypes(sdk);
  const { locales } = useLocales(sdk);
  const [isLoading, setLoading] = useState(false);
  const [resetProjectLoading, setResetProjectLoading] = useState(false);
  const [isDisabled, setDisabled] = useState(false);
  const [isTokenExists, setTokenExists] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectSourceLanguage, setProjectSourceLanguage] = useState('');
  const [projectTargetLanguages, setProjectTargetLanguages] = useState([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);
  const [selectAllChecked, setSelectAllChecked] = useState(false);
  const [defaultLocaleDoesNotMatch, setDefaultLocaleDoesNotMatch] = useState(false);
  const [installationId, setInstallationId] = useState('');
  const [appIsInstalled, setAppIsInstalled] = useState('');
  const [pushTrigger, setPushTrigger] = useState('t');
  const [pullContent, setPullContent] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [projectAlreadyConnected, setProjectAlreadyConnected] = useState(false);
  const [projectType, setProjectType] = useState('');
  const [enableFetchInterval, setEnableFetchInterval] = useState(false);
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    },
  );
  const { environment, space, app } = sdk.ids;

  // Hook to get connected project's data
  const useConnectedProjectData = ({
    space: sp,
    environment: env,
    app: application,
  }) => {
    let attempts = 1;
    const { data: tokenData, refetch } = useQuery(
      'transifexToken',
      () => fetchIdentity({ space: sp, environment: env, app: application }),
      {
        // eslint-disable-next-line max-len
        refetchInterval:
          enableFetchInterval
          && ((projectData) => (projectData?.data?.attributes?.installation_id
            ? false
            : useBackOff(attempts))),
        retry: false,
        enabled: true,
      },
    );
    attempts += 1;

    return { tokenData, refetch };
  };
  const { tokenData, refetch } = useConnectedProjectData({
    space,
    environment,
    app,
  });

  /**
   * Initiates the connection to Transifex.
   * This function sets loading and disabled states
   * invalidates the 'transifexToken' query,
   * and opens a new window with Transifex URL.
   */
  const onConnectTransifex = async () => {
    setLoading(true);
    setDisabled(true);
    setEnableFetchInterval(true);

    // Enable the query to start fetching
    refetch('transifexToken');
    window.open(
      `${
        import.meta.env.VITE_CONTENTFUL_APP_HOST
      }?app=contentful_native_app&space_id=${space}&environment=${environment}`,
      '_blank',
    );
  };

  const onResetSelectedProject = async () => {
    setResetProjectLoading(true);
    setDisabled(true);
    try {
      await removeInstallation({ space, environment, app });
    } catch (e) {
      sdk.notifier.error('Something went wrong, please try later!');
    }
    setResetProjectLoading(false);
    setDisabled(false);
    window.location.reload();
  };

  // Function to handle selecting all checkboxes
  const handleSelectAllContentTypes = () => {
    const allSelected = selectedContentTypes.length === contentTypes.length;
    if (allSelected) {
      setSelectedContentTypes([]);
      setSelectAllChecked(false);
    } else {
      const allContentTypeIds = contentTypes.map(
        (contentType) => contentType.sys.id,
      );
      setSelectedContentTypes(allContentTypeIds);
      setSelectAllChecked(true);
    }
  };

  // Function to handle individual content type change
  const handleContentTypeChange = (id) => {
    setSelectedContentTypes((prevSelected) => {
      const isSelected = prevSelected.includes(id);
      let updatedSelection = [];

      if (isSelected) {
        updatedSelection = prevSelected.filter((item) => item !== id);
        setSelectAllChecked(false);
      } else {
        updatedSelection = [...prevSelected, id];

        const allContentTypeIds = contentTypes.map(
          (contentType) => contentType.sys.id,
        );
        const allSelected = updatedSelection.length === allContentTypeIds.length;
        setSelectAllChecked(allSelected);
      }

      return updatedSelection;
    });
  };

  // Function to handle pull content change
  const handlePullContentCheckboxChange = (event) => {
    const { checked } = event.target;
    setPullContent(checked);
  };

  // If token found display the connected project data
  useEffect(() => {
    if (tokenData && tokenData.included && tokenData.included[0]) {
      setLoading(false);
      setDisabled(false);
      setTokenExists(true);
      setProjectName(tokenData.included[0].attributes.name);
      const targetLanguages = tokenData.included[0].attributes.target_languages;
      const formattedTargetLanguagesArray = Object.entries(targetLanguages).map(
        ([key, value]) => `${value}(${key})`,
      );
      setProjectTargetLanguages(formattedTargetLanguagesArray);
      const sourceLanguage = tokenData.included[0].attributes.source_language;
      const key = Object.keys(sourceLanguage)[0];
      const value = sourceLanguage[key];
      const formattedSourceLanguage = `${value}(${key})`;
      setProjectSourceLanguage(formattedSourceLanguage);
      setInstallationId(tokenData.data.attributes.installation_id);
      setProjectAlreadyConnected(
        tokenData.data.attributes.is_project_connected,
      );
      if (locales && locales.length > 0) {
        const defaultLocale = locales.filter(
          (locale) => locale.default === true,
        )[0];
        if (defaultLocale.code.replace(/-/g, '_') !== key) {
          setDefaultLocaleDoesNotMatch(true);
        } else {
          setDefaultLocaleDoesNotMatch(false);
        }
      }
      setProjectType(tokenData.included[0].attributes.project_type);
    }
    if (tokenData && tokenData.included && tokenData.included[1]) {
      setPushTrigger(tokenData.included[1].attributes.push_trigger);
      setPullContent(
        tokenData.included[1].attributes.fetch_initial_translations,
      );
    }
  }, [tokenData]);

  // Callback triggered when user clicks install button
  const onConfigure = useCallback(async () => {
    if (environment !== 'master') {
      sdk.notifier.error(
        'The Transifex app supports only the master environment.',
      );
      return false;
    }

    if (installationId === '') {
      sdk.notifier.error('An active Transifex account is required.');
      return false;
    }

    if (defaultLocaleDoesNotMatch) {
      sdk.notifier.error(
        "This space's default locale should match Transifex project's source language.",
      );
      return false;
    }

    if (projectAlreadyConnected) {
      sdk.notifier.error(
        'The selected project is connected already with another space. Please select another project.',
      );
      return false;
    }

    if (projectType !== 'file') {
      sdk.notifier.error(
        'Contentful integration only supports file projects. Please select another project.',
      );
      return false;
    }

    const installed = await sdk.app.isInstalled();
    if (installed) {
      const currentState = await sdk.app.getCurrentState();
      const currentParameters = await sdk.app.getParameters();
      return {
        parameters: currentParameters,
        targetState: currentState,
      };
    }

    const generatedObject = {};
    selectedContentTypes.forEach((contentType) => {
      generatedObject[contentType] = { sidebar: { position: 1 } };
    });

    return {
      parameters: {
        installationId,
      },
      targetState: {
        EditorInterface: generatedObject,
      },
    };
  }, [parameters, sdk, selectedContentTypes, installationId]);

  // Callback triggered after app is installed successfully
  // eslint-disable-next-line consistent-return
  const onConfigurationCompleted = useCallback(async () => {
    const currentParameters = await sdk.app.getParameters();
    setParameters(currentParameters);

    // Create connection
    const url = `${import.meta.env.VITE_BACKEND_HOST}/api/native-connections`;
    const data = {
      data: {
        type: 'native-connections',
        attributes: {
          fetch_initial_translations: pullContent,
          push_trigger: pushTrigger.charAt(0),
          environment,
          space_id: space,
          installation_id: currentParameters.installationId,
        },
      },
    };
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Contentful-App': sdk.ids.app,
    };

    const req = {
      url,
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    };
    // Get and apply the signed headers
    const { additionalHeaders } = await cma.appSignedRequest.create(
      {
        appDefinitionId: sdk.ids.app,
      },
      {
        method: req.method,
        headers: req.headers,
        body: req.body,
        path: new URL(req.url).pathname,
      },
    );
    Object.assign(req.headers, additionalHeaders);
    try {
      await post(url, JSON.stringify(data), req.headers);
      setAppIsInstalled(true);
    } catch (error) {
      sdk.notifier.error(
        'Something went wrong. Please try to uninstall and install app again',
      );
      return false;
    }
  }, [parameters, sdk, pullContent, pushTrigger]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure, selectedContentTypes, installationId]);

  useEffect(() => {
    sdk.app.onConfigurationCompleted(() => onConfigurationCompleted());
  }, [
    sdk,
    onConfigure,
    selectedContentTypes,
    installationId,
    pullContent,
    pushTrigger,
  ]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    async function checkAppIsInstalled() {
      setShowSpinner(true);
      try {
        const installed = await sdk.app.isInstalled();
        if (installed && !isTokenExists) {
          await refetch('transifexToken');
          setAppIsInstalled(true);
        }
      } finally {
        setShowSpinner(false);
      }
    }
    checkAppIsInstalled();
  }, [sdk]);

  return (
    <div className="app-background">
      <Flex
        flexDirection="row"
        gap="spacingS"
        justifyContent="center"
        alignItems="center"
      >
        <Form>
          <Box marginTop="spacingM" padding="spacingM">
            {showSpinner ? (
              <Stack flexDirection="column">
                <Flex>
                  <Text marginRight="spacingXs" fontColor="colorWhite">
                    Loading
                  </Text>
                  <Spinner variant="white" />
                </Flex>
              </Stack>
            ) : (
              <div className="configuration-screen">
                {!isTokenExists ? (
                  <div>
                    <div>
                      <Heading>About Transifex</Heading>
                      <Paragraph>
                        The Transifex app allows you to send content directly to
                        Transifex for translation and view the translation
                        status without leaving Contentful. Use this app so that
                        your localization team can leverage most of
                        Transifex&apos;s services while translating your
                        Contentful space.
                      </Paragraph>
                      <Box>
                        <TextLink
                          icon={<ExternalLinkIcon />}
                          alignIcon="end"
                          href="https://app.transifex.com/signup/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Create your Transifex account
                        </TextLink>
                      </Box>
                      <Box
                        style={{
                          marginTop: '10px',
                          marginBottom: '10px',
                        }}
                      >
                        <Note>
                          The Transifex app supports only the master
                          environment.
                        </Note>
                      </Box>
                      <Flex
                        flexDirection="column"
                        gap="spacingS"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Box
                          style={{
                            marginTop: '40px',
                            marginBottom: '20px',
                          }}
                        >
                          <Button
                            variant="primary"
                            size="medium"
                            onClick={onConnectTransifex}
                            isLoading={isLoading}
                            isDisabled={isDisabled}
                          >
                            {isLoading
                              ? 'Connecting...'
                              : 'Connect with Transifex'}
                          </Button>
                        </Box>
                      </Flex>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div>
                      {appIsInstalled && (
                        <Box marginBottom="spacingM">
                          <Note>
                            You have installed Transifex app successfully. To
                            link another Transifex project, you should uninstall
                            and reinstall the app.
                          </Note>
                        </Box>
                      )}
                      {projectAlreadyConnected && (
                        <Box marginTop="spacingM" marginBottom="spacingM">
                          <Note variant="negative">
                            The selected project is connected already with
                            another space. Please select another project.
                          </Note>
                        </Box>
                      )}
                      {projectType !== 'file' && (
                        <Box marginTop="spacingM" marginBottom="spacingM">
                          <Note variant="negative">
                            Contentful integration only supports file projects.
                            Please select another project
                          </Note>
                        </Box>
                      )}
                      {defaultLocaleDoesNotMatch && (
                        <Box marginTop="spacingM" marginBottom="spacingM">
                          <Note variant="negative">
                            This space&apos;s default locale should match
                            Transifex project&apos;s source language
                          </Note>
                        </Box>
                      )}
                      <Heading>Connected Transifex Project</Heading>
                      <Paragraph>
                        Project name:&nbsp;
                        <b>{projectName}</b>
                      </Paragraph>
                      <Paragraph>
                        Source language:&nbsp;
                        <b>{projectSourceLanguage}</b>
                      </Paragraph>
                      <Paragraph>Target languages:&nbsp;</Paragraph>
                      <Box marginTop="spacingM">
                        <Stack>
                          {projectTargetLanguages.length > 0
                            && projectTargetLanguages.map((targetLanguage) => (
                              <Badge variant="secondary" key={targetLanguage}>
                                {targetLanguage}
                              </Badge>
                            ))}
                        </Stack>
                      </Box>
                      {!appIsInstalled && (
                        <Box marginTop="spacingM">
                          <Button
                            variant="negative"
                            size="medium"
                            onClick={onResetSelectedProject}
                            isLoading={resetProjectLoading}
                            isDisabled={isDisabled}
                          >
                            {resetProjectLoading
                              ? 'Reset selected project...'
                              : 'Reset selected project'}
                          </Button>
                        </Box>
                      )}

                      <hr className="splitter" />
                      <Box marginTop="spacingL">
                        <Heading>Content Synchronization options</Heading>
                        <SectionHeading>
                          <b>PUSH CONTENT</b>
                        </SectionHeading>
                        <Checkbox
                          isChecked={pullContent}
                          onChange={handlePullContentCheckboxChange}
                          name="fetch_initial_translations"
                        >
                          Push Initial Translations to Transifex
                        </Checkbox>
                      </Box>

                      <Box marginTop="spacingL">
                        <SectionHeading>PULL CONTENT</SectionHeading>
                        Transifex will update Contentful content per language
                        <Box marginTop="spacingS">
                          <Radio.Group
                            name="permission"
                            value={pushTrigger}
                            onChange={(e) => {
                              setPushTrigger(e.target.value);
                            }}
                          >
                            <Radio value="t">100% Translated</Radio>
                            <Radio value="r">100% Reviewed</Radio>
                            <Radio value="p">100% Proofread</Radio>
                          </Radio.Group>
                        </Box>
                      </Box>
                      {!appIsInstalled
                        && contentTypes.length > 0
                        && contentTypes && (
                          <>
                            <hr className="splitter" />
                            <Box marginTop="spacingM">
                              <Heading>Assign app to content models</Heading>
                              <Paragraph>
                                Select which content models to link with
                                Transifex.
                              </Paragraph>
                              <Flex flexDirection="column">
                                {contentTypes && contentTypes.length > 0 && (
                                  <Checkbox
                                    isChecked={selectAllChecked}
                                    onChange={handleSelectAllContentTypes}
                                    name="select-all-content-types"
                                  >
                                    Select All
                                  </Checkbox>
                                )}
                                {contentTypes
                                  && contentTypes.length > 0
                                  && contentTypes.map((contentType, index) => (
                                    <Checkbox
                                      key={contentType.sys.id}
                                      id={index}
                                      isChecked={selectedContentTypes.includes(
                                        contentType.sys.id,
                                      )}
                                      onChange={() => handleContentTypeChange(
                                        contentType.sys.id,
                                      )}
                                      name={`content-type-${contentType.name}`}
                                    >
                                      {contentType.name}
                                    </Checkbox>
                                  ))}
                              </Flex>
                            </Box>
                          </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Box>
          {!showSpinner && (
            <Flex
              flexDirection="column"
              gap="spacingS"
              justifyContent="center"
              alignItems="center"
            >
              <Box
                style={{
                  marginTop: '130px',
                  height: '50px',
                  width: '100px',
                }}
              >
                <img src={logo} alt="Transifex logo" />
              </Box>
            </Flex>
          )}
        </Form>
      </Flex>
    </div>
  );
}

export default ConfigScreen;
