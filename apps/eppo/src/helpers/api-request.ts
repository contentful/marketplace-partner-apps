import { BaseAppSDK } from '@contentful/app-sdk';
import { HttpError } from './http-error';

type HTTPMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'HEAD';

export type ApiRequestProps = {
  method: HTTPMethod;
  url: string;
  headers?: Record<string, string>;
  body?: object;
};

type AppSignedRequestProps = {
  method: HTTPMethod;
  path: string;
  headers: Record<string, string>; // required headers
  body: string; // stringified body
};

export const unsignedApiRequest = async <T>(eppoApiKey: string, req: ApiRequestProps) => {
  if (!eppoApiKey.trim()) {
    throw new Error('eppoApiKey cannot be empty');
  }
  const payload: RequestInit = {
    method: req.method,
    headers: {
      ...req.headers,
      'x-eppo-api-key': eppoApiKey.trim(),
      'Content-Type': 'application/json',
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
  };
  const response = await fetch(req.url, payload);
  if (response.status >= 400) {
    throw new HttpError(response);
  }
  return (await response.json()) as T;
};

// https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/
export const apiRequest = async <T>(sdk: BaseAppSDK, req: ApiRequestProps) => {
  const appId = sdk.ids.app;
  if (!appId) {
    throw new Error('Missing app id');
  }
  const appSignedRequestProps: AppSignedRequestProps = {
    method: req.method,
    path: new URL(req.url).pathname,
    headers: {
      ...req.headers,
      'Content-Type': 'application/json',
    },
    body: req.body ? JSON.stringify(req.body) : '{}',
  };
  const { additionalHeaders } = await sdk.cma.appSignedRequest.create(
    { appDefinitionId: appId },
    appSignedRequestProps,
  );
  const payload: RequestInit = {
    method: req.method,
    headers: { ...appSignedRequestProps.headers, ...additionalHeaders },
    body: req.body ? JSON.stringify(req.body) : undefined,
  };
  const response = await fetch(req.url, payload);
  if (response.status >= 400) {
    throw new HttpError(response);
  }
  return (await response.json()) as T;
};
