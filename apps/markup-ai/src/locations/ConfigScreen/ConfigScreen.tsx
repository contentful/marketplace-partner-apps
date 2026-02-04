import React, { useState, useEffect, useCallback } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Box, Spinner, Note } from "@contentful/f36-components";
import { useApiService } from "../../hooks/useApiService";
import {
  ConfigScreenWrapper,
  ContentArea,
  TopCover,
  AppConfigHeader,
  AppConfigTitle,
  AppConfigDescription,
  FooterLogo,
  FooterLogoImage,
} from "./ConfigScreen.styles";

export interface AppInstallationParameters {
  apiKey?: string;
}

export const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [parameters, setParameters] = useState<AppInstallationParameters>({});
  const [loading, setLoading] = useState(true);
  const [apiKeyError] = useState<string | undefined>(undefined);

  // Use the API service for validation
  const config = parameters.apiKey ? { apiKey: parameters.apiKey } : undefined;
  useApiService(config || { apiKey: "" });

  useEffect(() => {
    void (async () => {
      const currentParameters = await sdk.app.getParameters();
      if (currentParameters) setParameters(currentParameters);
      setLoading(false);
      void sdk.app.setReady();
    })();
  }, [sdk]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters: {},
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
          <AppConfigTitle>Markup AI App</AppConfigTitle>
          <AppConfigDescription>
            No installation-time configuration is required. Users will sign in via SSO from the
            sidebar settings.
          </AppConfigDescription>
        </AppConfigHeader>
        {apiKeyError && (
          <Note variant="negative" title="Configuration error">
            {apiKeyError}
          </Note>
        )}
        <FooterLogo href="https://markup.ai" target="_blank" rel="noopener noreferrer">
          <FooterLogoImage src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />
        </FooterLogo>
      </ContentArea>
    </ConfigScreenWrapper>
  );
};

export default ConfigScreen;
