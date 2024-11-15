import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { AppInstallationParameters, CloudinaryAsset } from '../../types';
import { OpenDialogButton } from './OpenDialogButton';
import { Thumbnails } from './Thumbnails';
import { css, Global } from '@emotion/react';

const globalStyles = css`
  html {
    width: 100vw;
    overflow-x: hidden;
  }
`;

const Field = () => {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();
  useAutoResizer({ absoluteElements: true });

  const [assets, setAssets] = useFieldValue<CloudinaryAsset[] | null>(sdk.field.id, sdk.field.locale);

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged((disabled) => setEditingEnabled(!disabled));
  }, [sdk.field]);

  const canAddAssets = assets && assets.length < sdk.parameters.installation.maxFiles && editingEnabled;
  const assetsArray = assets || [];

  return (
    <>
      <Global styles={globalStyles} />
      <GlobalStyles />
      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets && assets.length > 0 && <Thumbnails assets={assets} onChange={(asset) => {
          if (asset.length === 0) {
            return setAssets(null);
          } else {
            return setAssets(asset)
          }
        }} isDisabled={!editingEnabled} />}
        <OpenDialogButton isDisabled={!canAddAssets} onNewAssetsAdded={(newAssets) => {
          if (newAssets.length === 0) {
            setAssets(null);
          } else {
            setAssets([...assetsArray, ...newAssets])
          }
        }} />
      </Stack>
    </>
  );
};

export default Field;
