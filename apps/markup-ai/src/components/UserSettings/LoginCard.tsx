import React, { useState } from 'react';
import { Card, Flex, Heading, Paragraph, TextInput, Button, Note } from '@contentful/f36-components';
import { LockIcon } from '@contentful/f36-icons';
import styled from '@emotion/styled';

const Wrapper = styled.div`
  padding: 16px;
`;

type LoginCardProps = {
  initialApiKey?: string | null;
  onSave: (apiKey: string) => void;
  onClear?: () => void;
  error?: string | null;
};

export const LoginCard: React.FC<LoginCardProps> = ({ initialApiKey = '', onSave, onClear, error }) => {
  const [apiKey, setApiKey] = useState<string>(initialApiKey || '');

  return (
    <Wrapper>
      <Card>
        <Flex flexDirection="column" gap="spacingM">
          <Flex alignItems="center" gap="spacingS">
            <LockIcon variant="muted" />
            <Heading as="h3">Markup AI Login</Heading>
          </Flex>
          <Paragraph>Enter your Markup AI API key to enable content analysis and rewriting in this sidebar.</Paragraph>
          {error && (
            <Note variant="negative" title="Error">
              {error}
            </Note>
          )}
          <TextInput
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
          <Flex gap="spacingS">
            <Button isDisabled={!apiKey} onClick={() => onSave(apiKey)}>
              Save & Continue
            </Button>
            {onClear && (
              <Button variant="negative" onClick={onClear}>
                Clear Key
              </Button>
            )}
          </Flex>
        </Flex>
      </Card>
    </Wrapper>
  );
};

export default LoginCard;
