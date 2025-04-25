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
  lottieReactContainer: css({
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  }),
  dotLottieReact: css({
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
  }),
  buttonContainer: css({
    padding: '16px 0 0 0',
    backgroundColor: '#fff',
    display: 'flex',
    justifyContent: 'flex-end',
  }),
};
