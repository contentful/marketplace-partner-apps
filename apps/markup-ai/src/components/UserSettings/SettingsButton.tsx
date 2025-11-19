import React from 'react';
import { IconButton, Tooltip } from '@contentful/f36-components';
import { GearSixIcon } from '@contentful/f36-icons';

type SettingsButtonProps = {
  onClick: () => void;
};

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <Tooltip content="Settings">
      <IconButton
        aria-label="Open settings"
        size="small"
        variant="transparent"
        icon={<GearSixIcon />}
        onClick={onClick}
      />
    </Tooltip>
  );
};

export default SettingsButton;
