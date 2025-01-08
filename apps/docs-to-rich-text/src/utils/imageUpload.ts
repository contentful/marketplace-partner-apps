import { uploadImageFromBase64, uploadImageFromUrl } from './assetUpload';
import { CreateImageWrapperEntry } from './entryUpload';
import { BaseAppSDK } from '@contentful/app-sdk';
import { ImageProcessResult, EmbeddedAsset } from '../types';
import { getFileName } from './importUtils';

export async function processImages(sdk: BaseAppSDK, assets: EmbeddedAsset[]): Promise<ImageProcessResult> {
  const result: ImageProcessResult = {
    success: false,
    failedImages: [],
  };

  const uploadPromises = assets.map((image) =>
    uploadImage(sdk, image).catch((error) => {
      error.image = image;
      throw error;
    }),
  );

  const uploadResults = await Promise.allSettled(uploadPromises);

  result.success = !uploadResults.some((result) => result.status === 'rejected');
  result.failedImages = uploadResults.filter((result) => result.status === 'rejected').map((result) => result.reason.image);

  return result;
}

export async function processImagesFromGoogleDrive(sdk: BaseAppSDK, assets: EmbeddedAsset[], markdown: string): Promise<ImageProcessResult> {
  try {
    // extract base64 images
    const base64Images = extractBase64Images(markdown);

    const result: ImageProcessResult = {
      success: false,
      failedImages: [],
    };

    // upload images to contentful
    const uploadPromises = assets.map(async (asset, i) => {
      asset.assetBase64 = base64Images[i];
      return uploadImage(sdk, asset).catch((error) => {
        error.asset = asset;
        throw error;
      });
    });

    const uploadResults = await Promise.allSettled(uploadPromises);

    result.success = !uploadResults.some((result) => result.status === 'rejected');
    result.failedImages = uploadResults.filter((result) => result.status === 'rejected').map((result) => result.reason.image);

    return result;
  } catch {
    return {
      success: false,
      failedImages: [...assets],
    };
  }
}

async function uploadImage(sdk: BaseAppSDK, image: EmbeddedAsset) {
  if (image.assetBase64) {
    await uploadImageFromBase64(sdk, image.assetBase64, image.assetAlt, getFileName(image.assetUrl), image.assetId);
  } else {
    await uploadImageFromUrl(sdk, image.assetUrl, image.assetAlt, image.assetId);
  }

  if (image.contentWrapperId) {
    await CreateImageWrapperEntry(sdk, image.assetId, getFileName(image.assetUrl), image.contentWrapperId);
  }
}

function extractBase64Images(markdown: string) {
  // Regex to match [imageX]: <data:image/MIMEType;base64,BASE64_STRING>
  const imageRegex = /\[image\d+\]:\s*<(data:image\/[\w+]+;base64,[^>]+)>/g;

  const base64Images = [];
  let match;

  while ((match = imageRegex.exec(markdown)) !== null) {
    base64Images.push(match[1]);
  }

  return base64Images;
}
