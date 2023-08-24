import { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import * as LR from '@uploadcare/blocks';
import { css } from 'emotion';
import { ReactElement, useEffect, useMemo, useRef } from 'react';
import { objectKeys } from 'ts-extras';
import { AppInstallationParameters, Asset } from '../types';

LR.registerBlocks(LR);

const styles = {
  container: css({
    height: '100%',
  }),
};

export default function Dialog(): ReactElement {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  useAutoResizer();

  const params = sdk.parameters.installation;

  const assetsRef = useRef<Asset[]>([]);

  useEffect(() => {
    const handleUploadEvent = (e: CustomEvent<{ data: Asset[] }>) => {
      if (e.detail?.data) {
        assetsRef.current = e.detail.data;
      }
    };

    const handleDoneEvent = () => {
      sdk.close(assetsRef.current);
    };

    window.addEventListener('LR_DATA_OUTPUT', handleUploadEvent);
    window.addEventListener('LR_DONE_FLOW', handleDoneEvent);

    return () => {
      window.removeEventListener('LR_DATA_OUTPUT', handleUploadEvent);
      window.removeEventListener('LR_DONE_FLOW', handleDoneEvent);
    };
  }, []);

  const sourceList = useMemo(() => {
    return objectKeys(params.uploadSources)
      .filter(k => k in params.uploadSources && params.uploadSources[k])
      .join(', ');
  }, [params.uploadSources]);

  return (
    <div className={styles.container}>
      <lr-config
        ctx-name="uploadcare"
        pubkey={params.apiKey}
        multiple={params.maxFiles !== 1}
        multipleMax={params.maxFiles !== 0 ? params.maxFiles : undefined}
        sourceList={sourceList}
      />

      <lr-file-uploader-inline
        css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${LR.PACKAGE_VERSION}/web/lr-file-uploader-inline.min.css`}
        ctx-name="uploadcare"
      />
    </div>
  );
}
