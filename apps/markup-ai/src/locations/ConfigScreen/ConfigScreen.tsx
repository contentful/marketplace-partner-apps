import React, { useState, useEffect, useCallback } from "react";
import { ConfigAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { Box, Spinner } from "@contentful/f36-components";
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

export type AppInstallationParameters = Record<string, never>;

export const ConfigScreen = () => {
  const sdk = useSDK<ConfigAppSDK>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
    void sdk.app.setReady();
  }, [sdk]);

  const onConfigure = useCallback(async () => {
    const currentState = await sdk.app.getCurrentState();
    return {
      parameters: {},
      targetState: currentState,
    };
  }, [sdk]);

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
        <FooterLogo href="https://markup.ai" target="_blank" rel="noopener noreferrer">
          <FooterLogoImage src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />
        </FooterLogo>
      </ContentArea>
    </ConfigScreenWrapper>
  );
};

export default ConfigScreen;
