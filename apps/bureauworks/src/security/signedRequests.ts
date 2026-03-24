import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';

async function fetchWithSignedRequest(
  url: string,
  sdk: ConfigAppSDK,
  cma: CMAClient,
  headers: Record<string, string> = {},
  method: NonNullable<RequestInit['method']> = 'GET',
  body?: unknown
): Promise<Response> {
  
  const req = {
    url: url,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  // add request verification signing secret to request headers
  const { additionalHeaders: signedHeaders } = await cma.appSignedRequest.create(
    {
      appDefinitionId: sdk.ids.app,
    },
    {
      method: req.method,
      headers: req.headers,
      path: url,
      body: req.body,
    }
  );

  Object.assign(req.headers, headers, signedHeaders);

  return await fetch(req.url, req);
}

export default fetchWithSignedRequest;
