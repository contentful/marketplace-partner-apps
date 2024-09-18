import { HelpCircleIcon } from '@contentful/f36-icons';
import { HintProps } from './Hint.types';
import { Tooltip } from '@contentful/f36-components';
import { css } from '@emotion/react';
import tokens from '@contentful/f36-tokens';

export const Hint = ({ Icon = HelpCircleIcon, color, ...props }: HintProps) => {
  return (
    <Tooltip {...props}>
      <Icon size="tiny" css={css({ fill: color ?? tokens.gray500 })} />
    </Tooltip>
  );
};
