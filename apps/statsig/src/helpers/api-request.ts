import { BaseAppSDK } from '@contentful/app-sdk';
import { HttpError } from './http-error';

type HTTPMethod = 'GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH' | 'HEAD';

const BASE_SERVER_URL = 'https://statsigapi.net';

export type ApiRequestProps = {
  method: HTTPMethod;
  endpoint: string;
  headers: Record<string, string>;
  body?: object;
};

type AppSignedRequestProps = {
  method: HTTPMethod;
  path: string;
  headers: Record<string, string>;
  body?: string; // stringified body
};

export const unsignedApiRequest = async <T>(statsigApiKey: string, req: ApiRequestProps) => {
  if (!statsigApiKey.trim()) {
    throw new Error('Statsig API Key required');
  }
  const url = `${BASE_SERVER_URL}${req.endpoint}`;
  const payload: RequestInit = {
    method: req.method,
    headers: {
      'statsig-api-key': statsigApiKey,
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
  };
  const response = await fetch(url, payload);
  if (response.status >= 400) {
    throw new HttpError(response);
  }
  return (await response.json()).data as T;
}

// https://www.contentful.com/developers/docs/extensibility/app-framework/request-verification/
export const apiRequest = async <T>(sdk: BaseAppSDK, req: ApiRequestProps) => {
  const appId = sdk.ids.app;
  if (!appId) {
    throw new Error('Missing app id');
  }
  const url = `${BASE_SERVER_URL}${req.endpoint}`;
  const appSignedRequestProps: AppSignedRequestProps = {
    method: req.method,
    path: new URL(url).pathname,
    headers: {
      ...req.headers,
      'content-type': 'application/statsig-json',
    },
    body: req.body ? JSON.stringify(req.body) : undefined,
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
  const response = await fetch(url, payload);
  if (response.status >= 400) {
    throw new HttpError(response);
  }
  return (await response.json()).data as T;
};
