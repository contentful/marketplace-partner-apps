import { useEffect, useRef, useState, useCallback } from 'react';
import { Skeleton } from '@contentful/f36-components';
import type { DialogAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { initializeFileSelector, openFileSelector } from '../utils/FileSelector';
import { initializeTokenManager } from '../utils/TokenManager';
import type { MediaflowFileData } from '../types';

interface FileSelectorInvocation {
  selectedFileId?: string | number | null;
  selectedFolderId?: string | number | null;
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  useAutoResizer();
  const [ready, setReady] = useState(false);
  const fileSelectorRoot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initialize = async () => {
      initializeTokenManager(sdk);
      await initializeFileSelector(sdk);
      setReady(true);
    };
    initialize();
  }, [sdk]);

  const successCallback = useCallback((data: MediaflowFileData) => {
    sdk.close(data); // This closes the dialog
  }, [sdk]);

  useEffect(() => {
    const opening = async () => {
      if(ready && fileSelectorRoot.current) {
        try {
          const { selectedFileId, selectedFolderId } = sdk.parameters.invocation as FileSelectorInvocation;
          await openFileSelector(fileSelectorRoot.current, successCallback, selectedFolderId ?? null, selectedFileId ?? null);
        } catch(error) {
          sdk.notifier.error("An error occured while opening the file selector: " + (error instanceof Error ? error.message : String(error)));
          sdk.close(null);
        }
      } else if(ready) {
        sdk.notifier.error("Could not open Mediaflow file selector. Please reload the page");
      }
    }
    opening();
  }, [ready, sdk, successCallback]);

  const LoadingSkeleton = () => {
    return (
      <div style={{ padding: "5%" }} >
        <Skeleton.Container svgHeight={ window.innerHeight * 0.85 }>
          <Skeleton.Image width={ "100%" } height={ "100%" } />
        </Skeleton.Container>
      </div>
    );
  };

  return (
    <div ref={ fileSelectorRoot } id="mediaflow-file-selector-wrapper">
      <LoadingSkeleton />
    </div>
  );
};

export default Dialog;
