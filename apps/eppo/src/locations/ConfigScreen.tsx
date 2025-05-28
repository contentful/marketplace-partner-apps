import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { ConfigAppSDK } from '@contentful/app-sdk';
import {
  Form,
  FormControl,
  Heading,
  Notification,
  Stack,
  TextInput,
} from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';

import {
  CONFIG_FORM_API_KEY_LABEL,
  CONFIG_FORM_DEFAULT_ASSIGNMENT_LABEL,
  CONFIG_FORM_DEFAULT_ENTITY_LABEL,
  VARIATION_CONTAINER_ID,
} from '../constants';
import { getApiBaseUrl } from '../helpers/get-api-base-url';
import { apiRequest, ApiRequestProps, unsignedApiRequest } from '../helpers/api-request';
import { Dropdown } from '../components/Dropdown';
import { HttpError } from '../helpers/http-error';

interface IAppInstallationParameters {
  eppoApiKey?: string;
  defaultEntityId?: number;
  defaultAssignmentSourceId?: number;
}

type Option = {
  id: number;
  name: string;
};

export type ConfigOptionsDto = {
  entities: Option[];
  assignmentSourcesByEntityId: Record<number, Option[]>;
};

const ConfigScreen = () => {
  const [, setParameters] = useState<IAppInstallationParameters>({});
  const sdk = useSDK<ConfigAppSDK>();

  const [isLoadingOptions, setIsLoadingOptions] = useState(false);

  const [apiKey, setApiKey] = useState<string>('');
  const [apiKeyErrorMessage, setApiKeyErrorMessage] = useState<string>('');
  const validateApiKey = useCallback((value: string) => {
    if (!value.trim()) {
      setApiKeyErrorMessage('Required');
    } else {
      setApiKeyErrorMessage('');
    }
  }, []);

  const [defaultEntityId, setDefaultEntityId] = useState<number | undefined>(
    sdk.parameters?.installation?.defaultEntityId,
  );
  const [defaultEntityErrorMessage, setDefaultEntityErrorMessage] = useState<string>('');

  const [defaultAssignmentSourceId, setDefaultAssignmentSourceId] = useState<number | undefined>(
    sdk.parameters?.installation?.defaultAssignmentSourceId,
  );
  const [defaultAssignmentSourceErrorMessage, setDefaultAssignmentSourceErrorMessage] =
    useState<string>('');

  const [entities, setEntities] = useState<Array<Option>>([]);

  const [assignmentSourcesByEntityId, setAssignmentSourcesByEntityId] = useState<
    Record<number, Option[]>
  >({} as Record<number, Option[]>);

  const selectedEntity = useMemo(
    () => entities.find(({ id }) => id === defaultEntityId),
    [defaultEntityId, entities],
  );

  const assignmentSources = useMemo<Option[]>(
    () => (selectedEntity ? (assignmentSourcesByEntityId[selectedEntity.id] ?? []) : []),
    [assignmentSourcesByEntityId, selectedEntity],
  );

  const selectedAssignmentSource = useMemo(
    () => assignmentSources.find(({ id }) => id === defaultAssignmentSourceId),
    [assignmentSources, defaultAssignmentSourceId],
  );

  const clearErrors = () => {
    setApiKeyErrorMessage('');
    setDefaultEntityErrorMessage('');
    setDefaultAssignmentSourceErrorMessage('');
  };

  const makeConfigOptionsRequest = useCallback(
    (apiKey: string) => {
      // Obfuscated api keys will look like ******. If the api key
      // starts with *, then we know the user didn't make any updates
      // to the existing api key.
      const isObfuscatedApiKey = apiKey.startsWith('*');
      if (!isObfuscatedApiKey) {
        // In cases where there's a new install, we aren't able to sign the request
        // so we have to send an unsigned request with the api key supplied. We also
        // need to reuse this request for cases where the user is updating the api key.
        const requestProps: ApiRequestProps = {
          method: 'GET',
          url: `${getApiBaseUrl()}/api/contentful/v1/config-options/unsigned`,
          headers: {
            'x-eppo-api-key': apiKey,
          },
        };
        return unsignedApiRequest<ConfigOptionsDto>(apiKey, requestProps);
      } else {
        const requestProps: ApiRequestProps = {
          method: 'GET',
          url: `${getApiBaseUrl()}/api/contentful/v1/config-options`,
        };
        return apiRequest<ConfigOptionsDto>(sdk, requestProps);
      }
    },
    [sdk],
  );

  const loadConfigOptions = useCallback(
    async (_apiKey: string) => {
      const apiKey = _apiKey.trim();
      if (apiKey) {
        try {
          setIsLoadingOptions(true);
          const { entities, assignmentSourcesByEntityId } = await makeConfigOptionsRequest(apiKey);
          clearErrors();
          setEntities(entities);
          setAssignmentSourcesByEntityId(assignmentSourcesByEntityId);
        } catch (err: any) {
          if (err instanceof HttpError && err.response.status === 401) {
            setApiKeyErrorMessage('Unknown API key');
          } else {
            const errorMessage = err.message;
            Notification.error(errorMessage ?? 'Unknown error').catch(console.error);
          }
        } finally {
          setIsLoadingOptions(false);
        }
      } else {
        setEntities([]);
        setAssignmentSourcesByEntityId({});
      }
    },
    [makeConfigOptionsRequest],
  );

  const onConfigure = useCallback(async () => {
    // noinspection JSDeprecatedSymbols
    const { items = [] } = await sdk.space.getContentTypes({
      order: 'name',
      limit: 1000,
    });
    const allContentTypes = items as ContentTypeProps[];
    const variationContainerContentType = allContentTypes.find(
      (ct: ContentTypeProps) => ct.sys.id === VARIATION_CONTAINER_ID,
    );
    if (!variationContainerContentType) {
      await createVariationContainerContentType(sdk);
    }

    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: {
        eppoApiKey: apiKey,
        defaultEntityId: selectedEntity?.id,
        defaultAssignmentSourceId: selectedAssignmentSource?.id,
      },
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: {
        EditorInterface: {
          /* Always pass in the `currentState` to avoid removing any previous location configuration */
          ...currentState?.EditorInterface,
          [VARIATION_CONTAINER_ID]: {
            sidebar: { position: 0 },
            editors: { position: 0, settings: {} },
          },
        },
      },
    };
  }, [apiKey, sdk, selectedAssignmentSource, selectedEntity]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: IAppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      const apiKey = currentParameters?.eppoApiKey || '';
      loadConfigOptions(apiKey);
      setApiKey(apiKey);
      setDefaultEntityId(currentParameters?.defaultEntityId);
      setDefaultAssignmentSourceId(currentParameters?.defaultAssignmentSourceId);

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [loadConfigOptions, sdk.app]);

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
      loadConfigOptions(apiKey);
    }
  }, [apiKey, apiKeyErrorMessage, loadConfigOptions]);

  return (
    <Stack flexDirection="column" alignItems="start" margin="spacing2Xl">
      <Heading>Eppo app configuration</Heading>
      <Form>
        <FormControl>
          <FormControl.Label isRequired>{CONFIG_FORM_API_KEY_LABEL}</FormControl.Label>
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
        <FormControl>
          <FormControl.Label isRequired>{CONFIG_FORM_DEFAULT_ENTITY_LABEL}</FormControl.Label>
          <Dropdown
            items={entities}
            selectedItem={selectedEntity}
            onSelectItem={({ id }) => {
              if (id !== defaultEntityId) {
                setDefaultEntityId(id);
                setDefaultAssignmentSourceId(undefined);
              }
              setDefaultAssignmentSourceErrorMessage('');
            }}
            onClick={() => {
              if (!apiKey.trim() || !!apiKeyErrorMessage) {
                setDefaultEntityErrorMessage('Set valid API key before selecting');
              }
            }}
            isLoading={isLoadingOptions}
            isInvalid={!!defaultEntityErrorMessage}
          />
          {!!defaultEntityErrorMessage && (
            <FormControl.ValidationMessage>
              {defaultEntityErrorMessage}
            </FormControl.ValidationMessage>
          )}
        </FormControl>
        <FormControl>
          <FormControl.Label isRequired>{CONFIG_FORM_DEFAULT_ASSIGNMENT_LABEL}</FormControl.Label>
          <Dropdown
            items={assignmentSources}
            selectedItem={selectedAssignmentSource}
            onSelectItem={({ id }) => {
              if (id !== defaultAssignmentSourceId) {
                setDefaultAssignmentSourceId(id);
              }
            }}
            onClick={() => {
              if (!apiKey.trim() || !!apiKeyErrorMessage) {
                setDefaultAssignmentSourceErrorMessage('Set valid API key before selecting');
              } else if (!defaultEntityId) {
                setDefaultAssignmentSourceErrorMessage('Set default entity before selecting');
              }
            }}
            isLoading={isLoadingOptions}
            isInvalid={!!defaultAssignmentSourceErrorMessage}
          />
          {!!defaultAssignmentSourceErrorMessage && (
            <FormControl.ValidationMessage>
              {defaultAssignmentSourceErrorMessage}
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Form>
    </Stack>
  );
};

const createVariationContainerContentType = async (sdk: ConfigAppSDK) => {
  // noinspection JSDeprecatedSymbols
  const variationContainer = await sdk.space.createContentType({
    sys: {
      id: VARIATION_CONTAINER_ID,
    },
    name: 'Eppo variant container',
    description: 'Eppo variant container',
    displayField: 'entryName',
    fields: [
      {
        id: 'allocationId',
        name: 'Allocation Id',
        type: 'Number',
        required: false, // only required after you publish (since allocation gets created when you publish)
        localized: false,
        omitted: true,
      },
      {
        id: 'experimentId',
        name: 'Experiment Id',
        type: 'Number',
        required: false, // only required after you publish (since experiment gets created when you publish)
        localized: false,
        omitted: true,
      },
      {
        id: 'flagKey',
        name: 'Flag Key',
        type: 'Symbol',
        required: true,
        localized: false,
      },
      {
        id: 'entryName',
        name: 'Entry name',
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
  await sdk.space.updateContentType(variationContainer);
};

export default ConfigScreen;
