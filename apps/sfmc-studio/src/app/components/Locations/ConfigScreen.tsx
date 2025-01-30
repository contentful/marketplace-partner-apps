"use client";
import React, { useCallback, useEffect, useReducer, useState } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import {
  Box,
  Flex,
  Form,
  FormControl,
  FormLabel,
  Heading,
  Paragraph,
  TextInput,
  Select,
} from "@contentful/f36-components";
import { css } from "emotion";
import {
  AppInstallationParametersKeys,
  appInstallationParameters,
} from "@/lib/AppConfig";
import { ApiClient } from "@/lib/ApiClients";
import {
  clientCredsCookieName,
  CookieHelpers,
  decryptClientData,
  encryptData,
  saveOrValidateLicenseKey,
  timeZoneMapping,
} from "@/lib/utils/common";
import { AxiosInstance } from "axios";
import { Input, Switch } from "antd";
import { environment } from "@/lib/Constants";

enum eAppParameterActions {
  UPDATED = "UPDATED",
  LOADED = "LOADED",
}

type Action = {
  type: eAppParameterActions;
  event?: React.ChangeEvent<HTMLInputElement>;
  parameters?: typeof appInstallationParameters;
};

const appParametersReducer = (
  state: typeof appInstallationParameters,
  action: Action
): typeof appInstallationParameters => {
  switch (action.type) {
    case "UPDATED":
      if (action?.event) {
        return {
          ...state,
          [action.event.target.name]: action.event.target.value,
        };
      }
      return state;
    case "LOADED":
      if (action?.parameters) {
        return action?.parameters;
      }
      return appInstallationParameters;
    default:
      return state;
  }
};

/**
 * This helper method is used to set a cookie
 * based on creds (i.e. license key) which is further used
 * on page location to display toast message to new user.
 * @param newParams new app instance params
 * @param sdk contentful sdk
 */
const setClientCredsCookie = (newParams: any, sdk: ConfigAppSDK) => {
  const { licenseKey } = newParams;
  const cookieName = clientCredsCookieName;
  const isFreshInstallation =
    Object.keys(sdk.parameters.installation).length <= 0;
  //If its a fresh installation, then delete if any previous installation cookie first
  if (isFreshInstallation) {
    CookieHelpers.deleteCookie(cookieName);
  }
  //setting the cookie in case required params are there
  const nonMandatoryParamKeys = [
    AppInstallationParametersKeys.COMPANY_LOGO_URL,
    AppInstallationParametersKeys.COMPANY_NAME,
  ];
  const requiredFieldsKeys = Object.keys(newParams).filter(
    (key: any) => !nonMandatoryParamKeys.includes(key)
  );
  // const isValidParams = requiredFieldsKeys.every((field) => newParams[field]);
  const isValidParams = requiredFieldsKeys.every((field) => {
    const value = newParams[field];
    return value !== undefined && value !== null && value !== "";
  });

  if (isValidParams) {
    if (isFreshInstallation) {
      // if user keeps the previous license key then not updating cookie
      const serializedValue = encryptData({
        licenseKey: licenseKey,
        isUserNotified: false,
      });

      CookieHelpers.setCookie(cookieName, serializedValue, 365 * 2); // 2 yrs
    } else {
      const deserializedCookieValue: any = CookieHelpers.getCookie(cookieName);

      let serializedValue = {
        licenseKey: licenseKey,
        isUserNotified: true,
      };

      if (!deserializedCookieValue) {
        serializedValue.isUserNotified = false;
      }

      CookieHelpers.setCookie(
        cookieName,
        encryptData(serializedValue),
        365 * 2
      );
    }
  }
};
/**
 * Api call for saving/associating the licenseKey
 * with the spaceId of the user(will return 200 1st time only)
 * @param appParam any
 * @param sdk ConfigAppSDK
 * @param client AxiosInstance
 */
export const validateLicenseKeyForWebApp = async (
  { licenseKey }: any,
  sdk: ConfigAppSDK,
  client: AxiosInstance
) => {
  try {
    if (licenseKey) {
      const res = await saveOrValidateLicenseKey(
        licenseKey,
        sdk.ids.space,
        client
      );
    }
  } catch (error) {
    console.log("License Key already exists/invalid");
  }
};

