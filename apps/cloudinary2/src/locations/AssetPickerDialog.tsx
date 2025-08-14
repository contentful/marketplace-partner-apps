import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { useCallback } from 'react';
import { APP_ENV, APP_VERSION } from '../constants';
import { AppInstallationParameters } from '../types';
import { loadScript } from '../utils';
import { ShowOptions } from './types';

const styles = {
  container: css({
    height: '100%',
  }),
};

const AssetPickerDialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const invocationParams = sdk.parameters.invocation as Record<string, unknown>;

  const filter = invocationParams.filter as string;

  /**
   * Initialization is triggered using the div's ref to ensure the container exists in the DOM
   */
  const init = useCallback(
    (container: HTMLDivElement) => {
      (async () => {
        await loadScript('https://media-library.cloudinary.com/global/all.js');
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

        const configurationParams = sdk.parameters.installation;
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
        sdk.window.updateHeight(window.outerHeight);
        const expression = filter ? { expression: `resource_type:${filter}` } : undefined;
        const options = {
          cloud_name: configurationParams.cloudName,
          api_key: configurationParams.apiKey,
          max_files: maxFiles,
          multiple: maxFiles > 1,
          // if we pass `container` instead of the id, the media library would render without iframe
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
          search: expression,

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
      })();
    },
    [sdk],
  );

  return <div ref={init} id="container" css={styles.container} />;
};

export default AssetPickerDialog;
