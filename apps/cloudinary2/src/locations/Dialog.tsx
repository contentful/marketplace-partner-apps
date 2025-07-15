import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { useCallback } from 'react';
import { APP_ENV, APP_VERSION } from '../constants';
import { AppInstallationParameters, MediaLibraryResult } from '../types';
import { loadScript } from '../utils';

const styles = {
  container: css({
    height: '100%',
  }),
};

interface MediaLibraryOptions {
  cloud_name: string;
  api_key: string;
  max_files: number;
  multiple: boolean;
  inline_container: string | HTMLElement;
  remove_header: boolean;
  default_transformations: unknown[];
  integration: {
    platform: string;
    type: string;
    version: string;
    environment: string;
  };
}

interface MediaLibraryInstance {
  show: (options?: ShowOptions) => void;
}

interface AssetId {
  resource_type: string;
  type: string;
  public_id: string;
}

interface ShowOptions {
  folder?: {
    path: string;
  };
  asset?: AssetId;
  remove_upload_operation?: boolean;
}

declare global {
  interface Window {
    cloudinary: {
      /** Incomplete types */
      openMediaLibrary: VoidFunction;

      /** Incomplete types */
      createMediaLibrary: (
        options: MediaLibraryOptions,
        callbacks: {
          insertHandler: (data: MediaLibraryResult) => void;
        },
      ) => MediaLibraryInstance;
    };
  }
}

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();

  /**
   * Initialization is triggered using the div's ref to ensure the container exists in the DOM
   */
  const init = useCallback(
    (container: HTMLDivElement) => {
      (async () => {
        // clear container
        container.innerHTML = '';

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

        await loadScript('https://media-library.cloudinary.com/global/all.js');

        const configurationParams = sdk.parameters.installation;
        const invocationParams = sdk.parameters.invocation as Record<string, unknown>;
        // allow local instances of the dialog to override the configuration maxFiles parameter
        const maxFiles = 'maxFiles' in invocationParams ? Number(invocationParams.maxFiles) : configurationParams.maxFiles;
        const transformations = [];

        // Handle format
        if (configurationParams.format !== 'none') {
          transformations.push({ fetch_format: configurationParams.format });
        }

        // Handle quality
        if (configurationParams.quality !== 'none') {
          transformations.push({ quality: configurationParams.quality });
        }

        const asset = invocationParams.asset as AssetId;

        const options = {
          cloud_name: configurationParams.cloudName,
          api_key: configurationParams.apiKey,
          max_files: maxFiles,
          multiple: maxFiles > 1,
          // if we pass `container` instead of the id, the media library would render without iframe
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
          asset,
          integration: {
            platform: 'contentful',
            type: 'contentful',
            version: APP_VERSION,
            environment: APP_ENV,
          },
        };

        const instance = window.cloudinary.createMediaLibrary(options, {
          insertHandler: (data) => sdk.close(data),
        });

        const showOptions: ShowOptions = {
          remove_upload_operation: configurationParams.showUploadButton === 'false',
        };
        if (typeof configurationParams.startFolder === 'string' && configurationParams.startFolder.length) {
          showOptions.folder = { path: configurationParams.startFolder };
        }
        instance.show(showOptions);

        sdk.window.updateHeight(window.outerHeight);
      })();
    },
    [sdk],
  );

  return <div ref={init} id="container" css={styles.container} />;
};

export default Dialog;
