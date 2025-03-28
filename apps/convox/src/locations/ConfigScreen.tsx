import { ConfigAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';
import ConvoxBackgroundCover from '../components/ConvoxBackgroundCover';
import ConvoxConnect from '../components/ConvoxConnect';
import ConvoxConfigEditor from '../components/ConvoxConfigEditor';
import tokens from '@contentful/f36-tokens';
import { IWorkflowConfig } from '../customTypes/IWorkflowConfig';
import ConvoxContentTypes from '../components/ConvoxContentTypes';
import ConvoxBranding from '../components/ConvoxBranding';
import { useContentTypes } from '../hooks/useContentTypes';
import useFetchWorkflows from '../hooks/useWorkflows';
import { selectedContentTypesToTargetState, targetStateToSelectedContentTypes } from '../helpers/ContentTypesHelper';
import {CONVOX_APP_ERROR_MESSAGES} from '../constants';

export interface AppInstallationParameters {
  workflowConfigs: IWorkflowConfig[];
  convoxDeployKey: string;
  selectedContentTypes: string[];
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    workflowConfigs: [],
    convoxDeployKey: '',
    selectedContentTypes: [],
  });
  const sdk = useSDK<ConfigAppSDK>();
  const { contentTypes } = useContentTypes();
  const [convoxDeployKey, setConvoxDeployKey] = useState("");
  const [workflowConfigs, setWorkflowConfigs] = useState<IWorkflowConfig[]>([]);

  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const { workflows, isAuthenticated, hasAuthError } = useFetchWorkflows(convoxDeployKey);


  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    if (hasAuthError || workflowConfigs.length === 0) {
      sdk.notifier.error(
        hasAuthError
          ? CONVOX_APP_ERROR_MESSAGES.AUTHENTICATION_DEPLOY_KEY_ERROR_MESSAGE
          : CONVOX_APP_ERROR_MESSAGES.REQUIRED_WORKFLOWS_ERROR_MESSAGE
      );
      return false;
    }

    const currentState = await sdk.app.getCurrentState();

    const updatedEditorInterface = selectedContentTypesToTargetState(contentTypes, selectedContentTypes);

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: {
        ...currentState,
        EditorInterface: updatedEditorInterface,
      },
    };
  }, [parameters, sdk, selectedContentTypes, isAuthenticated]);

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

      const isInstalled = await sdk.app.isInstalled();

      if (isInstalled) {
        const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();
        const targetState = await sdk.app.getCurrentState();
        if (targetState) {
          const selectedTypes = targetStateToSelectedContentTypes(targetState);
          setSelectedContentTypes(selectedTypes);
        }

        if (currentParameters) {
          setParameters(currentParameters);
          if (currentParameters.workflowConfigs && currentParameters.workflowConfigs.length > 0) {
            setWorkflowConfigs(currentParameters.workflowConfigs);
          }

          if (currentParameters.convoxDeployKey) {
            setConvoxDeployKey(currentParameters.convoxDeployKey)
          }
        }
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    setParameters(prevParameters => ({
      ...prevParameters,
      workflowConfigs,
      convoxDeployKey,
    }));
  }, [workflowConfigs, convoxDeployKey])


  function updateconvoxDeployKey(token: string) {
    setConvoxDeployKey(token);
  }

  function updateWorkflowConfigs(workflowConfig: IWorkflowConfig, index: number) {
    setWorkflowConfigs(prevConfigs =>
      index === -1
        ? [...prevConfigs, workflowConfig]
        : prevConfigs.map((config, i) => (i === index ? workflowConfig : config))
    );
  }

  function removeWorkflowConfigs(id: string) {
    const configs = workflowConfigs.filter(config => config.workflow.id !== id);
    setWorkflowConfigs(configs);
  }

  function onContentTypesChange(ids: string[]) {
    setSelectedContentTypes(ids);
  }

  return (
    <>
      <ConvoxBackgroundCover />
      <div className={styles.card}>
        <ConvoxBranding />
        <ConvoxConnect convoxDeployKey={convoxDeployKey} updateconvoxDeployKey={updateconvoxDeployKey} isAuthenticated={isAuthenticated} hasAuthError={hasAuthError} />
        <div className={styles.relative}>
          {!isAuthenticated && <div className={styles.configurationProtector} />}
          <ConvoxConfigEditor isAuthenticated={isAuthenticated} workflowConfigs={workflowConfigs} updateWorkflowConfigs={updateWorkflowConfigs} removeWorkflowConfigs={removeWorkflowConfigs} workflows={workflows} />
          <ConvoxContentTypes contentTypes={contentTypes} selectedContentTypes={selectedContentTypes} onContentTypesChange={onContentTypesChange} isAuthenticated={isAuthenticated} />
        </div>
      </div>
    </>
  );
};

const styles = {
  card: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: '2',
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  relative: css({
    position: 'relative',
  }),
  configurationProtector: css({
    zIndex: 9999,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.60)',
    position: 'absolute',
  }),
}

export default ConfigScreen;
