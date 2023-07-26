import { ConfigAppSDK } from '@contentful/app-sdk';
import { GlobalStyles, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { css } from 'emotion';
import { useCallback, useEffect, useState } from 'react';
import logo from '../../assets/logo.svg';
import { DEFAULT_APP_INSTALLATION_PARAMETERS } from '../../constants';
import { AppInstallationParameters } from '../../types';
import { FieldSelector } from './FieldSelector';
import { SelectedFields, editorInterfacesToSelectedFields, selectedFieldsToTargetState } from './fields';
import { Configuration } from './Configuration';

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
  const sdk = useSDK<ConfigAppSDK<AppInstallationParameters>>();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});

  const onConfigure = useCallback(async () => {
    return {
      parameters,
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [parameters, contentTypes, selectedFields]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
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
      <div className={styles.background} />
      <div className={styles.body}>
        <Heading>About Cloudinary</Heading>
        <Paragraph>
          The Cloudinary app allows editors to select media from their Cloudinary account. Select the asset from Cloudinary that you want your entry to
          reference.
        </Paragraph>
        <hr className={styles.splitter} />
        <Configuration parameters={parameters} onParametersChange={setParameters} />
        <hr className={styles.splitter} />
        <FieldSelector
          space={sdk.ids.space}
          environment={sdk.ids.environmentAlias ?? sdk.ids.environment}
          contentTypes={contentTypes}
          selectedFields={selectedFields}
          onSelectedFieldChanged={setSelectedFields}
        />
      </div>
      <div className={styles.icon}>
        <img src={logo} alt="App logo" />
      </div>
    </>
  );
};

export default ConfigScreen;
