import { ApiRequestProps, apiRequest, unsignedApiRequest } from '../helpers/api-request';
import { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { FormControl, Heading, Stack, TextInput } from '@contentful/f36-components';

import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';
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
    const { items = [] } = await sdk.space.getContentTypes({
      order: 'name',
      limit: 1000,
    });
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
      // TODO @nocommit: make this parameter a secret
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
    <Stack flexDirection="column" alignItems="start" margin="spacing2Xl">
      <Heading>Statsig App Configuration</Heading>
      <FormControl>
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
  // noinspection JSDeprecatedSymbols
  const variantContainer = await sdk.space.createContentType({
    sys: {
      id: VARIANT_CONTAINER_ID,
    },
    name: 'Statsig variant container',
    description: 'Statsig variant container',
    displayField: 'entryName',
    fields: [
      {
        id: 'experimentId',
        name: 'Statsig Experiment Id',
        type: 'Symbol',
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
  });
  // noinspection JSDeprecatedSymbols
  await sdk.space.updateContentType(variantContainer);
};

export default ConfigScreen;
