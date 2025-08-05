import React, { forwardRef } from 'react';

import { CommonProps } from '@contentful/f36-core';
import * as emotion from '@emotion/css';
import { ChevronRightIcon } from '@contentful/f36-icons';
import { getSubmenuTriggerStyles } from '../SubmenuTrigger/SubmenuTrigger.styles';

const { cx } = emotion;

import { MenuItem, MenuItemProps } from '../MenuItem/MenuItem';
import { MenuTrigger } from '../MenuTrigger/MenuTrigger';
import { useSubmenuContext } from '../SubmenuContext';

export type SubmenuTriggerProps = Omit<MenuItemProps<'button'>, 'isInitiallyFocused' | 'as'>;

const _SubmenuTrigger = (props: CommonProps<SubmenuTriggerProps>, ref: React.Ref<HTMLButtonElement>) => {
  const { className, children } = props;
  const { getSubmenuTriggerProps, isOpen } = useSubmenuContext()!;

  const styles = getSubmenuTriggerStyles();

  return (
    <MenuTrigger>
      <MenuItem {...props} {...getSubmenuTriggerProps(props, ref)} className={cx(styles.root({ isActive: isOpen }), className)}>
        <span className={styles.content}>{children}</span>
        <ChevronRightIcon className={styles.icon} />
      </MenuItem>
    </MenuTrigger>
  );
};

export const SubmenuTrigger = forwardRef(_SubmenuTrigger);
