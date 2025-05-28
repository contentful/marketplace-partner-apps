import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  modalContentContainer: css({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  }),
  lottieAnimatorContainer: css({
    flexDirection: 'column',
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    height: '100%',
    border: `1px solid ${tokens.gray400}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
  greyBar: css({
    backgroundColor: tokens.gray400,
    height: '48px',
    width: '100%',
  }),
  buttonContainer: css({
    padding: '16px 0 0 0',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'flex-end',
  }),
  lottieJsonEditorButtons: css({
    maxHeight: '32px',
    minHeight: '32px',
    minWidth: '66px',
    maxWidth: '66px',
    padding: '4px 2px',
    fontSize: tokens.fontSizeM,
  }),
};
