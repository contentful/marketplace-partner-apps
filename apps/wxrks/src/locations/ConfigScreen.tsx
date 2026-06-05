import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

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
import { SectionHeading } from '@contentful/f36-typography';
import { Image } from '@contentful/f36-image';

import BwxConfigInput from '../components/BwxConfigInput';
import BwxMultiselectWorkflows from '../components/BwxMultiselectWorkflows';

import { AppInstallationParameters, Workflow } from '../interfaces';

import bwxApi from '../api/api';
import { parseWorkflows, serializeWorkflows } from '../workflows';

const emptyState: AppInstallationParameters = {
  apiKey: '',
  secretKey: '',
  configUuid: '',
  orgUnitUuid: '',
  contactUuid: '',
  workflows: '',
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const cma = useCMA();

  const [apiKey, setApiKey] = useState<string>('');
  const [secretKey, setSecretKey] = useState<string>('');
  const [configUuid, setConfigUuid] = useState<string>('');
  const [workflows, setWorkflows] = useState<string[]>([]);
  const [workflowOptions, setWorkflowOptions] = useState<Workflow[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState<boolean>(false);
  const [workflowLoadError, setWorkflowLoadError] = useState<boolean>(false);
  const [orgUnitUuid, setOrgUnitUuid] = useState<string>('');
  const [contactUuid, setContactUuid] = useState<string>('');
  const [isFirstInstallation, setIsFirstInstallation] = useState<boolean>(true);
  const [hasSavedSecret, setHasSavedSecret] = useState<boolean>(false);
  const [loadingConnection, setLoadingConnection] = useState<boolean>(false);
  const [loadingScreen, setLoadingScreen] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const isExistingInstallation = !isFirstInstallation;
  const canUseSignedRequest = isExistingInstallation;

  const installationParameters = useMemo<AppInstallationParameters>(() => ({
    apiKey: apiKey.trim(),
    secretKey: secretKey.trim(),
    configUuid: configUuid.trim(),
    orgUnitUuid: orgUnitUuid.trim(),
    contactUuid: contactUuid.trim(),
    workflows: serializeWorkflows(workflows),
  }), [apiKey, configUuid, contactUuid, orgUnitUuid, secretKey, workflows]);

  const loadWorkflowOptions = useCallback(async () => {
    setLoadingWorkflows(true);
    setWorkflowLoadError(false);
    try {
      const loadedWorkflows = await bwxApi.getWorkflows(sdk, cma, undefined, canUseSignedRequest);
      setWorkflowOptions(loadedWorkflows);
    } catch (err) {
      console.error(err);
      setWorkflowOptions([]);
      setWorkflowLoadError(true);
    } finally {
      setLoadingWorkflows(false);
    }
  }, [sdk, cma, canUseSignedRequest]);

  const testConnection = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setLoadingConnection(true);
    setIsConnected(false);

    try {
      await bwxApi.login(apiKey.trim(), secretKey.trim() || undefined, sdk, cma, canUseSignedRequest);
      setIsConnected(true);
      Notification.success('Successfully authenticated with wxrks.');
    } catch (err) {
      console.error(err);
      setIsConnected(false);
      Notification.error('Failed to authenticate with wxrks. Check your credentials and try again.');
    } finally {
      setLoadingConnection(false);
    }
  };

  const onConfigure = useCallback(async () => {
    const formIsValid =
      isConnected &&
      !!installationParameters.apiKey &&
      !!installationParameters.secretKey &&
      !!installationParameters.configUuid &&
      workflows.length > 0;

    if (!formIsValid) {
      Notification.error(
        'Please fill in API ID, Secret Key, Connector Config UUID, and workflows.',
        { title: 'Invalid Configuration' }
      );
      throw new Error('Invalid app configuration');
    }

    return {
      parameters: installationParameters,
    };
  }, [installationParameters, isConnected, workflows.length]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    if (isConnected) {
      loadWorkflowOptions();
    }
  }, [isConnected, loadWorkflowOptions]);

  useEffect(() => {
    const init = async () => {
      try {
        const currentParameters = await sdk.app.getParameters();

        if (currentParameters) {
          setIsFirstInstallation(false);
          setApiKey(currentParameters.apiKey ?? emptyState.apiKey);
          setConfigUuid(currentParameters.configUuid ?? emptyState.configUuid);
          setContactUuid(currentParameters.contactUuid ?? emptyState.contactUuid);
          setOrgUnitUuid(currentParameters.orgUnitUuid ?? emptyState.orgUnitUuid);
          setWorkflows(parseWorkflows(currentParameters.workflows));

          if (currentParameters.secretKey) {
            setHasSavedSecret(true);
          }
        }
      } finally {
        setLoadingScreen(false);
        sdk.app.setReady();
      }
    };

    init();
  }, [sdk]);

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

      <Flex flexDirection="column" style={{ width: '60%', marginTop: '50px' }} gap="spacingS">
        <SectionHeading marginBottom="spacingS">Authentication Settings (1/2)</SectionHeading>
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
              isDisabled={loadingConnection || !apiKey.trim() || (!secretKey.trim() && !hasSavedSecret)}
              isFullWidth
            >
              {loadingConnection ? 'Testing credentials' : 'Test Connection'}
            </Button>
          </Form>

          {isConnected && (
            <Flex flexDirection="column" gap="spacingS" alignItems="center">
              <br></br>
              <Note style={{ padding: '10px' }} variant="positive"><b>You are connected with wxrks</b></Note>
            </Flex>
          )}
        </Card>
      </Flex>

      {isConnected && (
        <>
          <Flex flexDirection="column" style={{ width: '60%' }} gap="spacingS">
            <SectionHeading marginTop="spacingS" marginBottom="spacingS">Project Settings (2/2)</SectionHeading>
            <Card style={{ padding: '30px', paddingBottom: '0px' }}>
              <Flex flexDirection="column">
                <BwxConfigInput onInput={setConfigUuid} configUuid={configUuid} />
                <BwxMultiselectWorkflows
                  onInput={setWorkflows}
                  workflowsValue={workflows}
                  hideTip={false}
                  workflowOptions={workflowOptions}
                  workflowsLoading={loadingWorkflows}
                  workflowsError={workflowLoadError}
                />
                <br></br>
              </Flex>
            </Card>
          </Flex>
        </>
      )}

      {isExistingInstallation && isConnected && (
        <Note style={{ width: '60%' }} variant="warning">
          Changes may take a few seconds to reflect in the app installations.
        </Note>
      )}

      <Note style={{ width: '60%' }} variant="neutral">
        For further details on how to configure, please visit: <a href="https://support.wxrks.com/en/articles/10430113-bureau-works-contentful-integration" target="_blank" rel="noreferrer">wxrks</a>
      </Note>
    </Flex>
  );
};

export default ConfigScreen;
