import { ConfigAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/react';
import { useCallback, useEffect, useState } from 'react';
import logo from '../../assets/logo.svg';
import { DEFAULT_APP_INSTALLATION_PARAMETERS, DEFAULT_BACKEND_PARAMETERS } from '../../constants';
import { AppInstallationParameters, BackendParameters } from '../../types';
import { FieldSelector } from './FieldSelector';
import { InstallParamsConfiguration } from './InstallParamsConfiguration';
import { SelectedFields, editorInterfacesToSelectedFields, selectedFieldsToTargetState } from './fields';
import { updateBackendParameters } from './helpers';

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    zIndex: 2,
    boxShadow: '0px 0px 20px rgba(0, 0, 0, 0.1)',
    borderRadius: '2px',
  }),
  background: css({
    display: 'block',
    position: 'absolute',
    zIndex: -1,
    top: 0,
    width: '100%',
    height: '300px',
    backgroundColor: '#f4b21b',
  }),
  section: css({
    margin: `${tokens.spacingXl} 0`,
  }),
  splitter: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingL,
    border: 0,
    height: '1px',
    backgroundColor: tokens.gray300,
  }),
  icon: css({
    display: 'flex',
    justifyContent: 'center',
    '> img': {
      display: 'block',
      width: '70px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};

const ConfigScreen = () => {
  const [parameters, setParameters] = useState<AppInstallationParameters>(DEFAULT_APP_INSTALLATION_PARAMETERS);
  const [backendParameters, setBackendParameters] = useState<BackendParameters>(DEFAULT_BACKEND_PARAMETERS);
  const sdk = useSDK<ConfigAppSDK<AppInstallationParameters>>();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});

  const onConfigure = useCallback(() => ({
    parameters: {
      ...parameters,
      installationUuid: parameters.installationUuid || window.crypto.randomUUID(),
    },
    targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
  }), [backendParameters, parameters, contentTypes, selectedFields, sdk]);

  const onConfigurationCompleted = useCallback(
    async (error: any) => {
      const genericErrorMessage =
        'Unable to store configuration. Please try again.';

      if (error) {
        sdk.notifier.error(genericErrorMessage);
        return;
      }

      const parameters = await sdk.app.getParameters<AppInstallationParameters>();
      const installationUuid = parameters?.installationUuid;

      try {
        if (backendParameters.apiSecret.length > 0 && installationUuid) {
          await updateBackendParameters(installationUuid, backendParameters, sdk);
          setBackendParameters({ apiSecret: '' });
        }
      } catch (e) {
        console.error(e);
        sdk.notifier.error(genericErrorMessage);
      }
    },
    [setBackendParameters, sdk.app.getParameters, backendParameters]
  );

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
    sdk.app.onConfigurationCompleted((error) => onConfigurationCompleted(error));
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const [currentParameters, contentTypesResponse, editorInterfacesResponse] = await Promise.all([
        sdk.app.getParameters<AppInstallationParameters>(),
        sdk.cma.contentType.getMany({}),
        sdk.cma.editorInterface.getMany({}),
      ]);

      setContentTypes(contentTypesResponse.items);
      setParameters({
        installationUuid: currentParameters?.installationUuid ?? window.crypto.randomUUID(),
        cloudName: currentParameters?.cloudName ?? DEFAULT_APP_INSTALLATION_PARAMETERS.cloudName,
        apiKey: currentParameters?.apiKey ?? DEFAULT_APP_INSTALLATION_PARAMETERS.apiKey,
        maxFiles: currentParameters?.maxFiles ?? DEFAULT_APP_INSTALLATION_PARAMETERS.maxFiles,
        startFolder: currentParameters?.startFolder ?? DEFAULT_APP_INSTALLATION_PARAMETERS.startFolder,
        quality: currentParameters?.quality ?? DEFAULT_APP_INSTALLATION_PARAMETERS.format,
        format: currentParameters?.format ?? DEFAULT_APP_INSTALLATION_PARAMETERS.format,
      });
      setSelectedFields(editorInterfacesToSelectedFields(editorInterfacesResponse.items, sdk.ids.app));

      sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <>
      <GlobalStyles />
      <div css={styles.background} />
      <div css={styles.body}>
        <Heading>About Cloudinary</Heading>
        <Paragraph>
          The Cloudinary app allows editors to select media from their Cloudinary account. Select the asset from Cloudinary that you want your entry to
          reference.
        </Paragraph>
        <hr css={styles.splitter} />
        <InstallParamsConfiguration
          parameters={parameters} onParametersChange={setParameters}
          backendParameters={backendParameters} onBackendParametersChange={setBackendParameters}
        />
        <hr css={styles.splitter} />
        <FieldSelector
          space={sdk.ids.space}
          environment={sdk.ids.environmentAlias ?? sdk.ids.environment}
          contentTypes={contentTypes}
          selectedFields={selectedFields}
          onSelectedFieldChanged={setSelectedFields}
        />
      </div>
      <div css={styles.icon}>
        <img src={logo} alt="App logo" />
      </div>
    </>
  );
};

export default ConfigScreen;
