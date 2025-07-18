import ContentBrowserDialog from '@/components/ContentBrowserDialog';
import MetadataViewerDialog from '@/components/MetadataViewerDialog';
import { DialogsInitiator } from '@/types';
import { DialogAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useMemo } from 'react';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  return useMemo(() => {
    if (!sdk.parameters.invocation
      || typeof sdk.parameters.invocation !== 'object'
      || !('initiator' in sdk.parameters.invocation)
      || !sdk.parameters.invocation.initiator
      || sdk.parameters.invocation.initiator === DialogsInitiator.AssetImporter) {
      return <div data-testid="dialog-component"><ContentBrowserDialog /></div>;
    }

    const { initiator, ...data } = sdk.parameters.invocation;
    if (initiator === DialogsInitiator.AssetCard) {
      // Visualize the data passed from AssetCard
      return <div data-testid="dialog-component"><MetadataViewerDialog data={data} /></div>;
    }
  }, [sdk.parameters.invocation]);
};

export default Dialog;
