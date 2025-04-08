import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const styles = {
  fieldContainer: css({
    width: '100%',
  }),
  jsonEditorField: {
    width: '100%',
    height: '500px',
    overflow: 'auto',
    fontFamily: '"Fira Code", monospace', // or match Prism’s font
    fontSize: 14,
    lineHeight: '1.5',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #ccc',
    whiteSpace: 'pre',
    tabSize: 2,
  },
};
