/**
 * Compact Sign-In Dialog - Shown when user is not authenticated
 * On successful sign-in, closes with { signedIn: true } to trigger the editor dialog
 */

import React, { useEffect } from "react";
import { DialogAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { IconButton, Button, Heading, Paragraph, Text } from "@contentful/f36-components";
import { XIcon } from "@contentful/f36-icons";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useAuth } from "../../contexts/AuthContext";

const DialogContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: ${tokens.spacingL};
  background: #fff;
  min-height: 100%;
  box-sizing: border-box;
`;

const CloseButtonContainer = styled.div`
  position: absolute;
  top: ${tokens.spacingS};
  right: ${tokens.spacingS};
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: ${tokens.spacingM};
  max-width: 320px;
  padding-top: ${tokens.spacingM};
`;

const LogoImg = styled.img`
  width: 160px;
  height: auto;
  display: block;
`;

const Microcopy = styled(Text)`
  color: ${tokens.gray500};
  font-size: 12px;
  line-height: 16px;
`;

const SignInDialog: React.FC = () => {
  const sdk = useSDK<DialogAppSDK>();
  const { isAuthenticated, isLoading, loginWithPopup, error } = useAuth();

  // When authentication succeeds, close dialog with success indicator
  useEffect(() => {
    if (isAuthenticated) {
      sdk.close({ signedIn: true });
    }
  }, [isAuthenticated, sdk]);

  const handleClose = () => {
    sdk.close({ signedIn: false });
  };

  const handleSignIn = async () => {
    try {
      await loginWithPopup();
      // The useEffect above will handle closing the dialog on success
    } catch (err) {
      console.error("[SignInDialog] Login failed:", err);
    }
  };

  return (
    <DialogContainer>
      <CloseButtonContainer>
        <IconButton
          aria-label="Close"
          icon={<XIcon />}
          variant="transparent"
          size="small"
          onClick={handleClose}
        />
      </CloseButtonContainer>

      <ContentWrapper>
        <LogoImg src="logos/markup_Logo_Horz_Coral.svg" alt="Markup AI" />

        <Heading as="h3" marginBottom="none">
          Sign in to Markup AI
        </Heading>

        <Paragraph marginBottom="none">
          Sign in to check, score, and improve your content with Markup AI.
        </Paragraph>

        <Button
          variant="primary"
          size="medium"
          onClick={() => {
            void handleSignIn();
          }}
          isDisabled={isLoading}
          isLoading={isLoading}
          style={{ width: "100%", marginTop: tokens.spacingS }}
        >
          Sign In
        </Button>

        <Microcopy as="p">
          Sign in securely using your Google or Microsoft account, or user credentials.
        </Microcopy>

        {error && (
          <Text fontColor="red600" as="p">
            {error}
          </Text>
        )}
      </ContentWrapper>
    </DialogContainer>
  );
};

export default SignInDialog;
