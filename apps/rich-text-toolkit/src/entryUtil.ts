import { BaseAppSDK } from '@contentful/app-sdk';

export async function CreateImageWrapperEntry(sdk: BaseAppSDK, spaceId: string, environmentId: string, assetId: string, imageUrl: string, id: string) {
  const locales = await sdk.cma.locale.getMany({ spaceId, environmentId });
  const locale = locales.items.find((l) => l.default)!.code;
  const fileName = imageUrl.split('/').pop();
  const name = fileName?.split('.')[0] ?? '';

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
          [locale]: name,
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
      spaceId: spaceId,
      environmentId: environmentId,
      contentTypeId: sdk.parameters.installation.imageWrapperTypeId,
      entryId: id,
    },
    {
      fields: fields,
    },
  );

  return entry;
}
