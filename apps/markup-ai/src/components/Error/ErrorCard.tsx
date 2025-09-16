import React from 'react';
import { Note, IconButton, Flex } from '@contentful/f36-components';
import { CloseIcon } from '@contentful/f36-icons';

interface ErrorCardProps {
  message: string;
  onClose: () => void;
}

export const ErrorCard: React.FC<ErrorCardProps> = ({ message, onClose }) => {
  return (
    <Note variant="negative" style={{ marginBottom: '8px' }} data-testid="error-note">
      <Flex justifyContent="space-between" alignItems="center">
        <span>{message}</span>
        <IconButton
          variant="transparent"
          size="small"
          aria-label="Close error message"
          icon={<CloseIcon />}
          onClick={onClose}
        />
      </Flex>
    </Note>
  );
};
