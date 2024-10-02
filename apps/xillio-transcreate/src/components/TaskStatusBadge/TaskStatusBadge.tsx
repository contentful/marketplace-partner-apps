import { Badge, BadgeVariant, Tooltip } from '@contentful/f36-components';
import { useMemo } from 'react';
import { TaskStatus, TaskStatusBadgeProps } from './TaskStatusBadge.types';
import { capitalize } from '../../utils';

const variantMap: Record<TaskStatus, BadgeVariant> = {
  pending: 'primary',
  confirmed: 'primary',
  'in-progress': 'primary',
  paused: 'secondary',
  cancelled: 'secondary',
  completed: 'positive',
  'completed-with-warnings': 'warning',
  failed: 'negative',
  rejected: 'negative',
  'not-translated': 'secondary',
};

const tooltipMap: Record<TaskStatus, string> = {
  pending: 'The task is new and has not yet been confirmed by the language service provider',
  confirmed: 'The task has been confirmed by the language service provider and is ready to be translated',
  'in-progress': 'The task is currently being worked on by the language service provider',
  paused: 'The task has been temporarily stopped by the content owner',
  cancelled: 'The task has been cancelled by the content owner or the Xillio Transcreate application and will not be completed',
  completed: 'The task has been completed by the language service provider',
  'completed-with-warnings': 'The task has been completed with minor issues that may need attention',
  failed: 'The task could not be completed by due to errors',
  rejected: 'The task was deemed unsuitable for translation by the language service provider',
  'not-translated': 'The content has never been translated by the Xillio Transcreate application before',
};

export const TaskStatusBadge = ({ status }: TaskStatusBadgeProps) => {
  const label = useMemo(() => status.split('-').map(capitalize).join(' '), [status]);

  return (
    <Tooltip content={tooltipMap[status]}>
      <Badge variant={variantMap[status]}>{label}</Badge>
    </Tooltip>
  );
};
