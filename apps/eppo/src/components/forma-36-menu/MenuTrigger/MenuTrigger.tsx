import React from 'react';

import type { ExpandProps } from '@contentful/f36-core';

import { useMenuContext } from '../MenuContext';
import { Popover } from '../../forma-36-popover';

export interface MenuTriggerProps {
  children: React.ReactNode;
}

export const MenuTrigger = (props: ExpandProps<MenuTriggerProps>) => {
  const child = React.Children.only(props.children) as any;
  const { getTriggerProps } = useMenuContext();

  return (
    <Popover.Trigger>
      {React.cloneElement(child, {
        ...getTriggerProps(child.props, child.ref),
        'aria-haspopup': 'menu',
      })}
    </Popover.Trigger>
  );
};
