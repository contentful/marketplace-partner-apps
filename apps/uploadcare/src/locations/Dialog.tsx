import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import * as LR from '@uploadcare/blocks';
import { css } from '@emotion/css';
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
  const ctxProviderRef = useRef<InstanceType<LR.UploadCtxProvider>>(null);

  useEffect(() => {
    const ctxProvider = ctxProviderRef.current;
    if (!ctxProvider) return;

    const handleChangeEvent = (e: LR.EventMap['change']) => {
      assetsRef.current = [...e.detail.allEntries.filter(f => f.status === 'success')] as LR.OutputFileEntry<'success'>[];
    };

    const handleDoneClickEvent = () => {
      sdk.close(assetsRef.current);
    };

    ctxProvider.addEventListener('change', handleChangeEvent);
    ctxProvider.addEventListener('done-click', handleDoneClickEvent);

    return () => {
      ctxProvider.removeEventListener('change', handleChangeEvent);
      ctxProvider.removeEventListener('done-click', handleDoneClickEvent);
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
        ctx-name="uploadcare"
        css-src={`https://cdn.jsdelivr.net/npm/@uploadcare/blocks@${LR.PACKAGE_VERSION}/web/lr-file-uploader-inline.min.css`}
      />

      <lr-upload-ctx-provider
        ctx-name="uploadcare"
        ref={ctxProviderRef}
      />
    </div>
  );
}
