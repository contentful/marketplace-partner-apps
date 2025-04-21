import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import { useEffect, useState, useRef } from 'react';
import ConvoxBackgroundCover from '../components/ConvoxBackgroundCover';
import ConvoxConnect from '../components/ConvoxConnect';
import ConvoxConfigEditor from '../components/ConvoxConfigEditor';
import ConvoxContentTypes from '../components/ConvoxContentTypes';
import ConvoxBranding from '../components/ConvoxBranding';
import tokens from '@contentful/f36-tokens';
import { IWorkflowConfig } from '../customTypes/IWorkflowConfig';
import { IAppInstallationParameters } from '../customTypes/IAppInstallationParameters'
import { useContentTypes } from '../hooks/useContentTypes';
import useFetchWorkflows from '../hooks/useWorkflows';
import {
  selectedContentTypesToTargetState,
  targetStateToSelectedContentTypes
} from '../helpers/ContentTypesHelper';
import { CONVOX_APP_ERROR_MESSAGES } from '../constants';

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
};

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const { contentTypes } = useContentTypes();

  const [convoxDeployKey, setConvoxDeployKey] = useState('');

  const lastValidatedKeyRef = useRef('');

  const [parameters, setParameters] = useState<IAppInstallationParameters>({
    workflowConfigs: [],
    convoxDeployKey: '',
    selectedContentTypes: [],
  });

  const { workflowConfigs, selectedContentTypes } = parameters;

  const { workflows, isAuthenticated, hasAuthError, isLoading } = useFetchWorkflows(convoxDeployKey);

  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setAuthCheckComplete(true);

      if (isAuthenticated && !hasAuthError) {
        lastValidatedKeyRef.current = convoxDeployKey;
      }
    }
  }, [isLoading, isAuthenticated, hasAuthError, convoxDeployKey]);

  useEffect(() => {
    setParameters(prev => ({
      ...prev,
      convoxDeployKey
    }));
  }, [convoxDeployKey]);

  const isKeyValid = () => {

    if (!convoxDeployKey) {
      return false;
    }

    if (isLoading) {
      return lastValidatedKeyRef.current === convoxDeployKey;
    }

    return isAuthenticated && !hasAuthError;
  };

  const [installAttempted, setInstallAttempted] = useState(false);

  const hasAuthenticationError = () => {
    if (isLoading) {
      return false;
    }

    if (!convoxDeployKey) {
      return installAttempted;
    }
    return authCheckComplete && !isKeyValid();
  };

  const handleConfigure = async () => {
    setInstallAttempted(true);

    if (isLoading) {
      sdk.notifier.error("Please wait while we validate your authentication...");
      return false;
    }

    if (!convoxDeployKey) {
      sdk.notifier.error(CONVOX_APP_ERROR_MESSAGES.AUTHENTICATION_DEPLOY_KEY_ERROR_MESSAGE);
      return false;
    }

    if (!isKeyValid()) {
      sdk.notifier.error(CONVOX_APP_ERROR_MESSAGES.AUTHENTICATION_DEPLOY_KEY_ERROR_MESSAGE);
      return false;
    }

    if (workflowConfigs.length === 0) {
      sdk.notifier.error(CONVOX_APP_ERROR_MESSAGES.REQUIRED_WORKFLOWS_ERROR_MESSAGE);
      return false;
    }

    const currentState = await sdk.app.getCurrentState();
    const updatedEditorInterface = selectedContentTypesToTargetState(
      contentTypes,
      selectedContentTypes
    );

    return {
      parameters,
      targetState: {
        ...currentState,
        EditorInterface: updatedEditorInterface,
      },
    };
  };

  useEffect(() => {
    sdk.app.onConfigure(() => handleConfigure());
  }, [parameters, sdk, isAuthenticated, hasAuthError, isLoading, contentTypes]);

  useEffect(() => {
    const initializeApp = async () => {
      const isInstalled = await sdk.app.isInstalled();

      if (isInstalled) {
        const currentParameters = await sdk.app.getParameters();
        const targetState = await sdk.app.getCurrentState();

        if (targetState) {
          const selectedTypes = targetStateToSelectedContentTypes(targetState);

          setParameters(prev => ({
            ...prev,
            selectedContentTypes: selectedTypes
          }));
        }

        if (currentParameters) {
          if (currentParameters.convoxDeployKey) {
            setConvoxDeployKey(currentParameters.convoxDeployKey);
          }

          setParameters(prev => ({
            ...prev,
            workflowConfigs: currentParameters.workflowConfigs || [],
            selectedContentTypes: prev.selectedContentTypes,
          }));
        }
      }

      sdk.app.setReady();
    };

    initializeApp();
  }, [sdk]);

  const updateDeployKey = (token: string) => {
    if (token && installAttempted) {
      setInstallAttempted(false);
    }

    setAuthCheckComplete(false);
    setConvoxDeployKey(token);
  };

  const updateWorkflowConfig = (workflowConfig: IWorkflowConfig, index: number) => {
    setParameters(prev => {
      const updatedConfigs = index === -1
        ? [...prev.workflowConfigs, workflowConfig]
        : prev.workflowConfigs.map((config, i) =>
          i === index ? workflowConfig : config
        );

      return {
        ...prev,
        workflowConfigs: updatedConfigs
      };
    });
  };

  const removeWorkflowConfig = (id: string) => {
    setParameters(prev => ({
      ...prev,
      workflowConfigs: prev.workflowConfigs.filter(config =>
        config.workflow.id !== id
      )
    }));
  };

  const handleContentTypesChange = (ids: string[]) => {
    setParameters(prev => ({
      ...prev,
      selectedContentTypes: ids
    }));
  };

  return (
    <>
      <ConvoxBackgroundCover />
      <div className={styles.card}>
        <ConvoxBranding />
        <ConvoxConnect
          convoxDeployKey={convoxDeployKey}
          updateconvoxDeployKey={updateDeployKey}
          isAuthenticated={isKeyValid()}
          hasAuthError={hasAuthenticationError()}
        />
        <div className={styles.relative}>
          {!isKeyValid() && <div className={styles.configurationProtector} />}
          <ConvoxConfigEditor
            isAuthenticated={isKeyValid()}
            workflowConfigs={workflowConfigs}
            updateWorkflowConfigs={updateWorkflowConfig}
            removeWorkflowConfigs={removeWorkflowConfig}
            workflows={workflows}
          />
          <ConvoxContentTypes
            contentTypes={contentTypes}
            selectedContentTypes={selectedContentTypes}
            onContentTypesChange={handleContentTypesChange}
            isAuthenticated={isKeyValid()}
          />
        </div>
      </div>
    </>
  );
};

export default ConfigScreen;
