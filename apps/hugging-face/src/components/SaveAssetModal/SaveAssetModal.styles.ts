import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  modalContent: css({
    paddingBottom: 0,
  }),
  formControl: css({
    marginBottom: tokens.spacing2Xs,
  }),
  modalControls: css({
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),
};
