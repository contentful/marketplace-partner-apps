import { Button } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback } from 'react';
import { CloudinaryAsset, MLResult } from '../../types';
import { extractAsset } from '../../utils';
import logo from '../../assets/logo.svg';

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
  const handleDialogOpenClick = useCallback(async () => {
    const result: MLResult | undefined = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title: 'Select or upload a file on Cloudinary',
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
    <div className={styles.container}>
      <img src={logo} alt="Logo" className={styles.logo} />
      <Button startIcon={<AssetIcon />} variant="secondary" size="small" onClick={handleDialogOpenClick} isDisabled={isDisabled}>
        Select or upload a file on Cloudinary
      </Button>
    </div>
  );
}
