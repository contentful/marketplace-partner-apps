import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { AppInstallationParameters, Asset } from '../../types';
import { OpenDialogButton } from './OpenDialogButton';
import { Thumbnails } from './Thumbnails';

export default function Field(): ReactElement {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();
  useAutoResizer();

  const [assets = [], setAssets] = useFieldValue<Asset[]>();

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged(disabled => setEditingEnabled(!disabled));
  }, [sdk.field]);

  const handleAssetsChanged = useCallback(async (newAssets: Asset[] | undefined) => {
    if (!newAssets) return;

    await setAssets([...assets, ...newAssets]);
  }, [assets]);

  const installParams = sdk.parameters.installation;

  const isFileNumberLimited = installParams.maxFiles !== 0;
  const canAddMoreFiles = !isFileNumberLimited || assets.length < installParams.maxFiles;
  const maxFiles = !isFileNumberLimited ? 0 : Math.max(0, installParams.maxFiles - assets.length);

  return (
    <>
      <GlobalStyles />

      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets.length > 0 && (
          <Thumbnails
            assets={assets}
            onChange={setAssets}
            isDisabled={!editingEnabled}
          />
        )}

        <OpenDialogButton
          onAssetsChanged={handleAssetsChanged}
          isDisabled={!editingEnabled || !canAddMoreFiles}
          maxFiles={maxFiles}
        />
      </Stack>
    </>
  );
}
