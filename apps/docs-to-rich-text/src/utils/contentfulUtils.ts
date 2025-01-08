import { BaseAppSDK } from '@contentful/app-sdk';

export async function getLocaleCode(sdk: BaseAppSDK) {
  const locales = await sdk.cma.locale.getMany({ spaceId: sdk.ids.space, environmentId: sdk.ids.environment });
  return locales.items.find((l) => l.default)!.code;
}
