import React from 'react';

import type { Preview } from '@storybook/react';

import { Box, GlobalStyles } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { css } from 'emotion';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      include: [],
    },
  },

  decorators: [
    (Story) => (
      <>
        <GlobalStyles />
        <Box
          padding="spacingL"
          className={css({
            backgroundColor: tokens.gray100,
            position: 'fixed',
            inset: 0,
          })}>
          <Story />
        </Box>
      </>
    ),
  ],
};

export default preview;
