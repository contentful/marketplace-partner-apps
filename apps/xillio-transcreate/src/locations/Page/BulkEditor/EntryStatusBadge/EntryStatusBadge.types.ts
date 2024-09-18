import { TaskStatusTableSorting, Task } from '../../../../components';

export type EntryStatusBadgeProps = {
  tasks: Task[];
  isOpen: boolean;
  onToggleOpen: (isOpen: boolean) => void;
  sorting: TaskStatusTableSorting;
  onSort: (sorting: TaskStatusTableSorting) => void;
};
