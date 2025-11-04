import React, { useState } from 'react';
import { Modal, Button, FormControl, TextInput, Paragraph } from '@contentful/f36-components';

interface KeyRotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (newKey: string) => Promise<void>;
}

export const KeyRotationModal: React.FC<KeyRotationModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [newKey, setNewKey] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    if (!newKey.trim()) {
      setError('Please enter a valid API key');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      await onUpdate(newKey);
      setNewKey('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update API key');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setNewKey('');
    setError(null);
    onClose();
  };

  return (
    <Modal onClose={handleClose} isShown={isOpen}>
      {() => (
        <>
          <Modal.Header title="Update API Key" onClose={handleClose} />
          <Modal.Content>
            <Paragraph marginBottom="spacingM">
              If you've rotated your LaunchDarkly API key, enter the new key here to update the integration.
            </Paragraph>
            <FormControl isInvalid={!!error}>
              <FormControl.Label>New API Key</FormControl.Label>
              <TextInput
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                type="password"
                placeholder="api-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              {error && <FormControl.ValidationMessage>{error}</FormControl.ValidationMessage>}
            </FormControl>
          </Modal.Content>
          <Modal.Controls>
            <Button onClick={handleClose} variant="secondary" isDisabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} variant="positive" isLoading={isUpdating}>
              Update Key
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

