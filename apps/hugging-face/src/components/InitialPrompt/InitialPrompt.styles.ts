import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

export const styles = {
  page: css({
    backgroundColor: tokens.colorWhite,
    margin: `0 ${tokens.spacingL}`,
    borderRadius: tokens.borderRadiusMedium,
    padding: tokens.spacingXl,
    alignItems: 'center',
    height: '100vh',
  }),
  contentWrapper: css({
    width: '900px',
    gap: tokens.spacingL,
  }),
  heading: css({
    marginBottom: tokens.spacing2Xs,
  }),
  subText: css({
    marginBottom: 0,
  }),
  form: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: tokens.spacingL,
  }),
  formHeading: css({
    fontSize: tokens.fontSizeL,
    marginBottom: 0,
  }),
  formControl: css({
    marginBottom: tokens.spacingS,
  }),
  formTextArea: css({
    height: '64px',
  }),
};
