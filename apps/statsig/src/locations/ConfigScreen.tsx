import { ApiRequestProps, apiRequest, unsignedApiRequest } from '../helpers/api-request';
import { Box, FormControl, Heading, Stack, Text, TextInput } from '@contentful/f36-components';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';

import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
import { ExternalStatsigLink } from '../components/ExternalStatsigLink';
import { VARIANT_CONTAINER_ID } from '../constants';
import { useSDK } from '@contentful/react-apps-toolkit';

interface AppInstallationParameters {
  statsigConsoleApiKey?: string;
  statsigProjectId?: string;
}

type ProjectData = {
  id: string;
};

const ConfigScreen = () => {
  const [, setParameters] = useState<AppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const [apiKey, setApiKey] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState<string>('');
  const validateApiKey = useCallback((value: string) => {
    if (!value.trim()) {
      setApiKeyErrorMessage('Required');
    } else {
      setApiKeyErrorMessage('');
    }
  }, []);

  const makeStatsigApiRequest = useCallback(async (_apiKey: string) => {
    const apiKey = _apiKey.trim();
    if (apiKey && !apiKey.startsWith('*')) {
      const requestProps: ApiRequestProps = {
        method: 'GET',
        endpoint: '/console/v1/project',
        headers: {},
      };
      try {
        const projectData = await unsignedApiRequest<ProjectData>(apiKey, requestProps);
        setApiKeyErrorMessage('');
        setProjectId(projectData.id);
      } catch (_err: any) {
        setApiKeyErrorMessage('Unknown API Key');
      }
    }
  }, []);

  const onConfigure = useCallback(async () => {
    const { items = [] } = await sdk.cma.contentType.getMany({});
    const allContentTypes = items as ContentTypeProps[];
    const variantContainerContentType = allContentTypes.find(
      (ct: ContentTypeProps) => ct.sys.id === VARIANT_CONTAINER_ID,
    );
    if (!variantContainerContentType) {
      await createVariantContainerContentType(sdk);
    }

    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    const currentState = await sdk.app.getCurrentState();

    return {
      parameters: {
        statsigConsoleApiKey: apiKey,
        statsigProjectId: projectId,
      },
      targetState: {
        EditorInterface: {
          ...currentState?.EditorInterface,
          [VARIANT_CONTAINER_ID]: {
            editors: { position: 0, settings: {} },
          },
        },
      },
    };
  }, [apiKey, projectId, sdk]);

  const onConfigurationCompleted = useCallback(async () => {
    if (apiKey && !apiKey.startsWith('*')) {
      const requestProps: ApiRequestProps = {
        method: 'POST',
        endpoint: '/contentful/v1/connect',
        headers: {
          'statsig-api-key': apiKey,
        },
        body: {},
      };
      try {
        await apiRequest<ProjectData>(sdk, requestProps);
      } catch(e) {
        // TODO notify with error
      }
    }
  }, [apiKey, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted(() => onConfigurationCompleted());
  }, [sdk, onConfigure, onConfigurationCompleted]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      const apiKey = currentParameters?.statsigConsoleApiKey || '';
      makeStatsigApiRequest(apiKey);
      setApiKey(apiKey);
      
      sdk.app.setReady();
    })();
  }, [makeStatsigApiRequest, sdk.app]);
  
  const handleApiKeyChanged = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const { value } = e.target;
      setApiKey(value);
      validateApiKey(value);
    },
    [validateApiKey],
  );
  
  const handleApiKeyBlurred = useCallback(() => {
    if (!apiKeyErrorMessage) {
      makeStatsigApiRequest(apiKey);
    }
  }, [apiKey, apiKeyErrorMessage, makeStatsigApiRequest]);

  return (
    <Stack flexDirection="column" alignItems="start" margin="spacing2Xl" style={{width: '700px'}}>
      <Heading>Statsig App Configuration</Heading>
      <Text>
        The Statsig app provides a new Content Type (Statsig variant container) that allows
        for automatic creation of experiments with different treaments directly in Statsig.
        Results for these experiments can be found in the link under the Statsig tab of the
        respective Statsig variant container.
      </Text>
      <Box style={{width: '100%'}}>
        <ExternalStatsigLink
          variant='neutral'
          url='https://docs.statsig.com/guides/contentful'
          linkLabel='Go to Statsig Docs'
        >
          Learn more about how to setup and use this app by heading to the link below.
        </ExternalStatsigLink>
      </Box>
      <FormControl style={{width: '100%'}}>
        <FormControl.Label isRequired>Statsig Console API Key</FormControl.Label>
        <TextInput
          data-testid="api-key"
          value={apiKey}
          onChange={handleApiKeyChanged}
          onBlur={handleApiKeyBlurred}
          isRequired={true}
          isInvalid={!!apiKeyErrorMessage}
        />
        {!!apiKeyErrorMessage && (
          <FormControl.ValidationMessage>{apiKeyErrorMessage}</FormControl.ValidationMessage>
        )}
      </FormControl>
    </Stack>
  );
};


const createVariantContainerContentType = async (sdk: ConfigAppSDK) => {
  const variantContainer = await sdk.cma.contentType.createWithId(
    {
      contentTypeId: VARIANT_CONTAINER_ID,
    },
    {
      name: 'Statsig variant container',
      description: 'Statsig variant container',
      displayField: 'entryName',
      fields: [
        {
          id: 'experimentId',
          name: 'Statsig Experiment Id',
          type: 'Symbol',
          disabled: true,
          required: false,
          localized: false,
          omitted: true,
        },
        {
          id: 'entryName',
          name: 'Entry Name',
          type: 'Symbol',
          required: true,
          localized: false,
        },
        {
          id: 'controlVariation',
          name: 'Default Variation (control)',
          type: 'Link',
          localized: false,
          required: true,
          validations: [],
          disabled: false,
          omitted: false,
          linkType: 'Entry',
        },
        {
          id: 'treatmentVariations',
          name: 'Treatment Variations',
          type: 'Array',
          localized: false,
          required: true,
          validations: [{ size: { min: 1, max: 10 } }],
          disabled: false,
          omitted: false,
          items: {
            type: 'Link',
            linkType: 'Entry',
          },
        },
      ],
    },
  );
  await sdk.cma.contentType.publish({contentTypeId: VARIANT_CONTAINER_ID}, variantContainer);
};

export default ConfigScreen;
