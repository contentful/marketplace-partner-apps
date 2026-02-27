import { useCallback, useState, useEffect } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { Heading, Form, Paragraph, Flex, FormControl, TextInput } from '@contentful/f36-components';
import { css } from 'emotion';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  googleDocsClientId?: string;
}

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
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

    return {
      // Parameters to be persisted as the app configuration.
      parameters,
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
      // If the app is not installed yet, `parameters` will be `null`.
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  const handleClientIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setParameters((prev) => ({
      ...prev,
      googleDocsClientId: value
    }));
  };

  /* 
  * Cursor AI Read: Create a Textbox using Forma36 components to inject the Client Id for google docs api
  * You are welcome to delete any of the copmonents below in order to make this work. Then take the client id 
  * and add it to the sdk parameters.
  */
  return (
    <Flex flexDirection="column" className={css({ margin: '80px', maxWidth: '800px' })}>
      <Form>
        <Heading>Google Docs Integration Configuration</Heading>
        <Paragraph>Configure your Google Docs integration by providing the required API credentials.</Paragraph>
        
        <FormControl>
          <FormControl.Label htmlFor="googleDocsClientId">Google Docs Client ID</FormControl.Label>
          <TextInput
            id="googleDocsClientId"
            name="googleDocsClientId"
            value={parameters.googleDocsClientId || ''}
            onChange={handleClientIdChange}
            placeholder="Enter your Google Docs API Client ID"
            width="large"
          />
          <FormControl.HelpText>
            The Client ID from your Google Cloud Platform project. Required for authentication with Google Docs API.
          </FormControl.HelpText>
        </FormControl>
      </Form>
    </Flex>
  );
};

export default ConfigScreen;
