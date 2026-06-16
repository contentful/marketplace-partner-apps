import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { Button } from '@contentful/f36-components';
import { useCallback, useRef, useState } from 'react';
import { APP_ENV, APP_VERSION } from '../constants';
import { AppInstallationParameters, MediaLibraryResultAsset } from '../types';
import { loadScript } from '../utils';
import { ShowOptions } from './types';

const styles = {
  container: css({
    height: '100%',
  }),
  doneBar: css({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '8px',
    padding: '12px 16px',
    background: 'white',
    borderTop: '1px solid #e5ebed',
    zIndex: 10,
  }),
  doneLabel: css({
    fontSize: '14px',
    color: '#536171',
  }),
};

const AssetPickerDialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const invocationParams = sdk.parameters.invocation as Record<string, unknown>;
  const expression = invocationParams.expression as string;
  const [pendingAssets, setPendingAssets] = useState<MediaLibraryResultAsset[]>([]);
  const pendingRef = useRef<MediaLibraryResultAsset[]>([]);

  const handleDone = useCallback(() => {
    sdk.close(pendingRef.current.length > 0 ? { assets: pendingRef.current, mlId: '' } : undefined);
  }, [sdk]);

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
        const options = {
          cloud_name: configurationParams.cloudName,
          api_key: configurationParams.apiKey,
          max_files: maxFiles,
          multiple: maxFiles > 1,
          // if we pass `container` instead of the id, the media library would render without iframe
          inline_container: `#${container.id}`,
          remove_header: true,
          default_transformations: [transformations],
          search: { expression },

          integration: {
            platform: 'contentful',
            type: 'contentful',
            version: APP_VERSION,
            environment: APP_ENV,
          },
        };

        const instance = window.cloudinary.createMediaLibrary(options, {
          insertHandler: (data) => {
            if (maxFiles <= 1) {
              // Single-asset field: close immediately (original behavior)
              sdk.close(data);
            } else {
              // Multi-asset field: accumulate and keep widget open
              const next = [...pendingRef.current, ...data.assets];
              pendingRef.current = next;
              setPendingAssets([...next]);
            }
          },
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
    [sdk, invocationParams, expression],
  );

  const maxFiles = 'maxFiles' in invocationParams ? Number(invocationParams.maxFiles) : sdk.parameters.installation.maxFiles;
  const isMulti = maxFiles > 1;

  return (
    <>
      <div ref={init} id="container" css={styles.container} />
      {isMulti && (
        <div css={styles.doneBar}>
          {pendingAssets.length > 0 && (
            <span css={styles.doneLabel}>{pendingAssets.length} selected</span>
          )}
          <Button variant="secondary" size="small" onClick={() => sdk.close(undefined)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            isDisabled={pendingAssets.length === 0}
            onClick={handleDone}
          >
            Add to field {pendingAssets.length > 0 ? `(${pendingAssets.length})` : ''}
          </Button>
        </div>
      )}
    </>
  );
};

export default AssetPickerDialog;
