import ContentBrowserDialog from '@/components/ContentBrowserDialog';
import MetadataViewerDialog from '@/components/MetadataViewerDialog';
import { DialogsInitiator } from '@/types';
import { DialogAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo } from 'react';

export function getDialogType(parameters: any): string {
  if (!parameters.invocation
      || typeof parameters.invocation !== 'object'
      || !('initiator' in parameters.invocation)
      || !parameters.invocation.initiator
      || parameters.invocation.initiator === DialogsInitiator.AssetImporter) {
    return 'content-browser';
  }

  if (parameters.invocation.initiator === DialogsInitiator.AssetCard) {
    return 'metadata-viewer';
  }

  return 'unknown';
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  // Replace the inline validation logic with the helper function
  const dialogType = getDialogType(sdk.parameters);

  return useMemo(() => {
    if (dialogType === 'content-browser') {
      return <div data-testid="dialog-component"><ContentBrowserDialog /></div>;
    }

    if (dialogType === 'metadata-viewer') {
      const { initiator, ...data } = sdk.parameters.invocation;
      // Visualize the data passed from AssetCard
      return <div data-testid="dialog-component"><MetadataViewerDialog data={data} /></div>;
    }
  }, [sdk.parameters.invocation]);
};

export default Dialog;
