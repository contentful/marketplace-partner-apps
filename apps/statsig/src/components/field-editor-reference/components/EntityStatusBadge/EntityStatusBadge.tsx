import React from 'react';

import { EntityStatusBadge as StatusBadge, EntityStatus } from '@contentful/f36-components';

import {
  useScheduledActions,
  UseScheduledActionsProps,
} from '../ScheduledIconWithTooltip/ScheduledIconWithTooltip';
import { ScheduleTooltip } from '../ScheduledIconWithTooltip/ScheduleTooltip';

type EntityStatusBadgeProps = UseScheduledActionsProps & {
  status: EntityStatus;
};

export function EntityStatusBadge({
  entityId,
  entityType,
  getEntityScheduledActions,
  status,
  ...props
}: EntityStatusBadgeProps) {
  const { isError, isLoading, jobs } = useScheduledActions({
    entityId,
    entityType,
    getEntityScheduledActions,
  });

  if (isError || isLoading || jobs.length === 0) {
    return <StatusBadge {...props} entityStatus={status} />;
  }

  return (
    <ScheduleTooltip job={jobs[0]} jobsCount={jobs.length}>
      <StatusBadge {...props} entityStatus={status} isScheduled />
    </ScheduleTooltip>
  );
}
