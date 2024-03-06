import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import MarkdownRender from '../components/MarkdownRender';
import { Box, Text } from '@contentful/f36-components';
import { Workbench } from '@contentful/f36-workbench';
import { css } from 'emotion';

import originalReadme from '../../README.md?raw';

export interface AppInstallationParameters {}

const InstallationInstructions = () => (
  <Box>
    <h2
      className={css({
        margin: '1em 0',
      })}>
      Installation
    </h2>
    <Text>
      To <b>install</b> the App click install button on the right below the settings menu.
    </Text>
  </Box>
);

const ConfigScreen = () => {
  const [installed, setInstalled] = useState(false);
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;
  const environmentId = sdk.ids.environment;
  const readme = originalReadme.replace(/<space_id>/gm, spaceId).replace(/<environment_id>/gm, environmentId);
  const cutStart = '<!--- App part -->';
  const appPart = readme.substring(readme.indexOf(cutStart) + cutStart.length);

  const [parameters, setParameters] = useState<AppInstallationParameters>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [sdk, parameters]);

  const onConfigurationCompleted = (
    err: null | {
      message: string;
    },
  ) => {
    if (!err) {
      setInstalled(true);
    }
  };

  useEffect(() => {
    async function checkInstallation() {
      const currentInstallationState = await sdk.app.isInstalled();
      if (currentInstallationState !== installed) {
        setInstalled(currentInstallationState);
      }
    }
    checkInstallation();
  }, [sdk, parameters, installed, onConfigure]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted(onConfigurationCompleted);
  }, [sdk, onConfigure, parameters]);

  useEffect(() => {
    (async () => {
      const currentParameters: AppInstallationParameters | null = await sdk.app.getParameters();

      if (currentParameters) {
        setParameters(currentParameters);
      }
      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <Workbench>
      <Workbench.Content>
        <Box marginTop="spacingXl" className="page">
          {!installed && <InstallationInstructions />}
          <MarkdownRender value={appPart} />
        </Box>
      </Workbench.Content>
    </Workbench>
  );
};

export default ConfigScreen;
