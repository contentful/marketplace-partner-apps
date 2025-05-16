import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  modalContent: css({
    paddingBottom: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }),
  contentWrapper: css({
    width: '1024px',
    height: '100%',
    gap: tokens.spacingL,
    flexDirection: 'column',
  }),
  heading: css({
    marginBottom: 0,
  }),
  promptSection: css({
    width: '600px',
  }),
  promptText: css({
    marginBottom: 0,
  }),
  timerSectionCompact: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: `${tokens.spacingS} ${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingM}`,
    gap: tokens.spacingXs,
  }),
  clockIcon: css({
    fill: tokens.gray900,
  }),
  timer: css({
    marginBottom: 0,
  }),
  error: css({
    height: '100%',
    width: '100%',
    border: `1px solid ${tokens.red500}`,
    borderRadius: tokens.borderRadiusSmall,
  }),
  modalControls: css({
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),
};
