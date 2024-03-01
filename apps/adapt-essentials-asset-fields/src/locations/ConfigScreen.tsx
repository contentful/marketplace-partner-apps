import { useCallback, useEffect, useState } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import MarkdownRender from '../components/MarkdownRender';
import { Box } from '@contentful/f36-components';
import { Workbench } from '@contentful/f36-workbench';

import originalReadme from '../../README.md?raw';

export interface AppInstallationParameters {}

const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const spaceId = sdk.ids.space;
  const readme = originalReadme.replace(/<space_id>/gm, spaceId);
  const cutStart = '<!--- App part -->';
  const appPart = readme.substring(readme.indexOf(cutStart) + cutStart.length);

  const [parameters, setParameters] = useState<AppInstallationParameters>({});

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();

    return {
      parameters,
      targetState: currentState,
    };
  }, [sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
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
          <MarkdownRender value={appPart} />
        </Box>
      </Workbench.Content>
    </Workbench>
  );
};

export default ConfigScreen;
