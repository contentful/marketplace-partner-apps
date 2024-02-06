import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import * as LR from '@uploadcare/blocks';
import { css } from 'emotion';
import { ReactElement, useEffect, useRef } from 'react';
import { Asset, InstallParams } from '../types';

LR.registerBlocks(LR);

const styles = {
  container: css({
    height: '100vh',
  }),
};

type InvocationParams = {
  maxFiles: number;
  uploadSourcesString: string;
  imgOnly: boolean;
};

export default function Dialog(): ReactElement {
  const sdk = useSDK<DialogAppSDK<InstallParams, InvocationParams>>();

  const assetsRef = useRef<Asset[]>([]);

  useEffect(() => {
    const handleUploadEvent = (event: Event) => {
      // see https://github.com/uploadcare/blocks/blob/69105e4806e9ca2d4254bce297c48e0990663212/abstract/UploaderBlock.js#L420-L435
      const e = event as CustomEvent<{ data: Asset[] }>

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

  const { installation: installParams, invocation: invokeParams } = sdk.parameters;

  return (
    <div className={styles.container}>
      <lr-config
        ctx-name="uploadcare"
        pubkey={installParams.apiKey}
        multiple={invokeParams.maxFiles !== 1}
        multipleMax={invokeParams.maxFiles !== 0 ? invokeParams.maxFiles : undefined}
        sourceList={invokeParams.uploadSourcesString}
        imgOnly={invokeParams.imgOnly}
        cdnCname={installParams.customCname || undefined}
      />

      <lr-file-uploader-inline
        css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${LR.PACKAGE_VERSION}/web/lr-file-uploader-inline.min.css`}
        ctx-name="uploadcare"
      />
    </div>
  );
}
