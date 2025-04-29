import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  modalContent: css({
    paddingBottom: 0,
  }),
  formControl: css({
    marginBottom: 0,
  }),
  textArea: css({
    paddingBottom: 0,
    height: '140px',
    maxHeight: '260px',
    minHeight: '64px',
  }),
  modalControls: css({
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),
};
