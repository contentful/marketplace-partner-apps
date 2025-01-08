import { BaseAppSDK } from '@contentful/app-sdk';
import { fileTypeFromBuffer } from 'file-type';
import { getFileName, getFileNameWithExtension } from './importUtils';
import { getLocaleCode } from './contentfulUtils';

export async function uploadImageFromUrl(sdk: BaseAppSDK, imageUrl: string, imgAlt: string, id: string) {
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

  const locale = await getLocaleCode(sdk);
  const name = getFileName(imageUrl);
  const fileName = getFileNameWithExtension(imageUrl);
  const mimeType = response.headers.get('content-type') ?? '';

  let asset = await sdk.cma.asset.createWithId(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
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

  asset = await sdk.cma.asset.processForAllLocales({}, asset);
  asset = await sdk.cma.asset.publish({ assetId: asset.sys.id }, asset);
  return asset;
}

export async function uploadImageFromBase64(sdk: BaseAppSDK, base64Image: string, imgAlt: string, name: string, id: string) {
  const base64Data = base64Image.split(',')[1] || base64Image;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const fileType = await fileTypeFromBuffer(bytes);

  if (!fileType || !fileType.mime.startsWith('image/')) {
    throw new Error('Invalid image format');
  }

  // Upload the image
  const upload = await sdk.cma.upload.create(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
    },
    {
      file: bytes.buffer,
    },
  );

  // Create asset
  const locale = await getLocaleCode(sdk);
  let asset = await sdk.cma.asset.createWithId(
    {
      spaceId: sdk.ids.space,
      environmentId: sdk.ids.environment,
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
            contentType: fileType.mime,
            fileName: name,
            uploadFrom: {
              sys: {
                type: 'Link',
                linkType: 'Upload',
                id: upload.sys.id,
              },
            },
          },
        },
      },
    },
  );

  asset = await sdk.cma.asset.processForAllLocales({}, asset);
  asset = await sdk.cma.asset.publish({ assetId: asset.sys.id }, asset);
  return asset;
}
