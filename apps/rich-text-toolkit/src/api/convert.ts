import { uploadImageFromUrl } from '../assetUtil';
import { CreateImageWrapperEntry } from '../entryUtil';
import { BaseAppSDK } from '@contentful/app-sdk';
import { ConvertRequest } from '../types';
import axios from 'axios';

export async function convert(html: string, sdk: BaseAppSDK) {
  const request: ConvertRequest = {
    spaceId: sdk.ids.space,
    html: html,
    useWrapper: sdk.parameters.installation.useImageWrapper,
  };
  const result = await axios.post('https://api.ellavationlabs.com/api/rtf/convert', request);

  for (const image of result.data.images) {
    await uploadImageFromUrl(sdk.cma, sdk.ids.space, sdk.ids.environment, image.assetUrl, image.assetAlt, image.assetId);
    if (image.contentWrapperId) {
      await CreateImageWrapperEntry(sdk, sdk.ids.space, sdk.ids.environment, image.assetId, image.assetUrl, image.contentWrapperId);
    }
  }

  return result.data.richText;
}
