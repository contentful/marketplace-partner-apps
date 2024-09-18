import type { Meta, StoryObj } from '@storybook/react';
import { TableBodySkeleton as TableBodySkeletonComponent, TableBodySkeletonProps } from '.';

export default {
  title: 'Components/Feedback/TableBodySkeleton',
  component: TableBodySkeletonComponent,
  parameters: {
    controls: {
      include: ['hasCheckbox', 'columns', 'rows'],
    },
  },
} satisfies Meta<typeof TableBodySkeletonComponent>;

type Story = StoryObj<TableBodySkeletonProps>;

export const TableBodySkeleton: Story = {
  args: {
    hasCheckbox: true,
    columns: 5,
    rows: 10,
  },
};
