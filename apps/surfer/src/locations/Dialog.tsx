import { useRef } from 'react';
import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { KeyValueMap } from 'contentful-management';
import { useSurfer } from '../hooks/useSurfer';
import { SurferRpcCommands } from '../types';
import { SurferContainer } from '../components/SurferContainer';

export type DialogParameters = {
  shareToken: string;
};

const Dialog = () => {
  const { parameters, close } = useSDK<DialogAppSDK<KeyValueMap, DialogParameters>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const { isLoading } = useSurfer(containerRef, 'draft_configuration', {
    shareToken: parameters.invocation.shareToken,
    onReady: ({ requestView, configureView }) => {
      configureView({
        disableDraftConfiguration: true,
        configurationOnCancelOverride: true,
      });
      requestView('draft_configuration');
    },
    onRpcMessage: ({ command }) => {
      if (command.message === SurferRpcCommands.CONFIGURATION_CANCELLED) {
        close();
      }
    },
  });

  return <SurferContainer ref={containerRef} isLoading={isLoading} height="100vh" />;
};

export default Dialog;
