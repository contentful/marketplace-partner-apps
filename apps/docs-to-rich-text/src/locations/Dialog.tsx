import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { renderRichTextDialog } from '@contentful/field-editor-rich-text';
import { useEffect } from 'react';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK>();

  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk]);

  return renderRichTextDialog(sdk as DialogAppSDK);
};

export default Dialog;
