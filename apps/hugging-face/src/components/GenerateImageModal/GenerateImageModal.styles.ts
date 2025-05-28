import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  // Modal and main container styles
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
  modalControls: css({
    padding: `${tokens.spacingM} ${tokens.spacingL}`,
  }),

  // Header section styles
  heading: css({
    marginBottom: 0,
  }),
  timerSectionCompact: css({
    border: `1px solid ${tokens.gray300}`,
    borderRadius: tokens.borderRadiusSmall,
    padding: `${tokens.spacingS} ${tokens.spacingM} ${tokens.spacingM} ${tokens.spacingM}`,
    gap: tokens.spacingXs,
    minWidth: 320,
    marginLeft: tokens.spacingL,
  }),
  clockIcon: css({
    fill: tokens.gray900,
  }),
  timer: css({
    marginBottom: 0,
  }),

  // Prompt section styles
  promptSection: css({
    width: '1024px',
    marginTop: tokens.spacingS,
  }),
  promptText: css({
    marginBottom: 0,
  }),
  textarea: css({
    width: '100%',
    minWidth: '1024px',
    maxWidth: '1024px',
    resize: 'vertical',
  }),
  regenerateButtonContainer: css({
    width: '100%',
    marginTop: tokens.spacingS,
  }),

  // Error state styles
  error: css({
    height: '100%',
    width: '100%',
    border: `1px solid ${tokens.red500}`,
    borderRadius: tokens.borderRadiusSmall,
  }),

  // Image section styles
  imageContainer: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  }),
  warningContainer: css({
    marginBottom: 8,
    width: '1024px',
    position: 'relative',
  }),
  warningCloseButton: css({
    position: 'absolute',
    top: 8,
    right: 8,
  }),
  imageWrapper: css({
    overflow: 'hidden',
    background: '#fafafa',
    border: '1px solid #eee',
    position: 'relative',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    margin: '0 auto',
  }),
  generatedImage: css({
    display: 'block',
  }),
};
