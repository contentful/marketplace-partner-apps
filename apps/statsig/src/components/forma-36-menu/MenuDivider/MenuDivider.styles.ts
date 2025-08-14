import tokens from '@contentful/f36-tokens';
import { css } from '@emotion/css';

export const getMenuDividerStyles = () =>
  css({
    border: 'none',
    width: '100%',
    height: '1px',
    backgroundColor: tokens.gray200,
    margin: `${tokens.spacing2Xs} 0`,
  });
