import { DialogAppSDK } from '@contentful/app-sdk';
import { Button, Stack } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { useCallback, useRef, useState } from 'react';
import { AppInstallationParameters, CloudinaryAsset } from '../types';
import { createEditedAsset, getDeliveryHostname, getEditorTransformation, loadScript } from '../utils';
import { MediaEditorWidget } from './types';

const styles = {
  container: css({
    height: '100%',
  }),
  widget: css({
    height: 'calc(100% - 64px)',
  }),
};

const VideoEditorDialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const editorRef = useRef<MediaEditorWidget>(undefined);
  const invocationParams = sdk.parameters.invocation as Record<string, unknown>;
  const asset = invocationParams.asset as CloudinaryAsset;

  /**
   * Initialization is triggered using the div's ref to ensure the container exists in the DOM
   */
  const init = useCallback(
    (container: HTMLDivElement) => {
      (async () => {
        await loadScript('https://media-editor.cloudinary.com/latest/all.js');
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
        sdk.window.updateHeight(window.outerHeight);
        editorRef.current = editorRef.current || window.cloudinary.mediaEditor({ appendTo: document.getElementById(container.id) });

        const configurationParams = sdk.parameters.installation;
        const existingTransformation = getEditorTransformation(asset);
        const deliveryHostname = getDeliveryHostname(asset.secure_url ?? asset.url);
        // allow local instances of the dialog to override the configuration maxFiles parameter
        editorRef.current.update({
          video: {
            ...(existingTransformation
              ? {
                  transformation: [{ rawTransformation: existingTransformation }],
                }
              : {}),
            steps: ['trim'],
          },

          cloudName: configurationParams.cloudName,
          ...(deliveryHostname ? { secureDistribution: deliveryHostname, cname: deliveryHostname, privateCdn: true } : {}),
          publicIds: [
            {
              publicId: asset.public_id,
              type: asset.type,
              resourceType: asset.resource_type,
            },
          ],
          mode: 'inline',
        });

        editorRef.current.show();
        setWidgetLoaded(true);
        editorRef.current.on('export', function (data) {
          const newAsset = createEditedAsset(asset, configurationParams, data.transformation);
          sdk.close({ assets: [newAsset] });
        });
      })();
    },
    [sdk],
  );

  return (
    <div css={styles.container} id="container">
      <div id="widget" ref={init} css={styles.widget} />
      {widgetLoaded && (
        <Stack justifyContent="flex-end" padding="spacingS">
          <Button
            onClick={() => {
              editorRef.current?.triggerExport();
            }}>
            Update
          </Button>
        </Stack>
      )}
    </div>
  );
};

export default VideoEditorDialog;
