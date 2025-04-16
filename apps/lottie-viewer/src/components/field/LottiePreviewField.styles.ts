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
  lottieAnimatorContainer: css({
    overflowY: 'hidden',
    borderLeft: `1px solid ${tokens.gray400}`,
    width: '100%',
    height: '100%',
    backgroundColor: tokens.gray200,
  }),
};
