import { KnownAppSDK } from '@contentful/app-sdk';
import { BACKEND_BASE_URL } from '../../constants';
import { BackendParameters } from '../../types';

export async function updateBackendParameters(installationUuid: string, parameters: BackendParameters, sdk: KnownAppSDK): Promise<void> {
  const request = {
    method: 'PUT' as const,
    url: new URL(`${BACKEND_BASE_URL}/backend-parameters`),
    body: JSON.stringify(parameters),
    headers: {
      'X-Contentful-UUID': installationUuid,
      'Content-Type': 'application/json',
    },
  };

  const { additionalHeaders: signedHeaders } = await sdk.cma.appSignedRequest.create(
    { appDefinitionId: sdk.ids.app! },
    {
      method: request.method,
      path: request.url.pathname,
      body: request.body,
      headers: request.headers,
    },
  );

  const response = await fetch(request.url, {
    method: request.method,
    body: request.body,
    headers: {
      ...request.headers,
      ...signedHeaders,
    },
  });

  await response.json();
}
