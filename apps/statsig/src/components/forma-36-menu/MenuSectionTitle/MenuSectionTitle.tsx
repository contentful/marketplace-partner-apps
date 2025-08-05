import React from 'react';

import type { ExpandProps } from '@contentful/f36-core';
import { Caption, CaptionProps } from '@contentful/f36-typography';
import { cx } from '@emotion/css';
import { getMenuSectionTitleStyles } from './MenuSectionTitle.styles';

export type MenuSectionTitleProps = CaptionProps;

export const MenuSectionTitle = (props: ExpandProps<MenuSectionTitleProps>) => {
  const { children, testId = 'cf-ui-menu-section-title', className, ...otherProps } = props;

  const styles = getMenuSectionTitleStyles();

  return (
    <Caption
      // Technically, menus cannot contain headings according to ARIA.
      // We hide the heading from assistive technology, and only use it
      // as a label
      aria-hidden="true"
      as="div"
      testId={testId}
      className={cx(styles, className)}
      marginBottom="none"
      {...otherProps}>
      {children}
    </Caption>
  );
};
