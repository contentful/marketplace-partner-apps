import React, { useState, useEffect, useCallback } from 'react';
import { ConfigAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { Box, Spinner } from '@contentful/f36-components';
import { ApiKeyTab } from './ApiKeyTab';
import { fetchStyleGuides } from '../../services/apiService';
import {
  ConfigScreenWrapper,
  ContentArea,
  TopCover,
  AppConfigHeader,
  AppConfigTitle,
  AppConfigDescription,
  FooterLogo,
  FooterLogoImage,
} from './ConfigScreen.styles';

export interface AppInstallationParameters {
  apiKey?: string;
}

export const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [loading, setLoading] = useState(true);
  const [apiKeyError, setApiKeyError] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) setParameters(currentParameters);
      setLoading(false);
      sdk.app.setReady();
    })();
  }, [sdk]);

  // Only API key is configured at app level now

  const onConfigure = useCallback(async () => {
    setApiKeyError(undefined);

    if (!parameters.apiKey || parameters.apiKey.trim().length === 0) {
      const message = 'API key is required.';
      setApiKeyError(message);
      sdk.notifier.error(message);
      return false;
    }

    try {
      await fetchStyleGuides({ apiKey: parameters.apiKey });
    } catch {
      const message = 'Invalid API key. Please verify and try again.';
      setApiKeyError(message);
      sdk.notifier.error(message);
      return false;
    }

    const currentState = await sdk.app.getCurrentState();
    return {
      parameters,
      targetState: currentState,
    };
  }, [parameters, sdk]);

  useEffect(() => {
    sdk.app.onConfigure(() => onConfigure());
  }, [sdk, onConfigure]);

  if (loading)
    return (
      <Box marginTop="spacingXl">
        <Spinner size="large" />
      </Box>
    );

  return (
    <ConfigScreenWrapper>
      <TopCover />
      <ContentArea>
        <AppConfigHeader>
          <AppConfigTitle>Configure the Markup AI App</AppConfigTitle>
          <AppConfigDescription>
            To connect Markup AI with your Contentful space, please complete the following step
          </AppConfigDescription>
        </AppConfigHeader>
        <ApiKeyTab
          parameters={parameters}
          setParameters={setParameters}
          isInvalid={Boolean(apiKeyError)}
          validationMessage={apiKeyError}
        />
        <FooterLogo href="https://markup.ai" target="_blank" rel="noopener noreferrer">
          <FooterLogoImage src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />
        </FooterLogo>
      </ContentArea>
    </ConfigScreenWrapper>
  );
};

export default ConfigScreen;
