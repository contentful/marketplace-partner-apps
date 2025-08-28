import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { injectGlobal } from '@emotion/css';
import { css } from '@emotion/react';
import { useCallback, useRef } from 'react';
import { AppInstallationParameters, CloudinaryAsset } from '../types';
import { loadScript } from '../utils';
import { MediaEditorWidget } from './types';

const styles = {
  container: css({
    height: '100%',
  }),
  widget: css({
    height: '100%',
  }),
};

const ImageEditorDialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const editorRef = useRef<MediaEditorWidget>();
  const installationParams = sdk.parameters.installation;
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

        // samples/logo,samples/man-portrait
        const steps = ['resizeAndCrop'];
        const overlays = installationParams.imageEditorOverlays.map((pid) => {
          return {
            publicId: pid,
            label: pid,
            transformation: [],
            placementOptions: ['top_left', 'top_right', 'bottom_left', 'bottom_right'],
          };
        });

        if (overlays.length > 0) {
          steps.push('imageOverlay');
        }
        steps.push('textOverlays');

        // allow local instances of the dialog to override the configuration maxFiles parameter
        editorRef.current.update({
          layoutStyle: 'single',
          layout: 'tabs',
          image: {
            transformation: [{ rawTransformation: asset.original_raw_transformation }],
            steps,
            resizeAndCrop: {
              toggleAspectRatio: true,
              aspectRatioLock: true,
              flip: true,
              rotate: true,
              presets: [
                'original',
                'square',
                'landscape-16:9',
                'landscape-4:3',
                'portrait-3:4',
                'portrait-9:16',
                {
                  label: 'Facebook',
                  width: 1200,
                  height: 600,
                },
              ],
            },
            imageOverlay: {
              overlays,
            },
            textOverlays: {
              presets: ['heading', 'subtitle', 'body', 'caption'],
            },
          },
          language: {
            locale: 'en_US',
            messages: {
              en_US: {
                footer: {
                  export: 'Update',
                },
              },
            },
          },
          cloudName: configurationParams.cloudName,
          publicIds: [asset.public_id],
          mode: 'inline',
        });

        editorRef.current.show();
        editorRef.current.on('export', function (data) {
          const newAsset = { ...asset, ...{ raw_transformation: data.transformation, secure_url: data.assets[0].url } };
          sdk.close({ assets: [newAsset] });
        });
      })();
    },
    [sdk],
  );

  return (
    <div css={styles.container} id="container">
      <div id="widget" ref={init} css={styles.widget} />
    </div>
  );
};

export default ImageEditorDialog;
