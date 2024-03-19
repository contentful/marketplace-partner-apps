import { FieldAppSDK } from '@contentful/app-sdk';
import { Button } from '@contentful/f36-components';
import { AssetIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css } from '@emotion/css';
import { useCallback } from 'react';
import logo from '../../assets/logo.svg';
import { Asset, InstallParams } from '../../types';

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
  maxFiles: number;
  uploadSourcesString: string;
  imgOnly: boolean;
};

export function OpenDialogButton({ onAssetsChanged, isDisabled, maxFiles, uploadSourcesString, imgOnly }: Props) {
  const sdk = useSDK<FieldAppSDK<InstallParams>>();

  const fileTypeName = imgOnly ? 'image' : 'file';
  const title = `Upload ${fileTypeName}${maxFiles !== 1 ? 's' : ''} to Uploadcare`;

  const handleDialogOpen = useCallback(async () => {
    const result: Asset[] | undefined = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title,
      shouldCloseOnOverlayClick: true,
      shouldCloseOnEscapePress: true,
      width: 'fullWidth',
      // there is no way for us to figure out the user's browser window height
      // but Uploadcare File Uploader expects to know it
      // so to make it work we're setting dialog's height to the max possible
      // -200px is just an assumption that all the Contentful UI related to dialogs (e.g. headline, cross button, etc)
      // will fit in 200px
      minHeight: 'calc(100vh - 200px)',
      parameters: {
        maxFiles,
        uploadSourcesString,
        imgOnly,
      },
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
