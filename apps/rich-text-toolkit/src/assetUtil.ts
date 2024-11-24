import { CMAClient } from '@contentful/app-sdk';

export async function uploadImageFromUrl(cma: CMAClient, spaceId: string, environmentId: string, imageUrl: string, imgAlt: string, id: string) {
  if (imageUrl.includes('googleusercontent')) {
    imageUrl = imageUrl + '&cache-bust';
  }

  const response = await fetch(imageUrl, {
    method: 'GET',
    headers: {
      accept: '*/*',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch image from URL');
  }

  const locales = await cma.locale.getMany({ spaceId, environmentId });
  const locale = locales.items.find((l) => l.default)!.code;
  const fileName = imageUrl.split('/').pop() ?? '';
  const name = fileName?.split('.')[0] ?? '';
  const mimeType = response.headers.get('content-type') ?? '';

  let asset = await cma.asset.createWithId(
    {
      spaceId: spaceId,
      environmentId: environmentId,
      assetId: id,
    },
    {
      fields: {
        title: {
          [locale]: name,
        },
        description: {
          [locale]: imgAlt,
        },
        file: {
          [locale]: {
            contentType: mimeType,
            fileName: fileName,
            upload: imageUrl,
          },
        },
      },
    },
  );

  asset = await cma.asset.processForAllLocales({}, asset);
  asset = await cma.asset.publish({ assetId: asset.sys.id }, asset);
  return asset;
}
