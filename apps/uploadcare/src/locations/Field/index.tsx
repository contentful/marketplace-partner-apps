import { FieldAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Stack } from '@contentful/f36-components';
import { useAutoResizer, useFieldValue, useSDK } from '@contentful/react-apps-toolkit';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { objectKeys } from 'ts-extras';
import { AppInstallationParameters, Asset, InstanceParameters } from '../../types';
import { OpenDialogButton } from './OpenDialogButton';
import { Thumbnails } from './Thumbnails';

export default function Field(): ReactElement {
  const sdk = useSDK<FieldAppSDK<AppInstallationParameters, InstanceParameters>>();
  useAutoResizer();

  const [assets = [], setAssets] = useFieldValue<Asset[]>();

  const [editingEnabled, setEditingEnabled] = useState(!sdk.field.getIsDisabled());
  useEffect(() => {
    sdk.field.onIsDisabledChanged(disabled => setEditingEnabled(!disabled));
  }, [sdk.field]);

  const handleAssetsChanged = useCallback(
    async (newAssets: Asset[] | undefined) => {
      if (!newAssets) return;

      await setAssets([...assets, ...newAssets]);
    },
    [assets],
  );

  const installParams = sdk.parameters.installation;
  const instanceParams = sdk.parameters.instance;

  const maxFilesParam =
    typeof instanceParams.maxFiles !== 'undefined' ? instanceParams.maxFiles : installParams.maxFiles;
  const isFileNumberLimited = maxFilesParam !== 0;
  const canAddMoreFiles = !isFileNumberLimited || assets.length < maxFilesParam;
  const maxFiles = !isFileNumberLimited ? 0 : Math.max(0, maxFilesParam - assets.length);

  const uploadSourcesString = useMemo(() => {
    return instanceParams.uploadSourcesString
      ? instanceParams.uploadSourcesString
      : objectKeys(installParams.uploadSources)
          .filter(k => k in installParams.uploadSources && installParams.uploadSources[k])
          .join(', ');
  }, [installParams.uploadSources, instanceParams.uploadSourcesString]);

  const imgOnly =
    instanceParams.imgOnly !== 'useGlobalAppSetting' ? instanceParams.imgOnly === 'allowImagesOnly' : installParams.imgOnly;

  return (
    <>
      <GlobalStyles />

      <Stack spacing="spacingM" flexDirection="column" alignItems="flex-start">
        {assets.length > 0 && <Thumbnails assets={assets} onChange={setAssets} isDisabled={!editingEnabled} />}

        <OpenDialogButton
          onAssetsChanged={handleAssetsChanged}
          isDisabled={!editingEnabled || !canAddMoreFiles}
          maxFiles={maxFiles}
          uploadSourcesString={uploadSourcesString}
          imgOnly={imgOnly}
        />
      </Stack>
    </>
  );
}
