import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';

const getSignedPath = (url: string): string => {
  const parsedUrl = new URL(url, window.location.origin);
  const stage = process.env.REACT_APP_LAMBDA_API;
  const stagePrefix = stage ? `/${stage}` : '';
  const pathname = stagePrefix && parsedUrl.pathname.startsWith(`${stagePrefix}/`)
    ? parsedUrl.pathname.slice(stagePrefix.length)
    : parsedUrl.pathname;

  return `${pathname}${parsedUrl.search}`;
};

async function fetchWithSignedRequest(
  url: string,
  sdk: ConfigAppSDK,
  cma: CMAClient,
  headers: any = {},
  method: CreateAppSignedRequestProps['method'] = 'GET',
  body?: any | undefined
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
      path: getSignedPath(url),
      body: req.body,
    }
  );

  Object.assign(req.headers, headers, signedHeaders);

  return await fetch(req.url, req);
}

export default fetchWithSignedRequest;
