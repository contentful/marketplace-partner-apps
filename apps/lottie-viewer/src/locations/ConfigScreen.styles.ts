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
    maxWidth: '900px',
  }),
  divider: css({
    border: 'none',
    borderTop: `1px solid ${tokens.gray200}`,
    margin: `${tokens.spacingL} 0`,
  }),
  pillsRow: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingXs,
    margin: `${tokens.spacingS} 0`,
  }),
  heading: css({
    margin: 0,
  }),
  paragraph: css({
    marginTop: tokens.spacingS,
  }),
  note: css({
    marginTop: tokens.spacingL,
    marginBottom: tokens.spacingS,
  }),
  textLink: css({
    svg: {
      width: '16px',
      height: '16px',
    },
  }),
};
