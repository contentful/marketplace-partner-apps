import type { Meta, StoryObj } from '@storybook/react';
import { Divider as DividerComponent } from '.';

export default {
  title: 'Components/Data Display/Divider',
  component: DividerComponent,
} satisfies Meta<typeof DividerComponent>;

type Story = StoryObj<Record<string, never>>;

export const Divider: Story = {};
