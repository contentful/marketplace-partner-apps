import { ConfigAppSDK, OnConfigureHandler } from '@contentful/app-sdk';
import { GlobalStyles, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { css } from 'emotion';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import logo from '../../assets/logo.svg';
import { DEFAULT_PARAMETERS } from '../../constants';
import { AppInstallationParameters } from '../../types';
import { Configuration } from './Configuration';
import {
  AppInstallationParametersValidationErrors,
  editorInterfacesToSelectedFields,
  getEmptyParamsValidationErrorsObject,
  SelectedFields,
  selectedFieldsToTargetState,
  validateParameters,
} from './fields';
import { FieldSelector } from './FieldSelector';

const styles = {
  body: css({
    height: 'auto',
    minHeight: '65vh',
    margin: '0 auto',
    marginTop: tokens.spacingXl,
    padding: `${tokens.spacingXl} ${tokens.spacing2Xl}`,
    maxWidth: tokens.contentWidthText,
    backgroundColor: tokens.colorWhite,
    borderRadius: '8px',
    border: `1px solid ${tokens.gray300}`,
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
  logo: css({
    display: 'flex',
    justifyContent: 'center',
    '> img': {
      display: 'block',
      width: '70px',
      margin: `${tokens.spacingXl} 0`,
    },
  }),
};

export default function ConfigScreen(): ReactElement {
  const sdk = useSDK<ConfigAppSDK<AppInstallationParameters>>();

  const [parameters, setParameters] = useState<AppInstallationParameters>({
    ...DEFAULT_PARAMETERS,
  });
  const [parametersValidationErrors, setParametersValidationErrors] =
    useState<AppInstallationParametersValidationErrors>(getEmptyParamsValidationErrorsObject(parameters));
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});

  const onConfigure = useCallback<OnConfigureHandler>(async () => {
    const validationErrors = await validateParameters(parameters);

    if (!Object.values(validationErrors).every(v => !v)) {
      setParametersValidationErrors(validationErrors);
      return false;
    }

    setParametersValidationErrors(getEmptyParamsValidationErrorsObject(parameters));

    return {
      parameters,
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [parameters, contentTypes, selectedFields]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters<AppInstallationParameters>();
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      const editorInterfacesResponse = await sdk.cma.editorInterface.getMany({});

      setContentTypes(contentTypesResponse.items);
      setParameters({
        ...DEFAULT_PARAMETERS,
        ...currentParameters,
        uploadSources: {
          ...DEFAULT_PARAMETERS.uploadSources,
          ...currentParameters?.uploadSources,
        },
      });
      setSelectedFields(editorInterfacesToSelectedFields(editorInterfacesResponse.items, sdk.ids.app));

      await sdk.app.setReady();
    })();
  }, [sdk]);

  return (
    <>
      <GlobalStyles />

      <div className={styles.body}>
        <Heading>About Uploadcare</Heading>

        <Paragraph>The Uploadcare app allows editors to upload media to Uploadcare account.</Paragraph>

        <hr className={styles.splitter} />

        <Configuration
          parameters={parameters}
          parametersValidationErrors={parametersValidationErrors}
          onParametersChange={setParameters}
        />

        <hr className={styles.splitter} />

        <FieldSelector
          space={sdk.ids.space}
          environment={sdk.ids.environmentAlias ?? sdk.ids.environment}
          contentTypes={contentTypes}
          selectedFields={selectedFields}
          onSelectedFieldChanged={setSelectedFields}
        />
      </div>

      <div className={styles.logo}>
        <img src={logo} alt="App logo" />
      </div>
    </>
  );
}
