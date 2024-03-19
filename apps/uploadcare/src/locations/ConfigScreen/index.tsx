import { ConfigAppSDK, OnConfigureHandler } from '@contentful/app-sdk';
import { GlobalStyles, Heading, Paragraph } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { useSDK } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { css } from '@emotion/css';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import logo from '../../assets/logo.svg';
import { DEFAULT_PARAMS } from '../../constants';
import { InstallParams, InstallParamsValidationErrors } from '../../types';
import { getEmptyInstallParamsValidationErrorsObject, isPublicKeyInvalid, validateInstallParams } from '../../utils';
import { Configuration } from './Configuration';
import { editorInterfacesToSelectedFields, SelectedFields, selectedFieldsToTargetState } from './fields';
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
  const sdk = useSDK<ConfigAppSDK<InstallParams>>();

  const [params, setParams] = useState<InstallParams>({
    ...DEFAULT_PARAMS,
  });
  const [paramsValidationErrors, setParamsValidationErrors] = useState<InstallParamsValidationErrors>(
    getEmptyInstallParamsValidationErrorsObject(params),
  );
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [selectedFields, setSelectedFields] = useState<SelectedFields>({});

  const onConfigure = useCallback<OnConfigureHandler>(async () => {
    const validationErrors = validateInstallParams(params);

    // we're validating the key separately here, because validation function is used in the Field too
    // and we do not want to send network requests there
    if (!validationErrors.apiKey && (await isPublicKeyInvalid(params.apiKey))) {
      validationErrors.apiKey = 'Public API key does not look valid.';
    }

    if (!Object.values(validationErrors).every(v => !v)) {
      setParamsValidationErrors(validationErrors);
      return false;
    }

    setParamsValidationErrors(getEmptyInstallParamsValidationErrorsObject(params));

    return {
      parameters: params,
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields),
    };
  }, [params, contentTypes, selectedFields]);

  useEffect(() => {
    sdk.app.onConfigure(onConfigure);
  }, [sdk, onConfigure]);

  useEffect(() => {
    (async () => {
      const currentParams = await sdk.app.getParameters<InstallParams>();
      const contentTypesResponse = await sdk.cma.contentType.getMany({});
      const editorInterfacesResponse = await sdk.cma.editorInterface.getMany({});

      setContentTypes(contentTypesResponse.items);
      setParams({
        ...DEFAULT_PARAMS,
        ...currentParams,
        uploadSources: {
          ...DEFAULT_PARAMS.uploadSources,
          ...currentParams?.uploadSources,
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

        <Configuration params={params} paramsValidationErrors={paramsValidationErrors} onParamsChange={setParams} />

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
