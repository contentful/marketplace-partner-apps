import React, { useState } from 'react';
import {
  FormControl,
  TextInput,
  Button,
  Spinner,
  Note,
  Paragraph,
} from '@contentful/f36-components';

interface ApiKeySectionProps {
  apiKey: string;
  isLoading: boolean;
  validation: {
    isValidating: boolean;
    error: string | null;
    isValid: boolean;
  };
  onChange: (apiKey: string) => void;
  onValidate: () => void;
}

/**
 * Component for API key input and validation
 */
const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  apiKey,
  isLoading,
  validation,
  onChange,
  onValidate,
}) => {
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <FormControl>
      <FormControl.Label>LaunchDarkly API Key</FormControl.Label>
      <Paragraph marginBottom="spacingXs">
        Enter your LaunchDarkly API key to connect to your account
      </Paragraph>
      
      {apiKey && !validation.isValid && !validation.isValidating && (
        <Note variant="warning" style={{ marginBottom: '12px' }}>
          API key is stored but needs to be re-validated. Please click &quot;Verify&quot; to confirm your credentials.
        </Note>
      )}
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <TextInput
          name="apiKey"
          id="apiKey"
          type={showApiKey ? 'text' : 'password'}
          value={apiKey}
          placeholder="Enter your LaunchDarkly API key"
          onChange={(e) => onChange(e.target.value)}
          style={{ flexGrow: 1 }}
          isDisabled={validation.isValidating || isLoading}
          isInvalid={!!validation.error}
        />
        
        <Button
          size="small"
          variant="secondary"
          onClick={() => setShowApiKey(!showApiKey)}
          isDisabled={validation.isValidating || isLoading}
        >
          {showApiKey ? 'Hide' : 'Show'}
        </Button>
        
        <Button
          size="small"
          variant="primary"
          onClick={onValidate}
          isDisabled={!apiKey || validation.isValidating || isLoading}
          isLoading={validation.isValidating}
        >
          {validation.isValidating ? (
            <Spinner size="small" />
          ) : validation.isValid ? (
            'Re-verify'
          ) : (
            'Verify'
          )}
        </Button>
      </div>
      
      {validation.error && (
        <Note variant="negative">{validation.error}</Note>
      )}
      
      {validation.isValid && (
        <Note variant="positive">
          ✓ API key is valid and connected to LaunchDarkly
        </Note>
      )}
    </FormControl>
  );
};

export default ApiKeySection; 