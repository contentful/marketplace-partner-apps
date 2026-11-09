import { useCallback, useEffect, useState } from 'react';

import type { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Flex, Form, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { toUserMessage } from '@raster-app/react';
import { readParameters, type Settings, verifyApiKey } from '../lib/client';

function ConfigScreen() {
  const [parameters, setParameters] = useState<Settings>({});

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

    const settings = readParameters(parameters);
    if (settings.apiKey !== undefined) {
      try {
        await verifyApiKey(settings.apiKey, settings.orgId);
      } catch (caught) {
        sdk.notifier.error(`Raster refused the API key: ${toUserMessage(caught)}`);
        // Returning false keeps the configuration as it was.
        return false;
      }
    }

    // Get current the state of EditorInterface and other entities
    // related to this app installation
    const currentState = await sdk.app.getCurrentState();

    return {
      // Parameters to be persisted as the app configuration.
      parameters: settings,
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
      const currentParameters: Settings | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }

      // Once preparation has finished, call `setReady` to hide
      // the loading screen and present the app to a user.
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Flex flexDirection="column" alignItems="center" className="mt-10">
      <Form>
        <Heading>Raster</Heading>
        <Flex flexDirection="column" className="space-y-3">
          <img src="./raster-icon.svg" alt="Raster" className="w-24 h-24 mb-4 mx-auto" />
          <Paragraph>Editors sign in to Raster with their own account the first time they open the picker. Both settings below are optional.</Paragraph>
          <Box>
            <FormControl>
              <FormControl.Label>Raster Organization Id</FormControl.Label>
              <TextInput value={parameters.orgId ?? ''} type="text" onChange={(e) => setParameters({ ...parameters, orgId: e.target.value })} />
              <FormControl.HelpText>
                The slug after raster.app/ in your organization&apos;s URL. Editors can then only sign in to that organization.
              </FormControl.HelpText>
            </FormControl>
          </Box>
          <Box>
            <FormControl>
              <FormControl.Label>Raster API Key</FormControl.Label>
              <TextInput
                value={parameters.apiKey ?? ''}
                type="password"
                // Browsers ignore `off` on a password field and fill in a saved password.
                autoComplete="new-password"
                onChange={(e) => setParameters({ ...parameters, apiKey: e.target.value })}
              />
              <FormControl.HelpText>
                An organization API key connects every editor without signing in. Anyone in this space can read it, so give it Read access to only the libraries
                editors need.
              </FormControl.HelpText>
            </FormControl>
          </Box>
        </Flex>
      </Form>
    </Flex>
  );
}

export default ConfigScreen;
