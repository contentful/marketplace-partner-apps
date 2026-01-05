import React from "react";
import { Card, Flex, Heading, Paragraph, Button, Text } from "@contentful/f36-components";
import styled from "@emotion/styled";
import { useAuth } from "../../contexts/AuthContext";

const Wrapper = styled.div`
  padding: 16px;
`;

const CardInner = styled(Flex)`
  flex-direction: column;
  align-items: center;
  gap: var(--f36-spacing-m, 16px);
  text-align: center;
`;

const LogoImg = styled.img`
  width: 140px;
  height: auto;
  display: block;
`;

const Microcopy = styled(Text)`
  color: #7a869a;
  font-size: 12px;
  line-height: 16px;
  margin-top: 4px;
`;

const SignInCard: React.FC = () => {
  const { isLoading, loginWithPopup, error } = useAuth();

  return (
    <Wrapper>
      <Card style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(17,27,43,0.07)" }}>
        <CardInner>
          {/* Exact horizontal logo (mark + wordmark) */}
          <LogoImg src="logos/markup_Logo_Horz_Coral.svg" alt="markup ai" />

          <Heading as="h3">Sign in to Markup AI</Heading>
          <Paragraph>Check, score, and improve your content with Markup AI.</Paragraph>

          <Button
            variant="primary"
            size="small"
            onClick={async () => {
              try {
                await loginWithPopup();
              } catch (err) {
                console.error("[SignInCard] Login failed:", err);
              }
            }}
            isDisabled={isLoading}
            isLoading={isLoading}
            style={{ width: "100%" }}
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
        </CardInner>
      </Card>
    </Wrapper>
  );
};

export default SignInCard;
