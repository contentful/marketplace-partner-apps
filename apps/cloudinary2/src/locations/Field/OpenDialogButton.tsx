import { Button } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/react';
import { useCallback } from 'react';
import logo from '../../assets/logo.svg';
import { CloudinaryAsset, MediaLibraryResult } from '../../types';
import { extractAsset } from '../../utils';

const styles = {
  container: css({
    display: 'flex',
  }),
  logo: css({
    display: 'block',
    width: '30px',
    height: '30px',
    marginRight: tokens.spacingM,
  }),
};

interface Props {
  onNewAssetsAdded: (assets: CloudinaryAsset[]) => void;
  isDisabled: boolean;
}

export function OpenDialogButton({ onNewAssetsAdded, isDisabled }: Props) {
  const sdk = useSDK();
  const action = sdk.parameters.installation.showUploadButton === 'true' ? 'Select or upload an asset' : 'Select an asset';
  const handleDialogOpenClick = useCallback(async () => {
    const result: MediaLibraryResult | undefined = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title: `${action} on Cloudinary`,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      width: 1400,
    });

    if (!result) {
      return;
    }

    const assetsToPersist = result.assets.map(extractAsset);
    onNewAssetsAdded(assetsToPersist);
  }, [onNewAssetsAdded, sdk.dialogs]);

  return (
    <div css={styles.container}>
      <img src={logo} alt="Logo" css={styles.logo} />
      <Button startIcon={<AssetIcon />} variant="secondary" size="small" onClick={handleDialogOpenClick} isDisabled={isDisabled}>
        {action}
      </Button>
    </div>
  );
}
