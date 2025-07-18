import { Button } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCallback } from 'react';
import { ImageKitAsset } from '../../types';
import { DEFAULT_INTEGRATION_PARAMETERS, DIALOG_TITLE } from '../../constants';
import { buildSrc, Transformation } from '@imagekit/react';

interface Props {
  onNewAssetsAdded: (assets: ImageKitAsset[]) => void;
  isDisabled: boolean;
}

export function OpenDialogButton({ onNewAssetsAdded, isDisabled }: Props) {
  const sdk = useSDK();
  const handleDialogOpenClick = useCallback(async () => {
    const result = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title: DIALOG_TITLE,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      width: 1400,
    });

    if (!result) {
      return;
    }

    const defaultTransformation = sdk.parameters.installation.defaultTransformation;
    const transformation: Transformation[] = defaultTransformation ? [{ raw: defaultTransformation }] : [];

    if (sdk.parameters.installation.mediaQuality !== 'auto') {
      transformation.push({
        quality: sdk.parameters.installation.mediaQuality,
      });
    }

    // Tranform the assets based on the parameters
    // set in the configuration screen
    const transformedAssets = result.map((asset: ImageKitAsset) => {
      // Only transform images
      if (asset.fileType === 'image') {
        return {
          ...asset,
          imagekitId: new URL(asset.url)?.pathname?.split('/')?.[1],
          url: buildSrc({
            src: asset.url,
            urlEndpoint: '',
            transformation,
          }),
        };
      }

      return asset;
    });

    onNewAssetsAdded(transformedAssets);
  }, [onNewAssetsAdded, sdk.dialogs]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
    }}>
      <img src={DEFAULT_INTEGRATION_PARAMETERS.logo} alt="Logo"
        style={{
          display: 'block',
          width: '30px',
          height: '30px',
          marginRight: tokens.spacingM,
      }} />
      
      <Button startIcon={<AssetIcon />} variant="secondary" size="small" onClick={handleDialogOpenClick} isDisabled={isDisabled}>
        {DEFAULT_INTEGRATION_PARAMETERS.cta}
      </Button>
    </div>
  );
}
