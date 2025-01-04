import { BaseAppSDK } from '@contentful/app-sdk';
import { ConvertRequest, ConvertResponse } from '../types';
import axios from 'axios';

export async function convert(html: string, sdk: BaseAppSDK): Promise<ConvertResponse> {
  const request: ConvertRequest = {
    spaceId: sdk.ids.space,
    html: html,
    useWrapper: sdk.parameters.installation.useImageWrapper,
  };
  const result = await axios.post('https://api.ellavationlabs.com/api/rtf/convert', request);
  return result.data;
}
