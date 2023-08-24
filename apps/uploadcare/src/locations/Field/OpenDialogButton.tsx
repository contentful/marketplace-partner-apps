import { FieldAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from 'emotion';
import { useCallback } from 'react';
import logo from '../../assets/logo.svg';
import { AppInstallationParameters, Asset } from '../../types';

const styles = {
  container: css({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  }),
  logo: css({
    width: '28px',
    height: '28px',
  }),
};

type Props = {
  onAssetsChanged: (newAssets: Asset[] | undefined) => Promise<void>;
  isDisabled: boolean;
};

export function OpenDialogButton({ onAssetsChanged, isDisabled }: Props) {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters>>();

  const params = sdk.parameters.installation;

  const title = `Upload ${params.maxFiles !== '1' ? 'images' : 'image'} to Uploadcare`;

  const handleDialogOpen = useCallback(async () => {
    const result: Asset[] | undefined = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      width: 800,
    });

    await onAssetsChanged(result);
  }, [onAssetsChanged, sdk.dialogs]);

  return (
    <div className={styles.container}>
      <img className={styles.logo} src={logo} alt="" />

      <Button
        startIcon={<AssetIcon variant="secondary" size="small" />}
        variant="secondary"
        size="small"
        onClick={handleDialogOpen}
        isDisabled={isDisabled}
      >
        {title}
      </Button>
    </div>
  );
}
