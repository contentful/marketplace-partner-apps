import { createClient } from 'contentful-management'
import { useSDK } from '@contentful/react-apps-toolkit';

export function useCMA() {
  const sdk = useSDK();
  return createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    });

}