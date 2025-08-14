import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const getSubmenuTriggerStyles = () => {
  return {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    root: ({ isActive }) =>
      css({
        display: 'flex',
        alignItems: 'center',
        paddingRight: tokens.spacingXs,
        ...(isActive
          ? {
              backgroundColor: tokens.gray100,
            }
          : {}),
      }),
    content: css({
      marginRight: tokens.spacingM,
    }),
    icon: css({
      marginLeft: 'auto',
      fill: 'currentColor',
    }),
  };
};
