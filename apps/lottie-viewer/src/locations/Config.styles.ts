import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  wrapper: css({
    display: 'flex',
    justifyContent: 'center',
    padding: tokens.spacingXl,
  }),
  configCard: css({
    display: 'flex',
    flexDirection: 'column',
    padding: `${tokens.spacingL} ${tokens.spacingL} ${tokens.spacingS} `,
    maxWidth: '960px',
  }),
  divider: css({
    border: 'none',
    borderTop: `1px solid ${tokens.gray200}`,
    margin: `${tokens.spacingL} 0`,
  }),
  pillsRow: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacing2Xs,
    marginTop: tokens.spacingS,
  }),
  heading: css({
    margin: 0,
  }),
  paragraph: css({
    marginTop: tokens.spacingS,
  }),
  textLink: css({
    svg: {
      width: '16px',
      height: '16px',
    },
  }),
  autocompleteMenu: css({
    '&[data-test-id="cf-autocomplete"]': {
      minWidth: '100%',
    },
  }),
};
