import { Menu, ButtonGroup, Button, IconButton } from '@contentful/f36-components';
import { ChevronDownIcon } from '@contentful/f36-icons';
import { css } from '@emotion/react';
import { useState, useMemo, useEffect } from 'react';
import { ActionsButtonProps, ButtonAction } from './ActionsButton.types';

const fullWidth = css({ maxWidth: 'none', flexGrow: 1 });

export function ActionsButton<L extends string = string>({
  isDisabled = false,
  isFullWidth = false,
  actions,
  onSelect,
  onToggleOpen,
  delayOpen,
  ...menuProps
}: ActionsButtonProps<L>) {
  const [actionIndex, setActionIndex] = useState(0);
  const action = useMemo<ButtonAction<L> | undefined>(() => actions[actionIndex], [actionIndex, actions]);
  const [isOpen, _setIsOpen] = useState(false);

  const setIsOpen = (newIsOpen: boolean) => {
    if (onToggleOpen) onToggleOpen(newIsOpen);
    if (delayOpen && !isOpen) {
      setTimeout(() => _setIsOpen(newIsOpen), delayOpen);
    } else {
      _setIsOpen(newIsOpen);
    }
  };

  useEffect(() => {
    if (!onSelect || !action) return;
    onSelect(action);
  }, [actionIndex]);

  if (!action) return null;

  return (
    <Menu isOpen={isOpen} onClose={() => setIsOpen(false)} {...menuProps}>
      <Menu.Trigger>
        <ButtonGroup>
          <Button
            variant={action.variant}
            isDisabled={isDisabled}
            css={[isFullWidth && fullWidth]}
            onClick={() => {
              if (isOpen) setIsOpen(false);
              action.onClick();
            }}>
            {action.label}
          </Button>

          <IconButton variant={action.variant} aria-label="Open dropdown" icon={<ChevronDownIcon />} onClick={() => setIsOpen(!isOpen)} />
        </ButtonGroup>
      </Menu.Trigger>
      <Menu.List>
        <Menu.SectionTitle>Actions</Menu.SectionTitle>
        {actions.map((action, index) => (
          <Menu.Item onClick={() => setActionIndex(index)} key={action.label}>
            {action.label}
          </Menu.Item>
        ))}
      </Menu.List>
    </Menu>
  );
}
