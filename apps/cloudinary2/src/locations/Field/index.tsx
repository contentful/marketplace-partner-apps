import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { css, Global } from '@emotion/react';
import { useEffect, useState } from 'react';
import { AppInstallationParameters, CloudinaryAsset } from '../../types';
import { AssetPickerButton } from './AssetPickerButton';
import { Thumbnails } from './Thumbnails';

const globalStyles = css`
  html {
    width: 100vw;
    overflow-x: hidden;
  }
`;

const Field = () => {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();
  useAutoResizer({ absoluteElements: true });

  const [fieldValue = [], setAssets] = useFieldValue<CloudinaryAsset[] | null>(sdk.field.id, sdk.field.locale);
  const assets = fieldValue || [];

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged((disabled) => setEditingEnabled(!disabled));
  }, [sdk.field]);

  const canAddAssets = assets.length < sdk.parameters.installation.maxFiles && editingEnabled;

  const onNewAssetsAdded = (newAssets: CloudinaryAsset[]) => {
    setAssets([...assets, ...newAssets]);
  };

  return (
    <>
      <Global styles={globalStyles} />
      <GlobalStyles />
      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets.length > 0 && (
          <Thumbnails
            assets={assets}
            onChange={(assets) => {
              if (assets.length === 0) {
                return sdk.field.removeValue();
              } else {
                return setAssets(assets);
              }
            }}
            isDisabled={!editingEnabled}
          />
        )}
        <Stack spacing="spacingM">
          <AssetPickerButton isDisabled={!canAddAssets} onNewAssetsAdded={onNewAssetsAdded} />
        </Stack>
      </Stack>
    </>
  );
};

export default Field;
