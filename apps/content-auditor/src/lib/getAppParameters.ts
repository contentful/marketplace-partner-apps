import { PageAppSDK } from "@contentful/app-sdk";

export const getCmaToken = (sdk: PageAppSDK): string | undefined => {
  return sdk.parameters.installation?.cmaToken;
};
