import { useCallback, useState, useEffect } from "react";

import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Heading,
  Form,
  Flex,
  TextInput,
  FormControl,
  Box,
  Icon,
} from "@contentful/f36-components";
import {
  LinkIcon,
  LockIcon,
  PersonIcon,
  WorkflowsIcon,
} from "@contentful/f36-icons";
import { useSDK } from "@contentful/react-apps-toolkit";

import { SalesforceLogo } from "../components/Logo";

export interface AppInstallationParameters {
  clientId?: string;
  clientSecret?: string;
  returnUrl?: string;
  organizationId?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [displaySecret, setDisplaySecret] = useState<string>("");
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);

        if (currentParameters.clientSecret) {
          const secret = currentParameters.clientSecret;
          setDisplaySecret(maskSecret(secret));
        }
      }

      sdk.app.setReady();
    })();
  }, [sdk]);

  const maskSecret = (secret: string) => {
    if (!secret || secret.length <= 4) return secret;
    return "•".repeat(secret.length - 4) + secret.slice(-4);
  };

  const handleFieldChange =
    (fieldName: keyof AppInstallationParameters) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      if (fieldName === "clientSecret") {
        setParameters({
          ...parameters,
          [fieldName]: value,
        });

        setDisplaySecret(maskSecret(value));
      } else {
        setParameters({
          ...parameters,
          [fieldName]: value,
        });
      }
    };

  return (
    <Flex justifyContent="center" alignItems="center" fullHeight>
      <Flex flexDirection="column" className="w-full h-full max-w-[600px] p-2">
        <Form>
          <Flex justifyContent="center" marginBottom="spacingXs">
            <SalesforceLogo className="max-h-[120px]" />
          </Flex>

          <Heading className="text-center">
            Salesforce Integration Configuration
          </Heading>

          <Box className="p-5 rounded-lg bg-gray-100 border border-gray-300 mb-2.5 text-center">
            Configure your Salesforce integration by providing the following
            credentials from your Salesforce Connected App.
          </Box>

          <Box className="mt-5">
            <FormControl>
              <Flex alignItems="center" className="mb-2">
                <Icon as={PersonIcon} color="#0176D3" marginRight="spacingXs" />
                <FormControl.Label className="!mb-0">
                  Client ID
                </FormControl.Label>
              </Flex>
              <TextInput
                value={parameters.clientId || ""}
                onChange={handleFieldChange("clientId")}
                placeholder="Enter your Salesforce Client ID"
                id="client-id"
                name="clientId"
                className="w-full mt-1.5"
                isDisabled={true}
              />
              <FormControl.HelpText>
                The Client ID from your Salesforce Connected App
              </FormControl.HelpText>
            </FormControl>
          </Box>

          <Box className="mt-5">
            <FormControl>
              <Flex alignItems="center" className="mb-2">
                <Icon as={LockIcon} color="#0176D3" marginRight="spacingXs" />
                <FormControl.Label className="!mb-0">
                  Client Secret
                </FormControl.Label>
              </Flex>
              <TextInput
                value={displaySecret}
                onChange={handleFieldChange("clientSecret")}
                placeholder="Enter your Salesforce Client Secret"
                id="client-secret"
                name="clientSecret"
                className="w-full mt-1.5"
                isDisabled={true}
              />
              <FormControl.HelpText>
                The Client Secret from your Salesforce Connected App
              </FormControl.HelpText>
            </FormControl>
          </Box>

          <Box className="mt-5">
            <FormControl>
              <Flex alignItems="center" className="mb-2">
                <Icon as={LinkIcon} color="#0176D3" marginRight="spacingXs" />
                <FormControl.Label className="!mb-0">
                  Return URL
                </FormControl.Label>
              </Flex>
              <TextInput
                value={parameters.returnUrl || ""}
                onChange={handleFieldChange("returnUrl")}
                placeholder="Enter your Return URL"
                id="return-url"
                name="returnUrl"
                className="w-full mt-1.5"
                isDisabled={true}
              />
              <FormControl.HelpText>
                The OAuth callback URL for your Salesforce integration
              </FormControl.HelpText>
            </FormControl>
          </Box>

          <Box className="mt-5">
            <FormControl>
              <Flex alignItems="center" className="mb-2">
                <Icon
                  as={WorkflowsIcon}
                  color="#0176D3"
                  marginRight="spacingXs"
                />
                <FormControl.Label className="!mb-0">
                  Organization ID
                </FormControl.Label>
              </Flex>
              <TextInput
                value={parameters.organizationId || ""}
                onChange={handleFieldChange("organizationId")}
                placeholder="Enter your Salesforce Organization ID"
                id="organization-id"
                name="organizationId"
                className="w-full mt-1.5"
              />
              <FormControl.HelpText>
                The Organization ID from your Salesforce account
              </FormControl.HelpText>
            </FormControl>
          </Box>
        </Form>
      </Flex>
    </Flex>
  );
};

export default ConfigScreen;
