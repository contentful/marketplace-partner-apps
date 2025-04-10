import { ConfigAppSDK } from "@contentful/app-sdk";
import {
  Flex,
  Form,
  Heading,
  Paragraph,
  FormControl,
  TextInput,
  Button,
} from "@contentful/f36-components";
import { useSDK } from "@contentful/react-apps-toolkit";
import { css } from "emotion";
import { useCallback, useEffect, useState } from "react";

export interface AppInstallationParameters {
  previewApiKey?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    previewApiKey: "",
  });
  const sdk = useSDK<ConfigAppSDK>();

  const onConfigure = useCallback(async () => {
    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: parameters,
      // In case you don't want to submit any update to app
      // locations, you can just pass the currentState as is
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    // `onConfigure` allows to configure a callback to be
    // invoked when a user attempts to install the app or update
    // its configuration.
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      // Get current parameters of the app.
      const currentParameters: AppInstallationParameters | null =
        await sdk.app.getParameters();

      // If the app is already installed, set the parameters
      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Set the app to be ready and hide the loading screen
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex
      flexDirection="column"
      className={css({ margin: "80px", maxWidth: "800px" })}
    >
      <Form>
        <Heading>Closest Preview Configuration</Heading>
        <FormControl isRequired isInvalid={!parameters.previewApiKey}>
          <FormControl.Label>Preview API Key</FormControl.Label>
          <TextInput
            type="text"
            name="previewAPIKey"
            placeholder="Your preview API key"
            isRequired
            isInvalid={!parameters.previewApiKey}
            value={parameters.previewApiKey}
            onChange={(e) => {
              const value = e.target.value;
              setParameters({
                previewApiKey: value,
              });
            }}
          />
          <Flex marginTop="spacingM"></Flex>
          <FormControl.HelpText>
            The API key used to authenticate requests to the preview API so it
            can access unpublished content.
          </FormControl.HelpText>
          {!parameters.previewApiKey && (
            <FormControl.ValidationMessage>
              Provide your preview API key
            </FormControl.ValidationMessage>
          )}
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
