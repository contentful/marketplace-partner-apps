import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import {
  Flex,
  Box,
  Paragraph,
  Button,
  Stack,
  Badge,
  Spinner,
  Text,
  TextLink,
  Note,
  Tooltip,
} from '@contentful/f36-components';
import { ExternalLinkIcon, InfoCircleIcon } from '@contentful/f36-icons';
import { createClient } from 'contentful-management';

// eslint-disable-next-line import/extensions
import { get, post, useBackOff } from '../api.js';
import ProgressBar from '../components/ProgressBar';

function Sidebar() {
  const sdk = useSDK();
  const { installationId } = sdk.parameters.installation;
  const [isLoading, setIsLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [reImportLoading, setReImportLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [showSpinner, setShowSpinner] = useState(true);
  const [pending, setPending] = useState(false);
  const [languageStats, setLanguageStats] = useState([]);
  const [organization, setOrganization] = useState('');
  const [resourceSlug, setResourceSlug] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('');
  const [taskStatus, setTaskStatus] = useState('');
  const [taskSyncMessage, setTaskSyncMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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
  sdk.window.startAutoResizer();

  // Check if Transifex token exists for the provided spaceId and environment.
  const fetchLinkedEntry = async () => {
    const entryId = sdk.ids.entry;
    // Get linked entry data
    const url = `${
      import.meta.env.VITE_BACKEND_HOST
    }/api/native-entries/${entryId}`;
    const headers = {
      Accept: 'application/json',
      'X-Contentful-App': sdk.ids.app,
      'X-Contentful-Installation-Id': installationId,
    };

    const req = {
      url,
      method: 'GET',
      headers,
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

    const response = await get(url, req.headers);

    return response;
  };

  const createEvent = async (type) => {
    const { environment, space } = sdk.ids;
    const url = `${import.meta.env.VITE_BACKEND_HOST}/api/native-events`;
    const data = {
      data: {
        type: 'native-events',
        attributes: {
          type,
          environment,
          space_id: space,
          installation_id: installationId,
          entry_id: sdk.ids.entry,
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
      const response = await post(url, JSON.stringify(data), req.headers);
      return response;
    } catch (error) {
      sdk.notifier.error('Something went wrong. Please try later');
      return false;
    }
  };

  // Hook to get linked entry
  const useLinkedEntryData = () => {
    let attempts = 1;
    const {
      data: linkedEntryData,
      refetch,
      error,
    } = useQuery('linkedEntry', () => fetchLinkedEntry(), {
      /* eslint-disable max-len */
      refetchInterval: (entryData) => (entryData?.data?.attributes?.pending ? useBackOff(attempts) : false),
      retry: false,
    });

    attempts += 1;

    return { linkedEntryData, refetch, error };
  };
  const { linkedEntryData, refetch, error } = useLinkedEntryData();

  const handleImportClick = async () => {
    setIsLoading(true);
    setPending(true);
    await createEvent('add_entries');
    await refetch('linkedEntry');
    setIsLoading(false);
  };

  const handleUnlinkClick = async () => {
    setUnlinkLoading(true);
    setPending(true);
    await createEvent('remove_entries');
    setUnlinkLoading(false);
    setPending(false);
    setIsLinked(false);
  };

  const handleReImportClick = async () => {
    setReImportLoading(true);

    try {
      setPending(true);
      await createEvent('remove_entries');
      await createEvent('add_entries');
      await refetch('linkedEntry');
      setReImportLoading(false);
    } catch (exception) {
      setReImportLoading(false);
    }
  };

  // If linked entry found display the data
  useEffect(() => {
    if (
      linkedEntryData
      && linkedEntryData.data.attributes.linked
      && !linkedEntryData.data.attributes.pending
    ) {
      setIsLinked(true);
      setLanguageStats(linkedEntryData.data.attributes.resource_stats);
      if (linkedEntryData.included) {
        const orgParts = linkedEntryData.included[0].attributes.organization_slug.split(':');
        const orgSlug = orgParts[1];
        if (linkedEntryData.included[1]) {
          const { status } = linkedEntryData.included[1].attributes;
          if (status === 'w') {
            setTaskStatus('warning');
          } else if (status === 'f') {
            setTaskStatus('negative');
          } else if (status === 'p') {
            setTaskStatus('primary');
          } else if (status === 'r') {
            setTaskStatus('secondary');
            setTaskSyncMessage('The task will be retried.');
          } else {
            setTaskStatus('positive');
          }
          setTaskSyncMessage(linkedEntryData.included[1].attributes.message);
        }
        setOrganization(orgSlug);
        setProjectSlug(linkedEntryData.included[0].attributes.slug);
        setTargetLanguage(
          Object.keys(
            linkedEntryData.included[0].attributes.target_languages,
          )[0],
        );
      }
      setResourceSlug(linkedEntryData.data.attributes.resource_slug);
    } else if (linkedEntryData && !linkedEntryData.data.attributes.linked) {
      setIsLinked(false);
    }
    if (linkedEntryData) {
      setShowSpinner(false);
      setPending(linkedEntryData.data.attributes.pending);
    }
  }, [linkedEntryData]);

  useEffect(() => {
    if (error) {
      setErrorMessage(
        'An error appears to have arisen during the installation. Please refresh the page. If the issue persists, try uninstalling and then reinstalling the plugin.',
      );
    } else {
      setErrorMessage('');
    }
  }, [error]);

  return (
    <Box>
      {showSpinner || errorMessage ? (
        <Stack flexDirection="column">
          {showSpinner && !errorMessage && (
            <Flex>
              <Text marginRight="spacingXs">Loading</Text>
              <Spinner />
            </Flex>
          )}
          {errorMessage && <Note variant="negative">{errorMessage}</Note>}
        </Stack>
      ) : (
        <>
          <Paragraph>Localize this entry effortlessly with Transifex</Paragraph>
          {!isLinked && !pending && !reImportLoading && (
            <Button
              isFullWidth
              variant="primary"
              onClick={handleImportClick}
              isDisabled={isLoading}
            >
              {isLoading ? 'Syncing...' : 'Link with Transifex'}
            </Button>
          )}
          {pending && (
            <>
              <Paragraph>
                <b>Sync status</b>
              </Paragraph>
              <Flex alignItems="center" justifyContent="space-between">
                <Badge variant="primary">Pending</Badge>
              </Flex>
            </>
          )}
          {isLinked && (
            <>
              {!pending && (
                <>
                  <Paragraph>
                    <b>Sync status</b>
                  </Paragraph>
                  <Flex alignItems="center" justifyContent="space-between">
                    <Flex alignItems="center" justifyContent="flex-start">
                      <Badge variant={taskStatus}>Linked</Badge>
                      {taskSyncMessage && (
                        <Tooltip
                          placement="top"
                          id="tooltip-task-message"
                          content={taskSyncMessage}
                        >
                          <InfoCircleIcon variant="primary" />
                        </Tooltip>
                      )}
                    </Flex>
                    <Flex alignItems="center">
                      <Box marginRight="spacingM">
                        <Button
                          onClick={handleUnlinkClick}
                          variant="negative"
                          isDisabled={unlinkLoading}
                        >
                          {unlinkLoading ? 'Unlink...' : 'Unlink'}
                        </Button>
                      </Box>
                      <Button
                        onClick={handleReImportClick}
                        isDisabled={reImportLoading}
                      >
                        {reImportLoading ? 'Update...' : 'Update'}
                      </Button>
                    </Flex>
                  </Flex>
                </>
              )}
              <Box marginTop="spacingM">
                <Paragraph>
                  <b>Localization progress</b>
                </Paragraph>
                <Box>
                  {languageStats.length > 0
                    && languageStats.map((stats, index) => (
                      <ProgressBar
                        // eslint-disable-next-line react/no-array-index-key
                        key={index}
                        language={stats.language_code}
                        translated={stats.percentage_translated}
                        reviewed={stats.percentage_reviewed}
                        proofread={stats.percentage_proofread}
                      />
                    ))}
                </Box>
              </Box>
              <Box marginTop="spacingM">
                <Paragraph>
                  You can have a better overview of your linked entries and a
                  detailed activity log in Transifex&apos;s standalone
                  Contentful integration.
                </Paragraph>
              </Box>
              <Box>
                <TextLink
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href={`${
                    import.meta.env.VITE_CONTENTFUL_APP_HOST
                  }?transifex_project_id=o:${organization}:p:${projectSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open Transifex-Contentful integration
                </TextLink>
              </Box>
              <Box marginTop="spacingM">
                <Paragraph>
                  Are you a member of the localization team? If yes, you can
                  benefit from all the localization tools Transifex offers.
                </Paragraph>
              </Box>
              <Box>
                <TextLink
                  icon={<ExternalLinkIcon />}
                  alignIcon="end"
                  href={`${
                    import.meta.env.VITE_TXC_HOST
                  }/${organization}/${projectSlug}/translate/#${targetLanguage}/${resourceSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open entry in Transifex Editor
                </TextLink>
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}

export default Sidebar;
