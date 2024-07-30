import { EnvVars, eDataExtensionParams } from "@/lib/Constants";
import moment from "moment";
import { dataExtensionsMap } from "./DBHelpers";

export class SFUrlBuilder {
  static getSFDCDataUrl({
    baseUrl,
    queryParam,
  }: {
    baseUrl: string;
    queryParam: string;
  }): string {
    return baseUrl.concat(`/services/data/v59.0/query/?q=${queryParam}`);
  }

  static getSFDCAuthUrl({ baseUrl }: { baseUrl: string }): string {
    return baseUrl.concat("/services/oauth2/token");
  }

  static getSFMCDataUrl({
    subdomain,
    dataExtParam,
    queryParam,
  }: {
    subdomain: string;
    dataExtParam: string;
    queryParam?: string;
  }): string {
    return process.env[EnvVars.SFMC_BASE_URL]!.replace(
      "{{SUB_DOMAIN}}",
      subdomain
    ).concat(
      `/data/v1/customobjectdata/key/${dataExtParam}/rowset?${queryParam ?? ""}`
    );
  }

  static getSFMCAuthUrl({ subdomain }: { subdomain: string }): string {
    return process.env[EnvVars.SFMC_AUTH_URL]!.replace(
      "{{SUB_DOMAIN}}",
      subdomain
    ).concat("/v2/Token");
  }

  static getSFMCSoapServiceUrl({ subdomain }: { subdomain: string }): string {
    return process.env[EnvVars.SFMC_SOAP_SERVICE_URL]!.replace(
      "{{SUB_DOMAIN}}",
      subdomain
    )
  }
}

export const getDataExtensionParam = (
  dataExtension: eDataExtensionParams,
  {
    startDate,
    endDate = moment.utc().format("YYYY-MM-DD HH:mm:ss Z"),
  }: {
    startDate: string;
    endDate?: string;
  }
) => {
  const fieldsQuery = dataExtensionsMap.find(
    (ext) => ext.extension === dataExtension
  );
  return `${fieldsQuery?.query}&$filter=${fieldsQuery?.dateField} gte '${startDate}' and ${fieldsQuery?.dateField} lte '${endDate}'`;
};

export const getSFDCToken = async ({
  baseUrl,
  credentials: { username, password, clientId, clientSecret },
}: {
  baseUrl: string;
  credentials: {
    username: string;
    password: string;
    clientId: string;
    clientSecret: string;
  };
}) => {
  try {
    let sfdcAuthToken: string = "";
    let sfdcTokenExpiration: number | null = null;
    if (
      sfdcAuthToken &&
      sfdcTokenExpiration &&
      new Date(sfdcTokenExpiration) > new Date()
    ) {
      return sfdcAuthToken;
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/x-www-form-urlencoded");

    const urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "password");
    urlencoded.append("username", username);
    urlencoded.append("password", password);
    urlencoded.append("client_id", clientId);
    urlencoded.append("client_secret", clientSecret);

    const response = await fetch(SFUrlBuilder.getSFDCAuthUrl({ baseUrl }), {
      method: "POST",
      headers,
      body: urlencoded,
      cache: "no-store",
    });
    const data = await response.json();
    sfdcAuthToken = data.access_token;
    sfdcTokenExpiration = +data.issued_at + 10 * 60 * 1000; // 10 mins expiry

    return sfdcAuthToken;
  } catch (error) {
    throw new Error(
      JSON.stringify({ type: "APIError", error: "Failed to get SFDC token" })
    );
  }
};

const sfmcTokenCache: {
  [key: string]: { sfmcAuthToken: string; expiration: number };
} = {};

export const getSFMCToken = async ({
  subdomain,
  credentials: { clientId, clientSecret },
}: {
  subdomain: string;
  credentials: { clientId: string; clientSecret: string };
}) => {
  try {
    if (sfmcTokenCache?.[subdomain]?.expiration > Date.now()) {
      // If token exists in cache and it's not expired, return it
      return sfmcTokenCache?.[subdomain]?.sfmcAuthToken;
    }

    const headers = new Headers();
    headers.append("Content-Type", "application/json");
    const response = await fetch(SFUrlBuilder.getSFMCAuthUrl({ subdomain }), {
      method: "POST",
      headers,
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
      cache: "no-store",
    });

    const data = await response.json();
    const sfmcAuthToken = data.access_token;
    const tokenExpiration = Date.now() + 15 * 60 * 1000; // 15 mins expiry

    // Cache the token
    sfmcTokenCache[subdomain] = {
      sfmcAuthToken: sfmcAuthToken,
      expiration: tokenExpiration,
    };
    return sfmcAuthToken;
  } catch (error) {
    // Clear cache for the subdomain in case of error
    delete sfmcTokenCache?.subdomain;
    throw new Error(
      JSON.stringify({ type: "APIError", error: "Failed to get SFMC token" })
    );
  }
};
