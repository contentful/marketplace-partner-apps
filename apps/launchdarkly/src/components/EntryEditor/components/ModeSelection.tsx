import React, { useState } from 'react';
import { Card, Button, Flex, Heading, Modal, Text } from '@contentful/f36-components';
import { FlagMode } from '../../../types/launchdarkly';

interface ModeSelectionProps {
  flagMode: FlagMode;
  onModeChange: (mode: FlagMode) => void;
  onLoadExistingFlags: () => void;
  hasUnsavedChanges?: boolean;
  onResetForm: (mode?: FlagMode) => void;
  // When true, hide the Create button entirely (e.g., after a flag is created)
  hideCreateNew?: boolean;
  // When true, disable the Create button (e.g., while already in create mode)
  disableCreateNew?: boolean;
}

export const ModeSelection: React.FC<ModeSelectionProps> = ({ 
  flagMode, 
  onModeChange, 
  onLoadExistingFlags,
  hasUnsavedChanges = false,
  onResetForm,
  hideCreateNew = false,
  disableCreateNew = false
}) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingMode, setPendingMode] = useState<FlagMode>(null);

    const handleModeChange = (newMode: FlagMode) => {
    if (hasUnsavedChanges && flagMode !== null) {
      setPendingMode(newMode);
      setShowConfirmation(true);
    } else {
      onModeChange(newMode);
      if (newMode === 'existing') {
        onLoadExistingFlags();
      } else {
        onResetForm(newMode);
      }
    }
  };

  const confirmModeChange = () => {
    onModeChange(pendingMode);
    if (pendingMode === 'existing') {
      onLoadExistingFlags();
    } else {
      onResetForm(pendingMode);
    }
    setShowConfirmation(false);
  };

  const cancelModeChange = () => {
    setPendingMode(null);
    setShowConfirmation(false);
  };

  return (
    <>
      <Card padding="default" style={{ marginBottom: '16px' }}>
        <Heading as="h3" style={{ fontSize: '18px', fontWeight: 'semiBold', marginBottom: '6px' }}>
          Choose what you want to do
        </Heading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          <Text fontColor="gray600">
            These are two separate processes. You can create a flag or you can map content to existing flag variations.
          </Text>
          <Text fontColor="gray600" style={{ fontStyle: 'italic' }}>
            * You cannot modify existing flags or flag variations.
          </Text>
        </div>
        <Flex justifyContent="flex-start" gap="spacingL" marginTop="spacingL">
          {!hideCreateNew && (
            <Button
              variant={flagMode === 'new' ? 'primary' : 'secondary'}
              onClick={() => handleModeChange('new')}
              size="medium"
              isDisabled={disableCreateNew}
            >
              Create New Flag
            </Button>
          )}
          <Button
            variant={flagMode === 'existing' ? 'primary' : 'secondary'}
            onClick={() => handleModeChange('existing')}
            size="medium"
            isDisabled={flagMode === 'existing'}
          >
            Map Content to Flag
          </Button>
        </Flex>
      </Card>

      {showConfirmation && (
        <Modal
          title="Unsaved Changes"
          isShown={showConfirmation}
          onClose={cancelModeChange}
        >
          <Modal.Content>
            <Text>
              You have unsaved changes. Switching modes will discard these changes. Are you sure you want to continue?
            </Text>
          </Modal.Content>
          <Modal.Controls>
            <Button
              variant="secondary"
              onClick={cancelModeChange}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmModeChange}
            >
              Switch Modes
            </Button>
          </Modal.Controls>
        </Modal>
      )}
    </>
  );
}; 