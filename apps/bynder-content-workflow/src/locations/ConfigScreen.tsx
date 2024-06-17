import React, { useCallback, useEffect, useState } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Text,
  Flex,
  Form,
  FormControl,
  Heading,
  Paragraph,
  TextInput, TextLink, Grid,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { inputsConfig } from "@/consts/inputs";
import { checkCredentials } from "@/services/api";

export interface AppInstallationParameters {
  apiKey?: string;
  email?: string;
}

export default function ConfigScreen() {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    apiKey: "",
    email: "",
  });
  const [currentUser, setCurrentUser] = useState({
    name: "",
    email: "",
    // image: "",
  });
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // This method will be called when a user clicks on "Install"
    // or "Save" in the configuration screen.
    // for more details see https://www.contentful.com/developers/docs/extensibility/ui-extensions/sdk-reference/#register-an-app-configuration-hook

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    const validationError = await validateParameters(parameters);
    // Perform validation.
    if (validationError) {
      // Current state of the app is not valid.
      // Notify the user and return `false` so installation
      // is aborted.
      sdk.notifier.error(validationError);
      return false;
    }

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  const setAPIKey = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters((p) => ({ ...p, apiKey: parseInputValue(e) }));
  }, []);

  const setEmail = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setParameters((p) => ({ ...p, email: parseInputValue(e) }));
  }, []);

  async function greetUser() {
    const currentUser = await checkCredentials(
      parameters as Required<AppInstallationParameters>
    );
    if (currentUser && currentUser.data) {
      setCurrentUser({
        name: `${currentUser.data.first_name} ${currentUser.data.last_name}`,
        email: `${currentUser.data.email}`
        // avatars are temporarily not available at the specified url
        // image: `https://gathercontent-production-avatars.s3-us-west-2.amazonaws.com/${currentUser.data.avatar}`,
      });
    }
  }

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
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  useEffect(() => {
    if (parameters.apiKey && parameters.email) {
      greetUser();
    }
  }, [parameters]);

  return (
    <div style={{ padding: "1rem", maxWidth: "1260px", margin: "0 auto" }}>
      <Flex flexDirection="column">
        <Grid
            paddingTop="spacingL"
            paddingBottom="spacingXs"
            columns="2fr 1fr"
            columnGap="spacingL"
        >
        <Form>
          <Heading>Content Workflow by Bynder Configuration</Heading>
          <Paragraph>Enter your email address and API key below to authorise access to your Content Workflow account
            <br/><br/>
              For instructions on how to create an API key for Content Workflow <TextLink href={`https://support.bynder.com/hc/en-us/articles/14984593670034-Generate-API-key-API-documentation-in-Content-Workflow`}>see here</TextLink> or
               to view our Contentful Integration documentation <TextLink href={`https://support.bynder.com/hc/en-us/articles/17407625367954-Contentful-Integration-for-Content-Workflow`}>see here</TextLink>.
          </Paragraph>
          {/*<Flex gap="spacingXs" marginBottom="spacingXl" alignItems="center">*/}
            {/* <img
              style={{
                borderRadius: "200px",
                height: "30px",
                width: "30px",
                objectFit: "cover",
              }}
              src={currentUser.image || "/src/assets/placeholder-image.svg"}
              alt="User Avatar"
            /> */}
          {/*</Flex>*/}
          <FormControl isRequired>

            <FormControl.Label>Email</FormControl.Label>
            <TextInput
              value={parameters.email}
              name={inputsConfig.name.email}
              testId={inputsConfig.name.email}
              onChange={setEmail}
              type="text"
            />
          </FormControl>
          <FormControl isRequired>
            <FormControl.Label>API Key</FormControl.Label>
            <TextInput
              value={parameters.apiKey}
              name={inputsConfig.name.apiKey}
              testId={inputsConfig.name.apiKey}
              onChange={setAPIKey}
              type="password"
            />
          </FormControl>

          {currentUser.email &&
          <Paragraph>
            <Text fontSize="fontSizeL" fontWeight="fontWeightMedium">You are authenticated as: <b>{currentUser.name} ({currentUser.email})</b></Text>
          </Paragraph>}
        </Form>
        </Grid>
      </Flex>
    </div>
  );
}

function parseInputValue(
  e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
) {
  return e.target.value;
}

async function validateParameters(credentials: AppInstallationParameters) {
  if (!credentials.apiKey) {
    return inputsConfig.errors.apiKey;
  }

  if (!credentials.email) {
    return inputsConfig.errors.email;
  }

  const gcUser = await checkCredentials(
    credentials as Required<AppInstallationParameters>
  );

  if (!gcUser || !gcUser.data) {
    return inputsConfig.errors.invalid;
  }

  if (gcUser.data.email !== credentials.email) {
    return inputsConfig.errors.email;
  }

  return null;
}
