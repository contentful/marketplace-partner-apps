import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { CreateAppSignedRequestProps } from 'contentful-management/dist/typings/entities/app-signed-request';

type SignedRequestHeaders = NonNullable<CreateAppSignedRequestProps['headers']>;

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
  headers: SignedRequestHeaders = {},
  method: CreateAppSignedRequestProps['method'] = 'GET',
  body?: unknown,
  useSignedRequest = true
): Promise<Response> {
  const requestBody = body === undefined ? undefined : JSON.stringify(body);
  const requestHeaders: SignedRequestHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  };

  const req = {
    url: url,
    method: method,
    headers: requestHeaders,
    body: requestBody,
  };

  if (useSignedRequest) {
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
  } else {
    Object.assign(req.headers, headers);
  }

  return await fetch(req.url, req);
}

export default fetchWithSignedRequest;
