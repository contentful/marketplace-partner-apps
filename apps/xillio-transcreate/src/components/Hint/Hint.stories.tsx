import type { Meta, StoryObj } from '@storybook/react';
import { Hint as HintComponent, HintProps } from '.';
import { Flex } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { HelpCircleIcon, InfoCircleIcon } from '@contentful/f36-icons';

export default {
  title: 'Components/Data Display/Hint',
  component: HintComponent,
  parameters: {
    controls: {
      include: ['content', 'Icon', 'placement', 'color'],
    },
  },
  decorators: [
    (Story) => (
      <>
        <Flex justifyContent="center" alignItems="center" fullHeight>
          <Story />
        </Flex>
      </>
    ),
  ],
} satisfies Meta<typeof HintComponent>;

type Story = StoryObj<HintProps>;

const icons = { InfoCircleIcon, HelpCircleIcon };

export const Hint: Story = {
  args: {
    color: tokens.colorPrimary,
    Icon: InfoCircleIcon,
    content: 'This is a hint!',
    placement: 'bottom',
  },
  argTypes: {
    Icon: {
      options: Object.keys(icons),
      mapping: icons,
      control: {
        type: 'select',
        labels: {
          InfoCircleIcon: 'Info',
          HelpCircleIcon: 'Help',
        },
      },
    },
    content: { control: { type: 'text' } },
    placement: {
      options: ['top', 'right', 'bottom', 'left'],
      control: { type: 'radio' },
    },
    color: { control: { type: 'color' } },
  },
};
