import React from 'react';

import type { ExpandProps } from '@contentful/f36-core';
import { ChevronRightIcon } from '@contentful/f36-icons';
import { cx } from 'emotion';

import { MenuItem, MenuItemProps } from '../MenuItem/MenuItem';
import { MenuTrigger } from '../MenuTrigger/MenuTrigger';
import { useSubmenuContext } from '../SubmenuContext';
import { getSubmenuTriggerStyles } from '../SubmenuTrigger/SubmenuTrigger.styles';

export type SubmenuTriggerProps = Omit<MenuItemProps<'button'>, 'isInitiallyFocused' | 'as'>;

const _SubmenuTrigger = (
  props: ExpandProps<SubmenuTriggerProps>,
  ref: React.Ref<HTMLButtonElement>,
) => {
  const { className, children } = props;
  const { getSubmenuTriggerProps, isOpen } = useSubmenuContext()!;

  const styles = getSubmenuTriggerStyles();

  return (
    <MenuTrigger>
      <MenuItem
        {...props}
        {...getSubmenuTriggerProps(props, ref)}
        className={cx(styles.root({ isActive: isOpen }), className)}
      >
        <span className={styles.content}>{children}</span>
        <ChevronRightIcon className={styles.icon} />
      </MenuItem>
    </MenuTrigger>
  );
};

export const SubmenuTrigger = React.forwardRef(_SubmenuTrigger);
