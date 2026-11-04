import { useState } from 'react';
import { Button } from '@contentful/f36-components';
import type { SidebarAppSDK } from '@contentful/app-sdk';
import { useAutoResizer, useSDK } from '@contentful/react-apps-toolkit';
import { batchUpdateMetadata, describeMetadataUpdate } from '../utils/Util';
import type { UpdatableField } from '../utils/Util';
import { describeMediaflowError } from '../utils/MediaflowApi';

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  const [isUpdating, setIsUpdating] = useState(false);

  const updateMetadataForAllFields = async () => {
    const fieldsToUpdate: UpdatableField[] = [];
    const controls = sdk.editor.editorInterface.controls ?? [];
    for(let i = 0; i < controls.length; i++) {
      const control = controls[i]; // The controls corresponding to each field
      if(control.widgetId === sdk.ids.app) {
        const field = sdk.entry.fields[control.fieldId];
        fieldsToUpdate.push(field);
      }
    }

    setIsUpdating(true);
    try {
      const result = await batchUpdateMetadata(sdk, fieldsToUpdate);
      const message = describeMetadataUpdate(result);
      if(result.missing || result.failed) {
        sdk.notifier.warning(message);
      } else {
        sdk.notifier.success(message);
      }
    } catch(error) {
      console.error("[ERROR] an error occured during the batch update of the metadata: ", error);
      sdk.notifier.error(describeMediaflowError(error, "update the Mediaflow fields"));
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button variant="primary" isFullWidth isLoading={isUpdating} isDisabled={isUpdating} onClick={() => { updateMetadataForAllFields(); }}>
      Update Metadata for all fields
    </Button>
  );
};

export default Sidebar;
