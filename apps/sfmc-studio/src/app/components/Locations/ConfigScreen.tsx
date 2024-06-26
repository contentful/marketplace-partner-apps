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
  saveOrValidateLicenseKey,
  timeZoneMapping,
} from "@/lib/utils/common";
import { AxiosInstance } from "axios";
import moment from "moment-timezone";
import { Input } from "antd";

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
    try {
      CookieHelpers.deleteCookie(cookieName);
    } catch (err) {
      console.log(err, "==Delete cookie==");
    }
  }
  //Check and get previous saved cookie
  let deserializedLicenseKeyObj = CookieHelpers.getCookie(cookieName);
  let prevSavedLicenseKey = null;
  if (deserializedLicenseKeyObj) {
    prevSavedLicenseKey = JSON.parse(deserializedLicenseKeyObj)?.licenseKey;
  }
  //setting the cookie in case required params are there
  const nonMandatoryParamKeys = [
    AppInstallationParametersKeys.COMPANY_LOGO_URL,
    AppInstallationParametersKeys.COMPANY_NAME,
  ];
  const requiredFieldsKeys = Object.keys(newParams).filter(
    (key: any) => !nonMandatoryParamKeys.includes(key)
  );
  const isValidParams = requiredFieldsKeys.every((field) => newParams[field]);
  if (isValidParams) {
    if (isFreshInstallation || prevSavedLicenseKey !== licenseKey) {
      // if user keeps the previous license key then not updating cookie
      const serializedValue = JSON.stringify({
        licenseKey,
        isUserNotified: false,
      });
      try {
        CookieHelpers.setCookie(cookieName, serializedValue, 365 * 2); // 2 yrs
      } catch (err) {
        console.log(err, "==Set Cookie==");
      }
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

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();
    setClientCredsCookie(parameters, sdk);
    validateLicenseKeyForWebApp(parameters, sdk, client);
    automationConfigure(parameters);
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
          .post("/api/automation", {
            subdomain: sfmcDomain,
            client_id: sfmcclientId,
            client_secret: sfmcclientSecret,
            mid: sfmcMarketingId,
            licenseKey: licenseKey,
            spaceId: sdk.ids.space,
          })
          .then((res) => {
            if (res.status !== 200)
              console.log("Error occured Automation configured");
          })
          .catch((err) => console.log(err));

        client
          .post("/api/dashboard/dashboard-config/add-menu", {
            licenseKey: licenseKey,
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
            <FormLabel>
              App License Key <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              value={parameters.licenseKey}
              name={AppInstallationParametersKeys.LICENSE_KEY}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Company Name</FormLabel>
            <TextInput
              maxLength={100}
              value={parameters.companyName}
              name={AppInstallationParametersKeys.COMPANY_NAME}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Company Logo Url</FormLabel>
            <TextInput
              type="url"
              value={parameters.companyLogoUrl}
              name={AppInstallationParametersKeys.COMPANY_LOGO_URL}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFMC Sub-domain <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcDomain}
              name={AppInstallationParametersKeys.SFMC_DOMAIN}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFMC MID <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcMarketingId}
              name={AppInstallationParametersKeys.SFMC_MARKETING_ID}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFMC Client Id <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfmcclientId}
              name={AppInstallationParametersKeys.SFMC_CLIENT_ID}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFMC Client Secret <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              value={parameters.sfmcclientSecret}
              name={AppInstallationParametersKeys.SFMC_CLIENT_SECRET}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
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
            <FormLabel>
              SFSC URL <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscUrl}
              name={AppInstallationParametersKeys.SFSC_URL}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFSC Client Id <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscclientId}
              name={AppInstallationParametersKeys.SFSC_CLIENT_ID}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFSC Client Secret <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              value={parameters.sfscclientSecret}
              name={AppInstallationParametersKeys.SFSC_CLIENT_SECRET}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFSC Username <sup className="Supdata">*</sup>
            </FormLabel>
            <TextInput
              value={parameters.sfscUsername}
              name={AppInstallationParametersKeys.SFSC_USERNAME}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
              SFSC Password <sup className="Supdata">*</sup>
            </FormLabel>
            <Input.Password
              value={parameters.sfscPassword}
              type="password"
              name={AppInstallationParametersKeys.SFSC_PASSWORD}
              onChange={handleConfigParamUpdate}
            />
          </FormControl>

          <FormControl>
            <FormLabel>
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
        </Form>
      </Flex>
    </Box>
  );
};

export default ConfigScreen;