const ConfigScreen = () => {
  const client = ApiClient();
  const [parameters, dispatchParameters] = useReducer(
    appParametersReducer,
    appInstallationParameters
  );

  // const [parameters, setParameters] = useState<AppInstallationParameters>(appConfigs);

  const sdk = useSDK<ConfigAppSDK>();
  /*
     To use the cma, inject it as follows.
     If it is not needed, you can remove the next line.
  */
  // const cma = useCMA();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    if (!parameters["sfmcTimezone"])
      parameters["sfmcTimezone"] =
        appInstallationParameters[AppInstallationParametersKeys.SFMC_TIMEZONE];

    if (!parameters["sfscTimezone"])
      parameters["sfscTimezone"] =
        appInstallationParameters[AppInstallationParametersKeys.SFSC_TIMEZONE];

    if (!parameters["sfmcSync"])
      parameters["sfmcSync"] =
        appInstallationParameters[AppInstallationParametersKeys.SFMC_SYNC];

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    setClientCredsCookie(parameters, sdk);
    validateLicenseKeyForWebApp(parameters, sdk, client);
    automationConfigure(parameters);
    userConfig(parameters);
    clearCacheApiCall(parameters[AppInstallationParametersKeys.LICENSE_KEY]);
    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  const handleConfigParamUpdate = (e: any) => {
    dispatchParameters({ type: eAppParameterActions.UPDATED, event: e });
  };

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: typeof appInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        dispatchParameters({
          type: eAppParameterActions.LOADED,
          parameters: currentParameters,
        });
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const clearCacheApiCall = (licenseKey: string) => {
    try {
      if (licenseKey) {
        client
          .post(
            "/api/clearCache",
            {
              licenseKey: encryptData({
                licenseKey: licenseKey,
              }),
            },
            {
              headers: {
                Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
                ["jro34134ecr4aex"]: `${encryptData({
                  validate: Date.now(),
                  token: environment?.NEXT_PUBLIC_JWT_TOKEN,
                })}`,
              },
            }
          )
          .then((res) => {
            if (res.status !== 200) console.log("Erro occured Clear cache");
          })
          .catch((err) => console.log(err));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const automationConfigure = (parameters: any) => {
    let {
      licenseKey,
      sfmcDomain,
      sfmcMarketingId,
      sfmcclientId,
      sfmcclientSecret,
    } = parameters;

    try {
      if (
        licenseKey &&
        sfmcDomain &&
        sfmcMarketingId &&
        sfmcclientId &&
        sfmcclientSecret
      ) {
        client
          .post(
            "/api/automation",
            {
              subdomain: sfmcDomain,
              client_id: sfmcclientId,
              client_secret: encryptData({
                sfmcclientSecret: sfmcclientSecret,
              }),
              mid: sfmcMarketingId,
              licenseKey: encryptData({
                licenseKey: licenseKey,
              }),
              spaceId: sdk.ids.space,
            },
            {
              headers: {
                Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
                ["jro34134ecr4aex"]: `${encryptData({
                  validate: Date.now(),
                  token: environment?.NEXT_PUBLIC_JWT_TOKEN,
                })}`,
              },
            }
          )
          .then((res) => {
            if (res.status !== 200)
              console.log("Error occured Automation configured");
          })
          .catch((err) => console.log(err));

        client
          .post("/api/dashboard/dashboard-config/add-menu", {
            licenseKey: encryptData({
              licenseKey: licenseKey,
            }),
          })
          .then((res) => {
            if (res.status !== 200) console.log("Error occured Menu Added");
          })
          .catch((err) => console.log(err));
      }
    } catch (error) {
      console.log(error);
    }
  };

  const userConfig = (parameters: any) => {
    let {
      licenseKey,
      sfmcSync,
      sfmcMarketingId,
      sfmcDomain,
      sfmcclientId,
      sfmcclientSecret,
      sfmcTimezone,
      sfscUrl,
      sfscclientId,
      sfscclientSecret,
      sfscUsername,
      sfscPassword,
      sfscTimezone,
    } = parameters;

    try {
      if (
        licenseKey &&
        sfmcMarketingId &&
        sfmcDomain &&
        sfmcclientId &&
        sfmcclientSecret &&
        sfmcTimezone &&
        sfscUrl &&
        sfscclientId &&
        sfscclientSecret &&
        sfscUsername &&
        sfscPassword &&
        sfscTimezone
      ) {
        client
          .post(
            "/api/user-config",
            {
              automatedSync: sfmcSync,
              licenseKey: encryptData({ licenseKey: licenseKey }),
              spaceId: sdk.ids.space,
              marketingCred: {
                mId: sfmcMarketingId,
                subdomain: sfmcDomain,
                clientId: sfmcclientId,
                clientSecret: encryptData({
                  sfmcclientSecret: sfmcclientSecret,
                }),
                sfmcTimezone: sfmcTimezone,
              },
              cloudCred: {
                sfscUrl: sfscUrl,
                sfscClientId: sfscclientId,
                sfscClientSecret: encryptData({
                  sfscclientSecret: sfscclientSecret,
                }),
                sfscUsername: sfscUsername,
                sfscPassword: encryptData({ sfscPassword: sfscPassword }),
                sfscTimezone: sfscTimezone,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${environment?.NEXT_PUBLIC_JWT_TOKEN}`,
                ["jro34134ecr4aex"]: `${encryptData({
                  validate: Date.now(),
                  token: environment?.NEXT_PUBLIC_JWT_TOKEN,
                })}`,
              },
            }
          )
          .then((res) => {
            if (res.status !== 200)
              console.log("Error occured Automation configured");
          })
          .catch((err) => console.log(err));
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <Box>
      <Flex
        flexDirection="column"
        className={css({ margin: "80px auto", maxWidth: "800px" })}
      >
        <Heading>App Config</Heading>
        <Form>
          <Paragraph>Welcome to Config Page.</Paragraph>

          <FormControl>
            <FormLabel htmlFor="app-license-key">
              App License Key <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              id="app-license-key"
              value={parameters.licenseKey}
              name={AppInstallationParametersKeys.LICENSE_KEY}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="app-company-name">Company Name</FormLabel>
            <TextInput
              maxLength={100}
              value={parameters.companyName}
              name={AppInstallationParametersKeys.COMPANY_NAME}
              onChange={handleConfigParamUpdate}
              id="app-company-name"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="app-company-logo">Company Logo Url</FormLabel>
            <TextInput
              type="url"
              value={parameters.companyLogoUrl}
              name={AppInstallationParametersKeys.COMPANY_LOGO_URL}
              onChange={handleConfigParamUpdate}
              id="app-company-logo"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfmc-sub-domain">
              SFMC Sub-domain <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcDomain}
              name={AppInstallationParametersKeys.SFMC_DOMAIN}
              onChange={handleConfigParamUpdate}
              id="sfmc-sub-domain"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfmc-mid">
              SFMC MID <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcMarketingId}
              name={AppInstallationParametersKeys.SFMC_MARKETING_ID}
              onChange={handleConfigParamUpdate}
              id="sfmc-mid"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfmc-client-id">
              SFMC Client Id <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcclientId}
              name={AppInstallationParametersKeys.SFMC_CLIENT_ID}
              onChange={handleConfigParamUpdate}
              id="sfmc-client-id"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfmc-client-secret">
              SFMC Client Secret <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              id="sfmc-client-secret"
              value={parameters.sfmcclientSecret}
              name={AppInstallationParametersKeys.SFMC_CLIENT_SECRET}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfmc-Select-controlled">
              SFMC Timezone <sup className="Supdata">*</sup>
            </FormLabel>
            <Select
              id="sfmc-Select-controlled"
              name={AppInstallationParametersKeys.SFMC_TIMEZONE}
              value={parameters.sfmcTimezone}
              onChange={handleConfigParamUpdate}
            >
              <Select.Option value="" isDisabled>
                Please select timezone for SFMC...
              </Select.Option>
              {timeZoneMapping?.map((el: any, index: number) => (
                <Select.Option key={index} value={el?.iana}>
                  {el?.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-url">
              SFSC URL <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscUrl}
              name={AppInstallationParametersKeys.SFSC_URL}
              onChange={handleConfigParamUpdate}
              id="sfsc-url"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-client-id">
              SFSC Client Id <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscclientId}
              name={AppInstallationParametersKeys.SFSC_CLIENT_ID}
              onChange={handleConfigParamUpdate}
              id="sfsc-client-id"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-client-secret">
              SFSC Client Secret <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              id="sfsc-client-secret"
              value={parameters.sfscclientSecret}
              name={AppInstallationParametersKeys.SFSC_CLIENT_SECRET}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-username">
              SFSC Username <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscUsername}
              name={AppInstallationParametersKeys.SFSC_USERNAME}
              onChange={handleConfigParamUpdate}
              id="sfsc-username"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-password">
              SFSC Password <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              id="sfsc-password"
              value={parameters.sfscPassword}
              type="password"
              name={AppInstallationParametersKeys.SFSC_PASSWORD}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="sfsc-Select-controlled">
              SFSC Timezone <sup className="Supdata">*</sup>
            </FormLabel>
            <Select
              id="sfsc-Select-controlled"
              name={AppInstallationParametersKeys.SFSC_TIMEZONE}
              value={parameters.sfscTimezone}
              onChange={handleConfigParamUpdate}
            >
              <Select.Option value="" isDisabled>
                Please select timezone for SFSC...
              </Select.Option>
              {timeZoneMapping?.map((el: any, index: number) => (
                <Select.Option key={index} value={el?.iana}>
                  {el?.name}
                </Select.Option>
              ))}
            </Select>
          </FormControl>

          <FormControl onChange={handleConfigParamUpdate}>
            <FormLabel htmlFor='automated-sync'
              className="switchLabel">Automated Sync</FormLabel>

            <Switch
              onChange={(value, e) => {
                let updateEvent: any = { ...e };
                updateEvent["target"]["name"] =
                  AppInstallationParametersKeys.SFMC_SYNC;
                updateEvent["target"]["value"] = value;
                handleConfigParamUpdate(updateEvent);
              }}
              value={parameters.sfmcSync}
              id="automated-sync"
            />
          </FormControl>
        </Form>
      </Flex>
    </Box>
  );
};

export default ConfigScreen;
