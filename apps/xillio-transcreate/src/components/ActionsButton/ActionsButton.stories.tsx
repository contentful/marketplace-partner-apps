import type { Meta, StoryObj } from '@storybook/react';
import { ActionsButton as ActionsButtonComponent, ActionsButtonProps } from '.';

import { fn, userEvent, within, expect } from '@storybook/test';

export default {
  title: 'Components/Inputs/ActionsButton',
  component: ActionsButtonComponent,
  parameters: {
    controls: {
      include: ['delayOpen'],
    },
  },
  args: {
    isFullWidth: false,
    actions: [
      { label: 'Primary Action', variant: 'primary', onClick: fn() },
      { label: 'Positive Action', variant: 'positive', onClick: fn() },
      { label: 'Negative Action', variant: 'negative', onClick: fn() },
      { label: 'Secondary Action', variant: 'secondary', onClick: fn() },
    ],
    delayOpen: 0,
  },
} satisfies Meta<typeof ActionsButtonComponent>;

type Story = StoryObj<ActionsButtonProps<string>>;

export const Enabled: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const dropdownButton = canvas.getByRole('button', { name: 'Open dropdown' });

    const body = within(document.body);

    for (let i = 0; i < args.actions.length; i++) {
      const action = args.actions[i];

      expect(action.onClick).toHaveBeenCalledTimes(0);

      await userEvent.click(dropdownButton);

      await userEvent.click(body.getByRole('menuitem', { name: action.label }));

      await userEvent.click(canvas.getByText(action.label));

      expect(action.onClick).toHaveBeenCalledTimes(1);
    }
  },
};

export const Disabled: Story = {
  args: {
    isDisabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    const dropdownButton = canvas.getByRole('button', { name: 'Open dropdown' });

    const body = within(document.body);

    for (let i = 0; i < args.actions.length; i++) {
      const action = args.actions[i];

      expect(action.onClick).toHaveBeenCalledTimes(0);

      await userEvent.click(dropdownButton);

      await userEvent.click(body.getByRole('menuitem', { name: action.label }));

      await userEvent.click(canvas.getByText(action.label));

      expect(action.onClick).toHaveBeenCalledTimes(0);
    }
  },
};
