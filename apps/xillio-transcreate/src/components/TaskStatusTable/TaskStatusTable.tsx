import { Checkbox, MissingContent, RelativeDateTime, Table, TableCellSorting, Tooltip } from '@contentful/f36-components';
import { useMemo, useState } from 'react';
import { TableBodySkeleton, TaskStatus, TaskStatusBadge } from '..';
import { css } from '@emotion/react';
import { Task, TaskStatusTableProps, TaskStatusTableSorting } from './TaskStatusTable.types';

const cursorPointerClass = css({ cursor: 'pointer' });

const cursorNotAllowedClass = css({
  cursor: 'not-allowed',
});

const notHoverableClass = css({
  '&:hover td': {
    backgroundColor: '#fff',
  },
});

export const TaskStatusTable = ({ tasks, isLoading = false, selected, onSelect, isSelectable, sorting: initialSorting, onSort }: TaskStatusTableProps) => {
  const [sorting, _setSorting] = useState<TaskStatusTableSorting>(
    initialSorting ?? {
      column: 'locale',
      direction: TableCellSorting.Ascending,
    },
  );
  const setSorting = (newSorting: TaskStatusTableSorting) => {
    if (onSort) onSort(newSorting);
    _setSorting(newSorting);
  };
  const hasCheckbox = typeof selected !== 'undefined' && typeof onSelect !== 'undefined' && typeof isSelectable !== 'undefined';
  const showDueDate = (task: Task) => {
    const validStatuses: TaskStatus[] = ['pending', 'confirmed', 'paused', 'in-progress'];
    return validStatuses.includes(task.status);
  };
  const selectableTasks = isSelectable ? tasks.filter(isSelectable) : tasks;
  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((taskA, taskB) => {
        let a: string | Date | undefined;
        let b: string | Date | undefined;
        if (sorting['column'] === 'locale') {
          a = taskA.displayName;
          b = taskB.displayName;
        }
        if (sorting['column'] === 'status') {
          a = taskA.status;
          b = taskB.status;
        }
        if (sorting['column'] === 'dueDate') {
          a = taskA.dueDate && new Date(taskA.dueDate);
          b = taskB.dueDate && new Date(taskB.dueDate);
        }
        if (a === undefined) return sorting['direction'] === TableCellSorting.Ascending ? -1 : 0;
        if (b === undefined) return sorting['direction'] === TableCellSorting.Ascending ? 0 : -1;
        if (a < b) return sorting['direction'] === TableCellSorting.Ascending ? -1 : 1;
        if (a > b) return sorting['direction'] === TableCellSorting.Ascending ? 1 : -1;
        return 0;
      }),
    [sorting['column'], sorting['direction'], tasks],
  );

  const handleSelect = (task: Task) => {
    if (!hasCheckbox) return;
    if (isSelectable && !isSelectable(task)) return;
    if (selected.has(task.targetLanguage)) {
      const newSet = new Set(selected);
      newSet.delete(task.targetLanguage);
      onSelect(newSet);
    } else {
      onSelect(new Set(selected).add(task.targetLanguage));
    }
  };

  const handleSelectAll = () => {
    if (!hasCheckbox) return;
    if (selected.size >= selectableTasks.length) {
      onSelect(new Set());
    } else {
      onSelect(new Set(selectableTasks.map((task) => task.targetLanguage)));
    }
  };

  const handleSort = (column: TaskStatusTableSorting['column']) => {
    const direction =
      sorting.column === column
        ? sorting.direction === TableCellSorting.Ascending
          ? TableCellSorting.Descending
          : TableCellSorting.Ascending
        : TableCellSorting.Ascending;

    setSorting({ column, direction });
  };

  return (
    <Table verticalAlign="middle">
      <Table.Head>
        <Table.Row>
          {hasCheckbox && (
            <Table.Cell>
              <Checkbox
                isDisabled={isLoading || !selectableTasks.length}
                isChecked={selected.size > 0 && selected.size === selectableTasks.length}
                onChange={handleSelectAll}
              />
            </Table.Cell>
          )}
          <Table.Cell isSortable onClick={() => handleSort('locale')} sortDirection={sorting.column === 'locale' ? sorting.direction : undefined}>
            Locale
          </Table.Cell>
          <Table.Cell isSortable onClick={() => handleSort('status')} sortDirection={sorting.column === 'status' ? sorting.direction : undefined}>
            Status
          </Table.Cell>
          <Table.Cell isSortable onClick={() => handleSort('dueDate')} sortDirection={sorting.column === 'dueDate' ? sorting.direction : undefined}>
            Due at
          </Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {isLoading ? (
          <TableBodySkeleton hasCheckbox={hasCheckbox} rows={3} columns={3} />
        ) : (
          sortedTasks.map((task) => {
            const isTaskSelectable = isSelectable ? isSelectable(task) : false;

            return (
              <Table.Row
                key={task.targetLanguage}
                onClick={() => handleSelect(task)}
                css={[
                  !hasCheckbox && notHoverableClass,
                  hasCheckbox && !isTaskSelectable && cursorNotAllowedClass,
                  hasCheckbox && isTaskSelectable && cursorPointerClass,
                ]}>
                {hasCheckbox && (
                  <Table.Cell>
                    <Checkbox isDisabled={isLoading || !isTaskSelectable} isChecked={selected.has(task.targetLanguage)} onChange={() => handleSelect(task)} />
                  </Table.Cell>
                )}
                <Table.Cell>
                  <Tooltip content={task.targetLanguage}>
                    <span>{task.displayName}</span>
                  </Tooltip>
                </Table.Cell>
                <Table.Cell>
                  <TaskStatusBadge status={task.status} />
                </Table.Cell>
                <Table.Cell>
                  {task.dueDate && showDueDate(task) ? (
                    <RelativeDateTime isRelativeToCurrentWeek date={new Date(task.dueDate)} />
                  ) : (
                    <MissingContent label="No due date available" />
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </Table>
  );
};
