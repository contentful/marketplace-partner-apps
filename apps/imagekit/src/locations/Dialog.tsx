import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { useEffect, useMemo } from 'react';
import { FileTypeValue, ImagekitMediaLibraryWidget, MediaLibraryWidgetOptions, MLSettings } from 'imagekit-media-library-widget';
import { DEFAULT_ML_WIDGET_OPTIONS } from '../constants';
import { ImageKitAsset } from '../types';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const installationConfig: MLSettings = useMemo(() => {
    let collectionId: { id?: string } | undefined = undefined;

    if (sdk.parameters.installation.collectionId) {
      if (sdk.parameters.installation.collectionId.toLowerCase().trim() === 'all') {
        collectionId = {};
      } else {
        collectionId = { id: sdk.parameters.installation.collectionId };
      }
    }
    
    return {
      multiple: sdk.parameters.installation.allowMultipleSelections,
      maxFiles: sdk.parameters.installation.maxFileSelections ? parseInt(sdk.parameters.installation.maxFileSelections) : undefined,
      initialView: {
        searchQuery: sdk.parameters.installation.searchQuery || '',
        folderPath: sdk.parameters.installation.folderPath || '/',
        collection: collectionId,
        fileType: sdk.parameters.installation.fileType ? sdk.parameters.installation.fileType as FileTypeValue : undefined,
      }
    };
  }, [sdk]);

  useEffect(() => {
    // style `body`
    injectGlobal({
      'html, body, #root': {
        padding: 0,
        margin: 0,
        border: 0,
        height: '100%',
        overflow: 'hidden',
      },
    });

    // Merge the installation config with the default config
    const config: MediaLibraryWidgetOptions = {
      ...DEFAULT_ML_WIDGET_OPTIONS,
      mlSettings: {
        ...DEFAULT_ML_WIDGET_OPTIONS.mlSettings,
        ...installationConfig,
      },
    };

    const callback = (payload: { eventType: string, data: ImageKitAsset[] }) => {
      if (payload.eventType === 'INSERT' && payload.data && payload.data.length > 0) {
        sdk.close(payload.data);
      }
    };
  

    const widget = new ImagekitMediaLibraryWidget(config, callback);
    widget.open();

    sdk.window.updateHeight(window.outerHeight);

    return () => {
      widget.destroy();
    };
  }, [sdk]);

  return <div id="imagekit-container" style={{ width: '100%', height: '100%' }} />;
};

export default Dialog;
