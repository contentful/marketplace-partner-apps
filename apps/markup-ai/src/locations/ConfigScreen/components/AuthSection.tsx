/**
 * AuthSection - Optional sign-in section for the config screen
 * Allows users to authenticate with Markup AI to enable content type defaults
 */

import React from "react";
import { Button, Text, Spinner } from "@contentful/f36-components";
import styled from "@emotion/styled";
import tokens from "@contentful/f36-tokens";
import { useAuth } from "../../../contexts/AuthContext";

const SectionWrapper = styled.div`
  width: 100%;
  margin-bottom: 24px;
  padding: 20px;
  background: linear-gradient(135deg, #fef7f6 0%, #fff9f8 100%);
  border-radius: 8px;
  border: 1px solid #f9d4d0;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
`;

const TitleArea = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.img`
  height: 24px;
  width: auto;
`;

const SectionTitle = styled.h4`
  font-family: "Geist", sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #111b2b;
  margin: 0;
`;

const StatusBadge = styled.span<{ $isAuthenticated: boolean }>`
  font-family: "Geist", sans-serif;
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
  padding: 2px 8px;
  border-radius: 10px;
  background: ${({ $isAuthenticated }) => ($isAuthenticated ? "#e6f4ea" : "#fff3e0")};
  color: ${({ $isAuthenticated }) => ($isAuthenticated ? "#137333" : "#e65100")};
`;

const Description = styled.p`
  font-family: "Geist", sans-serif;
  font-size: 13px;
  line-height: 18px;
  color: #5a657c;
  margin: 12px 0 0 0;
`;

const UserInfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid ${tokens.gray200};
`;

const UserEmail = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 13px;
  color: #111b2b;
  flex: 1;
`;

const ActionArea = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
`;

const OptionalNote = styled.span`
  font-family: "Geist", sans-serif;
  font-size: 11px;
  color: ${tokens.gray500};
  font-style: italic;
`;

export const AuthSection: React.FC = () => {
  const { isLoading, isAuthenticated, user, loginWithPopup, logout, error } = useAuth();

  const handleSignIn = async () => {
    try {
      await loginWithPopup();
    } catch (err) {
      console.error("[AuthSection] Login failed:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("[AuthSection] Logout failed:", err);
    }
  };

  if (isLoading) {
    return (
      <SectionWrapper>
        <SectionHeader>
          <TitleArea>
            <LogoImage src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
            <SectionTitle>Markup AI Account</SectionTitle>
          </TitleArea>
          <Spinner size="small" />
        </SectionHeader>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper>
      <SectionHeader>
        <TitleArea>
          <LogoImage src="logos/markup_Logo_Mark_Coral.svg" alt="Markup AI" />
          <SectionTitle>Markup AI Account</SectionTitle>
          <StatusBadge $isAuthenticated={isAuthenticated}>
            {isAuthenticated ? "Signed in" : "Not signed in"}
          </StatusBadge>
        </TitleArea>
      </SectionHeader>

      {isAuthenticated ? (
        <>
          <Description>
            You can set default style guide, dialect, and tone for each content type below. These
            defaults will apply to all fields unless overridden in the field editor.
          </Description>
          <UserInfoRow>
            <UserEmail>{(user?.email as string) || (user?.name as string) || "User"}</UserEmail>
            <Button variant="secondary" size="small" onClick={handleSignOut}>
              Sign out
            </Button>
          </UserInfoRow>
        </>
      ) : (
        <>
          <Description>
            Sign in to configure default style guide, dialect, and tone settings for each content
            type. These defaults will be used when checking content with Markup AI.
          </Description>
          <ActionArea>
            <Button variant="primary" size="small" onClick={handleSignIn} isDisabled={isLoading}>
              Sign in to Markup AI
            </Button>
            <OptionalNote>
              Optional - you can still enable Markup AI without signing in
            </OptionalNote>
          </ActionArea>
          {error && (
            <Text fontColor="red600" as="p" marginTop="spacingS">
              {error}
            </Text>
          )}
        </>
      )}
    </SectionWrapper>
  );
};

export default AuthSection;
