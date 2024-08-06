import { css } from '@emotion/css';
import tokens from '@contentful/f36-tokens';

export const Divider = () => {
  return (
    <hr
      className={css({
        width: '100%',
        margin: 'auto',
        border: 'none',
        borderTop: `1px solid ${tokens.gray300}`,
      })}
    />
  );
};
