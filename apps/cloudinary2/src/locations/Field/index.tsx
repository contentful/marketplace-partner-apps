import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { AppInstallationParameters, CloudinaryAsset } from '../../types';
import { OpenDialogButton } from './OpenDialogButton';
import { Thumbnails } from './Thumbnails';

const Field = () => {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();
  useAutoResizer({ absoluteElements: true });

  const [assets = [], setAssets] = useFieldValue<CloudinaryAsset[]>();

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged((disabled) => setEditingEnabled(!disabled));
  }, [sdk.field]);

  const canAddAssets = assets.length < sdk.parameters.installation.maxFiles && editingEnabled;

  return (
    <>
      <GlobalStyles />
      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets.length > 0 && <Thumbnails assets={assets} onChange={setAssets} isDisabled={!editingEnabled} />}
        <OpenDialogButton isDisabled={!canAddAssets} onNewAssetsAdded={(newAssets) => setAssets([...assets, ...newAssets])} />
      </Stack>
    </>
  );
};

export default Field;
