import React, { useEffect, useState } from 'react';

import type { FieldAppSDK } from '@contentful/app-sdk';
import { EntryCard, MenuItem, TextLink } from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { useSDK } from '@contentful/react-apps-toolkit';
import type { Image } from '@/lib/types';

function Field() {
  const [fieldValue, setFieldValue] = useState<Image[] | undefined>();
  const sdk = useSDK<FieldAppSDK>();

  // Autoresize the field to the height of the content
  useEffect(() => {
    sdk.window.startAutoResizer();
  }, [sdk.window]);

  useEffect(() => {
    const ctfFieldValue: Image[] = sdk.field.getValue();
    setFieldValue(ctfFieldValue);
  }, [sdk.field]);

  /**
   * Open the dialog to select a image from Raster.
   */
  const openDialog = async () => {
    const image = await sdk.dialogs.openCurrentApp({
      position: 'center',
      title: 'Select an image from Raster',
      shouldCloseOnOverlayClick: true,
      width: 'fullWidth',
      minHeight: '100vh',

      // Passing parameters to the dialog
      ...(fieldValue?.length && {
        parameters: {
          currentValue: fieldValue,
        },
      }),
    });

    // Do something with the selected image
    // that was passed back from the dialog

    if (image) {
      setFieldValue(image);
      await sdk.field.setValue(image);
    }
  };

  const removeImage = async () => {
    await sdk.field.removeValue();
    setFieldValue(undefined);
  };

  return (
    <div className="grid gap-2">
      {fieldValue?.length ? (
        <>
          {fieldValue.map((entry) => (
            <EntryCard
              actions={[
                <MenuItem
                  key="delete-image"
                  onClick={() => {
                    const newValue = fieldValue.filter((image) => image.id !== entry.id);
                    setFieldValue(newValue.length ? newValue : undefined);
                    if (newValue.length) {
                      return sdk.field.setValue(newValue);
                    }
                    return sdk.field.removeValue();
                  }}>
                  Delete Image
                </MenuItem>,
                fieldValue.length > 1 ? (
                  <MenuItem key="delete-all" onClick={() => removeImage()}>
                    Delete All
                  </MenuItem>
                ) : undefined,
              ]}
              contentType="Image"
              title={entry.name}
              description={entry.description ? entry.description : 'Description not available, but can be generated with our AI tool in Raster.'}
              thumbnailElement={
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={entry.description} src={entry.thumbUrl} />
              }
              onClick={() => openDialog()}
            />
          ))}

          <TextLink as="button" icon={<PlusIcon />} alignIcon="start" className="!text-primary !font-bold !mt-2.5 !w-fit !mx-auto" onClick={() => openDialog()}>
            Add more images
          </TextLink>
        </>
      ) : (
        <TextLink as="button" icon={<PlusIcon />} alignIcon="start" className="!text-primary !font-bold !w-fit !mx-auto" onClick={() => openDialog()}>
          Add Raster images
        </TextLink>
      )}
    </div>
  );
}

export default Field;
