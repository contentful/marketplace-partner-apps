import { BadgeVariant, Popover, Badge } from '@contentful/f36-components';
import { useMemo, useEffect, useRef } from 'react';
import { TaskStatusTable } from '../../../../components';
import { EntryStatusBadgeProps } from './EntryStatusBadge.types';

export const EntryStatusBadge = ({ tasks, isOpen, onToggleOpen, sorting, onSort }: EntryStatusBadgeProps) => {
  const hasTasks = Boolean(tasks?.length);
  const badgeRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkHover = (event: MouseEvent) => {
      if (!badgeRef.current) return;
      let mouseOver = badgeRef.current.contains(event.target as Node);
      if (popoverRef.current) mouseOver = mouseOver || popoverRef.current.contains(event.target as Node);
      onToggleOpen(mouseOver);
    };

    window.addEventListener('mousemove', checkHover, true);

    return () => {
      window.removeEventListener('mousemove', checkHover, true);
    };
  }, []);

  const { variant, label } = useMemo<{ label: string; variant: BadgeVariant }>(() => {
    if (tasks.some((task) => task.status === 'not-translated'))
      return {
        label: 'Not translated',
        variant: 'secondary',
      };

    if (tasks.some((task) => ['pending', 'confirmed', 'in-progress', 'paused'].includes(task.status)))
      return {
        label: 'Translating',
        variant: 'primary',
      };

    if (tasks.some((task) => ['failed', 'rejected'].includes(task.status)))
      return {
        label: 'Failed',
        variant: 'negative',
      };

    if (tasks.some((task) => task.status === 'cancelled'))
      return {
        label: 'Cancelled',
        variant: 'secondary',
      };

    if (tasks.some((task) => task.status === 'completed-with-warnings'))
      return {
        label: 'Warnings',
        variant: 'warning',
      };

    return {
      label: 'Translated',
      variant: 'positive',
    };
  }, [tasks]);

  return (
    <Popover isOpen={hasTasks && isOpen} autoFocus={false} closeOnBlur={false} closeOnEsc={false} placement="bottom-end" offset={[1, 0]}>
      <Popover.Trigger>
        <Badge variant={variant} ref={badgeRef}>
          {label}
        </Badge>
      </Popover.Trigger>
      <Popover.Content ref={popoverRef} onClick={(e) => e.stopPropagation()}>
        <TaskStatusTable tasks={tasks} sorting={sorting} onSort={onSort} />
      </Popover.Content>
    </Popover>
  );
};
