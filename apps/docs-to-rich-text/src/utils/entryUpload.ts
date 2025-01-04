import { BaseAppSDK } from '@contentful/app-sdk';
import { getLocaleCode } from './contentfulUtils';

export async function CreateImageWrapperEntry(sdk: BaseAppSDK, assetId: string, assetName: string, id: string) {
  const locale = await getLocaleCode(sdk);

  const contentModel = await sdk.cma.contentType.get({
    contentTypeId: sdk.parameters.installation.imageWrapperTypeId,
  });

  const imageFieldId = contentModel.fields.find((f) => f.type === 'Link' && f.linkType === 'Asset')?.id;

  if (!imageFieldId) {
    throw new Error('Image field not found in content type');
  }

  const displayFieldId = contentModel.displayField;

  const displayField = displayFieldId
    ? {
        [displayFieldId]: {
          [locale]: assetName,
        },
      }
    : {};

  const imageField = {
    [imageFieldId]: {
      [locale]: {
        sys: {
          id: assetId,
          type: 'Link',
          linkType: 'Asset',
        },
      },
    },
  };

  let fields = {};
  if (displayFieldId) {
    fields = { ...displayField, ...imageField };
  } else {
    fields = { ...imageField };
  }

  const entry = await sdk.cma.entry.createWithId(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
      contentTypeId: sdk.parameters.installation.imageWrapperTypeId,
      entryId: id,
    },
    {
      fields: fields,
    },
  );

  return entry;
}
