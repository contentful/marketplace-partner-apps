import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { css, injectGlobal } from 'emotion';
import { useCallback } from 'react';
import { AppInstallationParameters, MLResult } from '../types';
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
}

interface MediaLibraryInstance {
  show: (options?: ShowOptions) => void;
}

interface ShowOptions {
  folder?: {
    path: string;
  };
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
          insertHandler: (data: MLResult) => void;
        }
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

        const params = sdk.parameters.installation;
        const transformations = [];

        // Handle format
        if (params.format !== 'none') {
          transformations.push({ fetch_format: params.format });
        }

        // Handle quality
        if (params.quality !== 'none') {
          transformations.push({ quality: params.quality });
        }

        const options = {
          cloud_name: params.cloudName,
          api_key: params.apiKey,
          max_files: params.maxFiles,
          multiple: params.maxFiles > 1,
          // if we pass `container` instead of the id, the media library would render without iframe
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
        };

        const instance = window.cloudinary.createMediaLibrary(options, {
          insertHandler: (data) => sdk.close(data),
        });

        const showOptions: ShowOptions = {};
        if (typeof params.startFolder === 'string' && params.startFolder.length) {
          showOptions.folder = { path: params.startFolder };
        }
        instance.show(showOptions);

        sdk.window.updateHeight(window.outerHeight);
      })();
    },
    [sdk]
  );

  return <div ref={init} id="container" className={styles.container} />;
};

export default Dialog;
