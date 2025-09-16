import React, { useState, useEffect } from 'react';
import { Modal, Paragraph, Button, Flex, FormControl, TextInput } from '@contentful/f36-components';
import StyleSettings from './StyleSettings';

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  dialect: string | null;
  tone: string | null;
  styleGuide: string | null;
  onApiKeyClear: () => void;
  onApiKeyChange: (apiKey: string) => void;
  onDialectChange: (v: string | null) => void;
  onToneChange: (v: string | null) => void;
  onStyleGuideChange: (v: string | null) => void;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  dialect,
  tone,
  styleGuide,
  onApiKeyClear,
  onApiKeyChange,
  onDialectChange,
  onToneChange,
  onStyleGuideChange,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(apiKey);

  useEffect(() => {
    setApiKeyInput(apiKey);
  }, [apiKey]);

  return (
    <Modal onClose={onClose} isShown={isOpen} size="large">
      <Modal.Header title="User Settings" onClose={onClose} />
      <Modal.Content>
        <Paragraph>Configure your preferences. These are stored locally in your browser.</Paragraph>
        <FormControl>
          <FormControl.Label>API Key</FormControl.Label>
          <TextInput
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="Enter your API key"
          />
        </FormControl>
        <StyleSettings
          apiKey={apiKey}
          dialect={dialect}
          tone={tone}
          styleGuide={styleGuide}
          onDialectChange={onDialectChange}
          onToneChange={onToneChange}
          onStyleGuideChange={onStyleGuideChange}
        />
      </Modal.Content>
      <Modal.Controls>
        <Flex gap="spacingS">
          <Button variant="secondary" onClick={() => onApiKeyChange(apiKeyInput)} isDisabled={!apiKeyInput}>
            Save API Key
          </Button>
          <Button variant="secondary" onClick={onApiKeyClear}>
            Clear API Key
          </Button>
          <Button onClick={onClose}>Done</Button>
        </Flex>
      </Modal.Controls>
    </Modal>
  );
};

export default SettingsModal;
