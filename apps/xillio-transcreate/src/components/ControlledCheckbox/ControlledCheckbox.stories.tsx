import type { Meta, StoryObj } from '@storybook/react';
import { ControlledCheckbox as ControlledCheckboxComponent, ControlledCheckboxProps } from '.';
import { userEvent, within, expect } from '@storybook/test';
import { useForm } from 'react-hook-form';

type FieldValues = {
  checkbox: boolean;
};

export default {
  title: 'Components/Form/ControlledCheckbox',
  component: ControlledCheckboxComponent,
  parameters: {
    controls: {
      include: ['label'],
    },
  },
  args: {
    name: 'checkbox',
    label: 'Try out this checkbox!',
  },
  render: (args) => {
    const { control } = useForm<FieldValues>();

    return <ControlledCheckboxComponent {...args} control={control} />;
  },
} satisfies Meta<ControlledCheckboxProps<FieldValues>>;

type Story = StoryObj<ControlledCheckboxProps<FieldValues>>;

export const Enabled: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    expect(canvas.queryByText(args.label)).toBeInTheDocument();

    const checkbox = canvas.getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    expect(canvas.queryByText(args.label)).toBeInTheDocument();

    const checkbox = canvas.getByRole('checkbox');

    expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    expect(checkbox).not.toBeChecked();
  },
};
