import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useState } from 'react';
import { DialogParameters } from '../locations/Dialog';
import { SurferContext } from '../types';

export const useConfigurationDialog = (shareToken: string) => {
  const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
  const { dialogs } = useSDK<SidebarAppSDK>();

  const openConfigurationDialog = ({ requestView, refreshDraft }: SurferContext) => {
    setIsConfigurationOpen(true);

    const parameters: DialogParameters = {
      shareToken,
    };

    dialogs
      .openCurrentApp({
        position: 'center',
        shouldCloseOnOverlayClick: true,
        shouldCloseOnEscapePress: true,
        width: 'fullWidth',
        minHeight: '85vh',
        parameters,
      })
      .then(() => {
        setIsConfigurationOpen(false);
        refreshDraft();
        requestView('guidelines');
      });
  };

  return { isConfigurationOpen, openConfigurationDialog };
};
