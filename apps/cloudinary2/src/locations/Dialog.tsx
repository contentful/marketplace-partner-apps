import { DialogAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { AppInstallationParameters } from '../types';
import AssetPickerDialog from './AssetPickerDialog';
import ImageEditorDialog from './ImageEditorDialog';
import { AssetId } from './types';
import VideoEditorDialog from './VideoEditorDialog';

const Dialog = () => {
  const sdk = useSDK<DialogAppSDK<AppInstallationParameters>>();
  const invocationParams = sdk.parameters.invocation as Record<string, unknown>;

  const asset = invocationParams.asset as AssetId;
  const dialog = invocationParams.dialog as string;
  if (dialog === 'medial-editor' && asset.resource_type === 'image') {
    return <ImageEditorDialog />;
  } else if (dialog === 'medial-editor' && asset.resource_type === 'video') {
    return <VideoEditorDialog />;
  } else {
    return <AssetPickerDialog />;
  }
};

export default Dialog;
