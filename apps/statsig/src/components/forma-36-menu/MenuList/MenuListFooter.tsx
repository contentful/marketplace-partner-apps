import React from 'react';

import * as emotion from '@emotion/css';
import type { CommonProps, PropsWithHTMLElement, ExpandProps } from '@contentful/f36-core';
import { getMenuFooterStyles } from './MenuList.styles';

const { cx } = emotion;

export type MenuListFooterProps = PropsWithHTMLElement<CommonProps, 'div'>;

export const MenuListFooter: React.FC<ExpandProps<MenuListFooterProps>> = (props) => {
  const { children, testId = 'cf-ui-menu-list-footer', className, ...otherProps } = props;

  const styles = getMenuFooterStyles();

  return (
    <div data-test-id={testId} className={cx(styles, className)} {...otherProps}>
      {children}
    </div>
  );
};

MenuListFooter.displayName = 'MenuListFooter';
