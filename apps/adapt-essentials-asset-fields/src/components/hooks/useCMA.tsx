import { createClient } from 'contentful-management';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useMemo } from 'react';

export function useCMA() {
  const sdk = useSDK();
  const cma = useMemo(
    () =>
      createClient(
        { apiAdapter: sdk.cmaAdapter },
        {
          type: 'plain',
          defaults: {
            environmentId: sdk.ids.environmentAlias ?? sdk.ids.environment,
            spaceId: sdk.ids.space,
          },
        },
      ),
    [sdk.cmaAdapter, sdk.ids.environment, sdk.ids.environmentAlias, sdk.ids.space],
  );
  return cma;
}
