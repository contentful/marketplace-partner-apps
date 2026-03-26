import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { ConfigAppSDK } from '@contentful/app-sdk';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import {
  Card,
  Note,
  TextInput,
  Form,
  FormControl,
  Flex,
  Button,
  Notification,
  Spinner,
} from '@contentful/f36-components';
import { SectionHeading, Text } from '@contentful/f36-typography';
import { Multiselect } from '@contentful/f36-multiselect';
import { Image } from '@contentful/f36-image';
import { ContentTypeProps } from 'contentful-management';

import BwxConfigInput from '../components/BwxConfigInput';
import BwxMultiselectWorkflows from '../components/BwxMultiselectWorkflows';

import { AppInstallationParameters, EditorInterfaceAssignment } from '../interfaces';

import bwxApi from '../api/api';

const emptyState: AppInstallationParameters = {
  apiKey: '',
  secretKey: '',
  configUuid: '',
  orgUnitUuid: '',
  contactUuid: '',
  workflows: [],
  selectedContentTypes: [],
};

type EditorInterfaceState = Record<string, { sidebar?: { position: number } }>;

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const [apiKey, setApiKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [configUuid, setConfigUuid] = useState<string>('');
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [orgUnitUuid, setOrgUnitUuid] = useState<string>('');
  const [contactUuid, setContactUuid] = useState<string>('');
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [filteredContentTypes, setFilteredContentTypes] = useState<ContentTypeProps[]>([]);
  const [firstInstallation, setFirstInstallation] = useState<boolean>(true);
  const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
  const [loadingScreen, setLoadingScreen] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const installationParameters = useMemo<AppInstallationParameters>(() => {
    return {
      apiKey: apiKey.trim(),
      secretKey: secretKey.trim(),
      configUuid: configUuid.trim(),
      orgUnitUuid: orgUnitUuid.trim(),
      contactUuid: contactUuid.trim(),
      workflows,
      selectedContentTypes,
    };
  }, [apiKey, secretKey, configUuid, orgUnitUuid, contactUuid, workflows, selectedContentTypes]);

  const handleSearchContentTypes = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.trim().toLowerCase();
    if (!value) {
      setFilteredContentTypes(contentTypes);
      return;
    }

    const nextItems = contentTypes.filter((item) => {
      const byName = item.name.toLowerCase().includes(value);
      const byId = item.sys.id.toLowerCase().includes(value);
      return byName || byId;
    });

    setFilteredContentTypes(nextItems);
  };

  const onSelectContentType = (event: ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;

    if (checked) {
      setSelectedContentTypes((prev) => (prev.includes(value) ? prev : [...prev, value]));
      return;
    }

    setSelectedContentTypes((prev) => prev.filter((item) => item !== value));
  };

  const testConnection = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoadingConnection(true);
    setIsConnected(false);

    try {
      await bwxApi.login(apiKey.trim(), secretKey.trim(), sdk, cma);
      setIsConnected(true);
      Notification.success('Successfully authenticated with wxrks.');
    } catch (error) {
      console.error(error);
      setIsConnected(false);
      Notification.error('Failed to authenticate with wxrks. Check your credentials and try again.');
    } finally {
      setLoadingConnection(false);
    }
  };

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    const formIsValid =
      !!installationParameters.apiKey &&
      !!installationParameters.secretKey &&
      !!installationParameters.configUuid &&
      installationParameters.selectedContentTypes.length > 0;

    if (!formIsValid) {
      Notification.error(
        'Please fill in API ID, Secret Key, Connector Config UUID and select at least one content type for the sidebar.',
        { title: 'Invalid Configuration' }
      );
      throw new Error('Invalid app configuration');
    }

    const editorInterface: EditorInterfaceAssignment = installationParameters.selectedContentTypes.reduce(
      (acc, contentTypeId) => ({
        ...acc,
        [contentTypeId]: { sidebar: { position: 1 } },
      }),
      {}
    );

    return {
      parameters: installationParameters,
      targetState: {
        ...currentState,
        EditorInterface: editorInterface,
      },
    };
  }, [installationParameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    const init = async () => {
      try {
        const [currentParameters, currentState, contentTypeResult] = await Promise.all([
          sdk.app.getParameters(),
          sdk.app.getCurrentState(),
          cma.contentType.getMany({ limit: 1000 }),
        ]);

        if (contentTypeResult?.items) {
          setContentTypes(contentTypeResult.items);
          setFilteredContentTypes(contentTypeResult.items);
        }

        if (currentParameters) {
          setFirstInstallation(false);
          setApiKey(currentParameters.apiKey ?? emptyState.apiKey);
          setSecretKey(currentParameters.secretKey ?? emptyState.secretKey);
          setConfigUuid(currentParameters.configUuid ?? emptyState.configUuid);
          setContactUuid(currentParameters.contactUuid ?? emptyState.contactUuid);
          setOrgUnitUuid(currentParameters.orgUnitUuid ?? emptyState.orgUnitUuid);
          setWorkflows(currentParameters.workflows ?? emptyState.workflows);

          const selectedFromParams = currentParameters.selectedContentTypes ?? [];
          if (selectedFromParams.length > 0) {
            setSelectedContentTypes(selectedFromParams);
          }
        }

        if (!currentParameters?.selectedContentTypes?.length) {
          const editorInterface = (currentState?.EditorInterface ?? {}) as EditorInterfaceState;
          const selectedFromTargetState = Object.keys(editorInterface).filter(
            (contentTypeId) => editorInterface[contentTypeId]?.sidebar
          );

          if (selectedFromTargetState.length > 0) {
            setSelectedContentTypes(selectedFromTargetState);
          }
        }
      } finally {
        setLoadingScreen(false);
        sdk.app.setReady();
      }
    };

    init();
  }, [sdk, cma]);

  if (loadingScreen) {
    return (
      <Flex alignItems="center" justifyContent="center" marginTop="spacingXl">
        <Spinner />
      </Flex>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingS" alignItems="center" justifyContent="center" style={{ marginBottom: '50px' }}>
      <Image
        alt="wxrks logo"
        height="281px"
        width="400px"
        src={`${process.env.PUBLIC_URL}/assets/wxrks.svg`}
      />

      <Flex flexDirection="column" style={{ width: '60%' }} gap="spacingS">
        <SectionHeading marginBottom="spacingS">Authentication Settings (1/3)</SectionHeading>
        <Card style={{ padding: '30px' }}>
          <Form onSubmit={testConnection}>
            <FormControl isRequired>
              <FormControl.Label>API ID</FormControl.Label>
              <TextInput value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
            </FormControl>

            <FormControl isRequired>
              <FormControl.Label>Secret Key</FormControl.Label>
              <TextInput value={secretKey} type="password" onChange={(event) => setSecretKey(event.target.value)} />
            </FormControl>

            <Button
              variant="primary"
              type="submit"
              isLoading={loadingConnection}
              isDisabled={loadingConnection || !apiKey.trim() || !secretKey.trim()}
              isFullWidth
            >
              {loadingConnection ? 'Testing credentials' : 'Test Connection'}
            </Button>
          </Form>

          {isConnected && (
            <Flex flexDirection="column" gap="spacingS" alignItems="center">
              <Text fontColor="green600" fontWeight="fontWeightDemiBold">
                You are connected with wxrks
              </Text>
            </Flex>
          )}
        </Card>
      </Flex>

      <Flex flexDirection="column" style={{ width: '60%' }} gap="spacingS">
        <SectionHeading marginTop="spacingS" marginBottom="spacingS">Project Settings (2/3)</SectionHeading>
        <Card style={{ padding: '30px', paddingBottom: '0px' }}>
          <Flex flexDirection="column">
            <BwxConfigInput onInput={setConfigUuid} configUuid={configUuid} />
            <BwxMultiselectWorkflows onInput={setWorkflows} workflowsValue={workflows} hideTip={false} />
          </Flex>
        </Card>
      </Flex>

      <Flex flexDirection="column" style={{ width: '60%' }} gap="spacingS">
        <SectionHeading marginTop="spacingS" marginBottom="spacingS">Content Model Assignment (3/3)</SectionHeading>
        <Card style={{ padding: '30px' }}>
          <FormControl isRequired>
            <FormControl.Label>Content Types with wxrks sidebar</FormControl.Label>
            <Multiselect
              placeholder="Select content types"
              searchProps={{
                searchPlaceholder: 'Search content types',
                onSearchValueChange: handleSearchContentTypes,
              }}
              popoverProps={{ isFullWidth: true }}
              currentSelection={selectedContentTypes}
            >
              {filteredContentTypes.map((item) => (
                <Multiselect.Option
                  key={item.sys.id}
                  itemId={item.sys.id}
                  value={item.sys.id}
                  label={item.name}
                  onSelectItem={onSelectContentType}
                  isChecked={selectedContentTypes.includes(item.sys.id)}
                />
              ))}
            </Multiselect>
            <FormControl.HelpText>
              Select only the content types where editors should see the wxrks sidebar.
            </FormControl.HelpText>
          </FormControl>

          {selectedContentTypes.length === 0 && (
            <Note variant="warning">Select at least one content type to finish app installation.</Note>
          )}
        </Card>
      </Flex>

      {!firstInstallation && (
        <Note style={{ width: '60%' }} variant="warning">
          Changes may take a few seconds to reflect in app installations.
        </Note>
      )}

      <Note style={{ width: '60%' }} variant="neutral">
        For further details on how to configure, please visit: <a href="https://wxrks.com" target="_blank" rel="noreferrer">wxrks</a>
      </Note>
    </Flex>
  );
};

export default ConfigScreen;

