import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { useEffect, useState } from 'react';
import { OpenDialogButton } from './OpenDialogButton';
import { Thumbnails } from './Thumbnails';
import { css, Global } from '@emotion/react';
import { ImageKitAsset } from '../../types';

const globalStyles = css`
  html {
    width: 100vw;
    overflow-x: hidden;
  }
`;

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  useAutoResizer({ absoluteElements: true });

  const [fieldValue = [], setAssets] = useFieldValue<ImageKitAsset[] | null>(sdk.field.id, sdk.field.locale);
  const assets = fieldValue || [];

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged((disabled) => setEditingEnabled(!disabled));
  }, [sdk.field]);

  return (
    <>
      <Global styles={globalStyles} />
      <GlobalStyles />
      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets.length > 0 && <Thumbnails assets={assets} onChange={(asset) => {
          if (asset.length === 0) {
            return sdk.field.removeValue()
          } else {
            return setAssets(asset)
          }
          
        }} isDisabled={!editingEnabled} />}
        <OpenDialogButton isDisabled={false} onNewAssetsAdded={(newAssets) => setAssets([...assets, ...newAssets])} />
      </Stack>
    </>
  );
};

export default Field;
