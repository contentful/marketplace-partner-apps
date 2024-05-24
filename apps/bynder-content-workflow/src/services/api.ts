import { KeyValueMap } from "contentful-management";
import { appVersion } from "@/appVersion/appVersion";

export interface APICredentials {
  apiKey: string;
  email: string;
}

enum Header {
  Default = "default",
  Legacy = "legacy",
}

const HEADERS = {
  [Header.Default]: {
    Accept: "application/vnd.gathercontent.v2+json",
  },
  [Header.Legacy]: {
    Accept: "application/vnd.gathercontent.v0.5+json",
  },
};

const API_URL = "https://api.gathercontent.com";

function apiEndpoint(path: string[], searchParams?: URLSearchParams) {
  return new URL(
    `${API_URL}/${path.join("/")}${
      searchParams ? `?${searchParams.toString()}` : ""
    }`
  ).toString();
}

function authorizationHeader(credentials: APICredentials) {
  return `Basic ${btoa(`${credentials.email}:${credentials.apiKey}`)}`;
}

function reqHeaders(credentials: APICredentials, isLegacy = false) {
  return {
    ...HEADERS[!isLegacy ? Header.Default : Header.Legacy],
    Authorization: authorizationHeader(credentials),
    "Content-Type": "application/json",
    "X-Integration-Identifier": `Contentful-${appVersion}`,
  };
}

export function parseCredentials(
  installation: KeyValueMap
): APICredentials | null {
  const { apiKey, email } = installation;
  if (!apiKey || !email) return null;
  return { apiKey, email };
}

export function getProjectItems(
  credentials: APICredentials,
  projectId: string,
  includes?: { statuses?: string[]; templateId: string }
) {
  const queryString = new URLSearchParams();
  if (includes?.templateId) queryString.set("template_id", includes.templateId);
  if (includes?.statuses)
    queryString.set("status_id", includes.statuses.join(","));
  queryString.set("include", "structure,status_name,template_name");

  return fetch(apiEndpoint(["projects", projectId, `items`], queryString), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getItemFields(credentials: APICredentials, itemId: string) {
  return fetch(apiEndpoint(["items", itemId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getProjectTemplates(
  credentials: APICredentials,
  projectId: string
) {
  return fetch(
    apiEndpoint([
      "projects",
      projectId,
      "templates?include=structure,status_name",
    ]),
    { headers: reqHeaders(credentials) }
  )
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getProjectStatuses(
  credentials: APICredentials,
  projectId: string
) {
  return fetch(apiEndpoint(["projects", projectId, "statuses"]), {
    headers: {
      ...reqHeaders(credentials),
      ...HEADERS.legacy,
    },
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getStructureFields(
  credentials: APICredentials,
  structureId: string
) {
  return fetch(apiEndpoint(["structures", structureId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getAccounts(credentials: APICredentials) {
  return fetch(apiEndpoint(["accounts"]), {
    headers: reqHeaders(credentials, true),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getProjects(credentials: APICredentials, accountId: string) {
  return fetch(
    apiEndpoint(["projects"], new URLSearchParams({ account_id: accountId })),
    {
      headers: reqHeaders(credentials, true),
    }
  )
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function setItemStatus(
  credentials: APICredentials,
  itemId: string,
  statusId: string
) {
  return fetch(apiEndpoint(["items", itemId, "choose_status"]), {
    method: "POST",
    headers: reqHeaders(credentials, true),
    body: JSON.stringify({ status_id: statusId }),
  })
    .then((res) => true)
    .catch((err) => Promise.reject(err));
}

export function getSingleItem(credentials: APICredentials, itemId: string) {
  return fetch(apiEndpoint(["items", itemId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getSingleTemplate(
  credentials: APICredentials,
  templateId: string
) {
  return fetch(apiEndpoint(["templates", templateId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function updateItemContent(
  credentials: APICredentials,
  itemId: string,
  body: { content: any; name: string }
) {
  return fetch(apiEndpoint(["items", itemId, "content"]), {
    method: "POST",
    headers: reqHeaders(credentials),
    body: JSON.stringify(body),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getFile(
  credentials: APICredentials,
  projectId: string,
  fileId: string
) {
  return fetch(apiEndpoint(["projects", projectId, "files", fileId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function uploadFile(
  credentials: APICredentials,
  projectId: string,
  fileData: File
) {
  const form = new FormData();
  form.append("file", fileData);

  return fetch(apiEndpoint(["projects", projectId, "files"]), {
    method: "POST",
    headers: {
      ...HEADERS[Header.Default],
      Authorization: authorizationHeader(credentials),
    },
    body: form,
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getComponent(credentials: APICredentials, componentId: string) {
  return fetch(apiEndpoint(["components", componentId]), {
    headers: reqHeaders(credentials),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function checkCredentials(credentials: APICredentials) {
  return fetch(apiEndpoint(["me"]), {
    headers: reqHeaders(credentials, true),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getSingleProject(
  credentials: APICredentials,
  projectId: string
) {
  return fetch(apiEndpoint(["projects", projectId]), {
    headers: reqHeaders(credentials, true),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}

export function getSingleAccount(
  credentials: APICredentials,
  accountId: string
) {
  return fetch(apiEndpoint(["accounts", accountId]), {
    headers: reqHeaders(credentials, true),
  })
    .then((res) => res.json())
    .catch((err) => Promise.reject(err));
}
