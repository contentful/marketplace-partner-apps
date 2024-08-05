import React, { useCallback, useEffect, useState } from 'react';

import type { ConfigAppSDK } from '@contentful/app-sdk';
import { Box, Flex, Form, FormControl, Heading, Paragraph, TextInput } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

export interface AppInstallationParameters {
  orgId: string | undefined;
  apiKey: string | undefined;
}

function ConfigScreen() {
  const [parameters, setParameters] = useState<AppInstallationParameters>({
    orgId: '',
    apiKey: '',
  });

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

  return (
    <Flex flexDirection="column" alignItems="center" className="mt-10">
      <Form>
        <Heading>Raster</Heading>
        <Flex flexDirection="column" className="space-y-3">
          {/* eslint-disable-next-line */}
          <img src="/raster-icon.svg" alt="Raster" className="w-24 h-24 mb-4 mx-auto" />
          <Paragraph>
            To utilize the Raster plugin, you must configure it. This requires your Organization ID and Public API Key, which must be set up in Raster
            beforehand.
          </Paragraph>
          <Box>
            <FormControl isRequired>
              <FormControl.Label>Organization Id</FormControl.Label>
              <TextInput value={parameters.orgId} type="text" onChange={(e) => setParameters({ ...parameters, orgId: e.target.value })} />
            </FormControl>
          </Box>
          <Box>
            <FormControl isRequired>
              <FormControl.Label>API Key</FormControl.Label>
              <TextInput value={parameters.apiKey} type="password" onChange={(e) => setParameters({ ...parameters, apiKey: e.target.value })} />
            </FormControl>
          </Box>
        </Flex>
      </Form>
    </Flex>
  );
}

export default ConfigScreen;
