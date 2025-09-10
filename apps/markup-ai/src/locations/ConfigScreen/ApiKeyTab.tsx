import React from 'react';
import { TextInput, Paragraph, ValidationMessage } from '@contentful/f36-components';
import { ApiKeyTabWrapper, ApiKeyInputRow, ApiKeyLabel, ApiKeyHelpText } from './ConfigScreen.styles';
import { AppInstallationParameters } from './ConfigScreen';

interface ApiKeyTabProps {
  parameters: AppInstallationParameters;
  setParameters: React.Dispatch<React.SetStateAction<AppInstallationParameters>>;
  isInvalid?: boolean;
  validationMessage?: string;
}

export const ApiKeyTab: React.FC<ApiKeyTabProps> = ({ parameters, setParameters, isInvalid, validationMessage }) => {
  return (
    <ApiKeyTabWrapper>
      <Paragraph marginBottom="none" style={{ fontWeight: 500, color: '#5A657C', maxWidth: 1000 }}>
        Please enter your API key below. This key allows Contentful to securely connect with your Markup AI account
      </Paragraph>
      <ApiKeyInputRow>
        <ApiKeyLabel>API Key</ApiKeyLabel>
        <TextInput
          value={parameters.apiKey || ''}
          onChange={(e) => setParameters((prev) => ({ ...prev, apiKey: e.target.value }))}
          placeholder="Enter your API key"
          type="password"
          isInvalid={Boolean(isInvalid)}
          isRequired
          style={{ width: '100%' }}
        />
        {isInvalid && validationMessage ? <ValidationMessage>{validationMessage}</ValidationMessage> : null}
      </ApiKeyInputRow>
      <ApiKeyHelpText>
        Don't have an API key? You can create one on your{' '}
        <a
          href="https://console.markup.ai"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0059C8', textDecoration: 'underline' }}
        >
          Markup AI
        </a>{' '}
        account page.
      </ApiKeyHelpText>
    </ApiKeyTabWrapper>
  );
};
