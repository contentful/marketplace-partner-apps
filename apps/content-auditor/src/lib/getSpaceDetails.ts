import { PageAppSDK } from "@contentful/app-sdk";

export const getSpaceDetails = async (sdk: PageAppSDK) => {
  const space = await sdk.cma.space.get({ spaceId: sdk.ids.space });
  return {
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
    spaceName: space.name,
  };
};
