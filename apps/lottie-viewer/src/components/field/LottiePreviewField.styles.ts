import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  monaco: {
    rules: [
      { token: '', foreground: '1e1e1e', background: `${tokens.gray200}` },
      { token: 'string', foreground: '008000' },
      { token: 'number', foreground: '0000ff' },
      { token: 'keyword', foreground: 'af00db' },
    ],
    colors: {
      'editor.background': `${tokens.gray200}`,
      'editor.foreground': '#1e1e1e',
      'editor.lineHighlightBackground': '#e0e0e0',
      'editorLineNumber.foreground': '#999999',
      'editorCursor.foreground': '#000000',
    },
    options: {
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 14,
      fontFamily: 'monospace',
      lineHeight: 22,
      scrollbar: {
        verticalScrollbarSize: 8,
        horizontalScrollbarSize: 8,
        alwaysConsumeMouseWheel: false,
      },
      mouseWheelZoom: false,
      tabSize: 2,
      overviewRulerLanes: 0,
      overviewRulerBorder: false,
      codeLens: false,
      lineDecorationsWidth: 0,
      guides: { indentation: false },
    },
  },
  lottiePreviewFieldContainer: (hasError: boolean) =>
    css({
      display: 'flex',
      flexDirection: 'column',
      border: `1px solid ${tokens.gray400}`,
      borderRadius: tokens.borderRadiusSmall,
      ...(hasError && { border: `1px solid ${tokens.red400}` }),
    }),
  lottieColumnParentContainer: css({
    height: '500px',
    flexDirection: 'row',
    '@media (max-width: 800px)': {
      flexDirection: 'column',
      height: '1000px',
    },
  }),
  lottieColumnContainer: css({
    flex: '1 1 50%', // grow, shrink, and base width
    minHeight: 0,
    maxWidth: '50%',
    height: '100%',
    '@media (max-width: 800px)': {
      width: '100%',
      maxWidth: '100%',
      height: '500px',
      maxHeight: '500px',
      flexShrink: 0,
    },
  }),
  rightPanelColumn: {
    borderLeft: `1px solid ${tokens.gray500}`,
    '@media (max-width: 800px)': {
      borderLeft: 'none',
      borderTop: `1px solid ${tokens.gray500}`,
    },
  },
  lottieJsonEditorButtons: css({
    maxHeight: '32px',
    minHeight: '32px',
    minWidth: '66px',
    maxWidth: '66px',
    padding: '4px 2px',
    fontSize: tokens.fontSizeM,
  }),
  previewButton: css({
    maxHeight: '32px',
    minHeight: '32px',
    minWidth: '32px',
    maxWidth: '32px',
  }),
  lottieAnimatorContainer: css({
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderLeft: `1px solid ${tokens.gray400}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '@media (max-width: 800px)': {
      borderLeft: 'none',
      borderTop: `1px solid ${tokens.gray400}`,
    },
  }),
  editorHeaderText: css({
    color: tokens.gray800,
    fontSize: tokens.fontSizeM,
    fontWeight: tokens.fontWeightDemiBold,
    lineHeight: tokens.lineHeightCondensed,
  }),
  dotLottieReact: css({
    maxWidth: '100%',
    maxHeight: '100%',
    width: 'auto',
    height: 'auto',
  }),
  jsonErrorContainer: css({
    color: tokens.red600,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingXs,
  }),
};
