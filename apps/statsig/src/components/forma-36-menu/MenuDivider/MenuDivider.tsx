import React from 'react';

import * as emotion from '@emotion/css';
import type { CommonProps, PropsWithHTMLElement, ExpandProps } from '@contentful/f36-core';

import { getMenuDividerStyles } from './MenuDivider.styles';

const { cx } = emotion;

export type MenuDividerProps = PropsWithHTMLElement<CommonProps, 'hr'>;

export const MenuDivider = (props: ExpandProps<MenuDividerProps>) => {
  const { children, testId = 'cf-ui-menu-divider', className, ...otherProps } = props;

  const styles = getMenuDividerStyles();

  return <hr aria-orientation="horizontal" data-test-id={testId} className={cx(styles, className)} {...otherProps} />;
};
