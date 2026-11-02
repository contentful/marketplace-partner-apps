import { useState } from 'react';

import type { DialogAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { type Asset, RasterPicker, RasterProvider } from '@raster-app/react';
import '@raster-app/react/styles.css';
import type { Image } from '../lib/types';

import { getRasterClient, readParameters } from '../lib/client';
import { toImage, whyRefused } from '../lib/image';
import RasterImagesList from '../components/ImageList';

function Dialog() {
  const sdk = useSDK<DialogAppSDK>();
  const { orgId, apiKey } = readParameters(sdk.parameters.installation);

  // Invocation parameters are passed to the dialog in `parameters` via sdk.dialogs.openCurrentApp
  const { currentValue } = sdk.parameters.invocation as {
    currentValue: Image[] | undefined;
  };

  const [selected, setSelected] = useState<Image[]>(currentValue ?? []);

  const handlePick = (asset: Asset) => {
    // The field has only held images, and sites render it as such.
    const refused = whyRefused(asset);
    if (refused !== null) {
      sdk.notifier.warning(refused);
      return;
    }
    setSelected((current) => (current.some((image) => image.id === asset.id) ? current : [...current, toImage(asset)]));
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="pt-5 px-10">
        <RasterImagesList images={selected} onChange={setSelected} />
      </div>

      {/* The picker fills its container. */}
      <div className="flex-1 min-h-0">
        <RasterProvider {...getRasterClient(sdk.ids, orgId)}>
          <RasterPicker organizationId={orgId} apiKey={apiKey} onPick={handlePick} onError={console.error} theme="light" />
        </RasterProvider>
      </div>

      {/* Selected images count, confirm and cancel buttons */}
      <div className="flex items-center justify-between border-t border-gray-200 py-4 px-7">
        <span className="font-medium">{selected.length} selected</span>
        <div className="flex gap-3">
          <Button onClick={() => sdk.close()}>Cancel</Button>
          <Button variant="positive" isDisabled={!selected.length} onClick={() => sdk.close(selected)}>
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Dialog;
