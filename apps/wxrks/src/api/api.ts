import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import fetchWithSignedRequest from '../security/signedRequests';

import { ProjectCreation, TmChange } from '../interfaces';

const BASE_URL = process.env.REACT_APP_LAMBDA_API ? `/${process.env.REACT_APP_LAMBDA_API}/api/bwx` : '/api/bwx';
const getTokenStorageKey = (sdk: ConfigAppSDK) => `bwxToken-${sdk.ids.space}`;

const headers = (sdk: ConfigAppSDK): Record<string, string> => ({
  "x-contentful-bwx-token": sessionStorage.getItem(getTokenStorageKey(sdk)) ?? ''
});

async function checkAuth (sdk: ConfigAppSDK, cma: CMAClient) {
  const token = sessionStorage.getItem(getTokenStorageKey(sdk));

  if (!token) {
    await newLogin(sdk, cma);
    return;
  }

  const response = await fetchWithSignedRequest(`${BASE_URL}/auth/check`, sdk, cma, headers(sdk), 'POST');

  if (!response.ok) {
    await newLogin(sdk, cma);
  }

  return true;
}

async function newLogin(sdk: ConfigAppSDK, cma: CMAClient) {
  const apiKey = sdk.parameters.installation['apiKey'];
  const secretKey = sdk.parameters.installation['secretKey'];
  
  if (!apiKey) {
    throw new Error("Invalid app configuration. Missing API ID.");
  }

  if (!secretKey) {
    throw new Error("Invalid app configuration. Missing Secret Key.");
  }

  await login(apiKey, secretKey, sdk, cma);
}

async function login (apiKey: string, secretKey: string, sdk: ConfigAppSDK, cma: CMAClient): Promise<any> {
  const payload = {
    accessKey: apiKey,
    secret: secretKey
  }

  const req = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  };

  const response = await fetch(`${BASE_URL}/auth`, req);

  if (!response.ok) {
    throw new Error("Invalid credentials to connect with wxrks.");
  }

  const token = response.headers.get('Bwx-Auth-Token');
  
  if (token) {
    sessionStorage.setItem(getTokenStorageKey(sdk), token);
  }

  return {
    token
  }
}

async function sendEntry(params: ProjectCreation, entryId: string, sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload(entryId, [], '', sdk, requestId, params);

  const response = await fetchWithSignedRequest(`${BASE_URL}/create`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to send entry to wxrks");
  }
  return response;
}

async function sendEntries(params: ProjectCreation, entryIds: string[], sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload('', entryIds, '', sdk, requestId, params);

  const response = await fetchWithSignedRequest(`${BASE_URL}/bulk-create`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to send entries to wxrks");
  }
  return response;
}

async function getProjects(sdk: ConfigAppSDK, cma: CMAClient, page: number, pageSize: number,  requestId?: string, projectName?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload('', [], '', sdk, requestId, undefined, page, pageSize, projectName);
  
  const response = await fetchWithSignedRequest(`${BASE_URL}/projects`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to get projects from wxrks");
  }
  return response;
}

async function getProgress(entryId: string, sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload(entryId, [], '', sdk, requestId);

  const response = await fetchWithSignedRequest(`${BASE_URL}/progress`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to get progress from wxrks");
  }
  return response;
}

async function getEntries(projectUuid: string, sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload('', [], projectUuid, sdk, requestId);

  const response = await fetchWithSignedRequest(`${BASE_URL}/entries`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to get entries from wxrks");
  }
  return response;
}

async function fetchTranslations(force: boolean, entryId: string, projectUuid: string, sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload(entryId, [], projectUuid, sdk, requestId);
  payload.forceFetch = force

  const response = await fetchWithSignedRequest(`${BASE_URL}/fetch`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to fetch translations from wxrks");
  }
  return response;
}

async function getConfigs(sdk: ConfigAppSDK, cma: CMAClient, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildPayload('', [], '', sdk, requestId);

  const response = await fetchWithSignedRequest(`${BASE_URL}/configs`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to get configs from wxrks");
  }
  return response;
}

async function sendTmChanges(changes: TmChange[], sdk: ConfigAppSDK, cma: CMAClient): Promise<any> {
  await checkAuth(sdk, cma);
  
  const payload = buildTmPayload(sdk, changes);

  const response = await fetchWithSignedRequest(`${BASE_URL}/upsert-tm`, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error("Error to send TM changes to wxrks");
  }
  return response;
}

async function changeProjectStatus(projectUuid: string, newStatus: string, sdk: ConfigAppSDK, cma: CMAClient, canCalculateCosts: boolean = false, reason: string, requestId?: string): Promise<any> {
  await checkAuth(sdk, cma);

  const payload = {
    ...buildPayload('', [], projectUuid, sdk, requestId),
    force: true,
    newStatus: newStatus,
    reason: reason,
  };

  const url = `${BASE_URL}/project/${projectUuid}/status?can-calculate-costs=${canCalculateCosts}`;

  const response = await fetchWithSignedRequest(url, sdk, cma, headers(sdk), 'POST', payload);

  if (!response.ok) {
    throw new Error('Error to change the project status on wxrks');
  }
  return response;
}

function buildPayload (entryId: string, entryIds: string[], projectUuid: string, sdk: ConfigAppSDK, requestId?: string, params?: ProjectCreation, page?: number, pageSize?: number, projectName?: string) {
  return {
    configUuid: sdk.parameters.installation.configUuid,
    contactUuid: sdk.parameters.installation.contactUuid,
    workflows: params?.workflows || sdk.parameters.installation.workflows,
    environment: sdk.ids.environment,
    environmentAlias: sdk.ids.environmentAlias ?? null,
    entryId,
    entryIds,
    projectUuid: projectUuid ?? null,
    requestId,
    targetLocales: params?.targetLocales,
    configGroupUuid: params?.configGroupUuid,
    displayTitle: params?.displayTitle,
    forceFetch: false,
    page,
    pageSize,
    projectName
  };
}

function buildTmPayload (sdk: ConfigAppSDK, changes: TmChange[]) {
  return {
    configUuid: sdk.parameters.installation.configUuid,
    environment: sdk.ids.environment,
    environmentAlias: sdk.ids.environmentAlias ?? null,
    changes: changes
  };
}

const bwxService = {
  login,
  checkAuth,
  sendEntry,
  sendEntries,
  getProjects,
  getProgress,
  getEntries,
  fetchTranslations,
  getConfigs,
  sendTmChanges,
  changeProjectStatus
}

export default bwxService;

