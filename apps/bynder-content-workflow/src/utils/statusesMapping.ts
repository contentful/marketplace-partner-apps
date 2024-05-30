import { EntryProps } from "contentful-management";
import { CFStatusType, GCStatus, StatusMapping } from "@/type/types";

function sortStatusesByWorkflow(statuses: GCStatus[]) {
  return statuses.reduce<{ [key: string]: GCStatus[] }>((acc, status) => {
    if (!acc[status.workflow_uuid]) {
      acc[status.workflow_uuid] = [];
    }
    acc[status.workflow_uuid].push(status);
    return acc;
  }, {});
}

export function getStatusesWorkflowList(statuses: GCStatus[]) {
  return statuses.reduce<{ name: string; id: string }[]>((acc, currentVal) => {
    if (!acc.find((status) => status.id === currentVal.workflow_uuid)) {
      const workflow = {
        name: currentVal.workflow_name,
        id: currentVal.workflow_uuid,
      };
      if (currentVal.workflow_is_default) {
        acc.unshift(workflow);
      } else {
        acc.push(workflow);
      }
    }
    return acc;
  }, []);
}

export function groupStatusesByWorkflow(statuses: GCStatus[]) {
  return Object.values(sortStatusesByWorkflow(statuses));
}

export function setDefaultStatusMappings(statuses: GCStatus[]) {
  return statuses.map((status) => ({
    ...status,
    cfStatus: CFStatusType.Draft,
    changeStatusInGC: null,
  }));
}

export function assignStatusMappings(statuses: GCStatus[], statusMapping: StatusMapping[]) {
  return statuses.map((status) => {
    const mapping = statusMapping.find((m) => m.id === status.id);
    if (mapping) {
      return {
        ...status,
        cfStatus: mapping.cfStatus,
        changeStatusInGC: mapping.changeStatusInGC,
      };
    }
    return {
      ...status,
      cfStatus: CFStatusType.Draft,
      changeStatusInGC: null,
    };
  });
}

export function getStatusMappings(statuses: GCStatus[]) {
  return statuses.map((status) => ({
    id: status.id,
    cfStatus: status.cfStatus ?? CFStatusType.Draft,
    changeStatusInGC: status.changeStatusInGC ?? null,
  }));
}

export function setCFStatusMapping(
  statuses: GCStatus[],
  statusId: string,
  cfStatus: CFStatusType
) {
  return statuses.map((status) => {
    if (status.id === statusId) {
      return {
        ...status,
        cfStatus,
      };
    }
    return status;
  });
}

export function setGCChangeStatus(
  statuses: GCStatus[],
  statusId: string,
  changeStatusInGC: string | null
) {
  return statuses.map((status) => {
    if (status.id === statusId) {
      return {
        ...status,
        changeStatusInGC: changeStatusInGC || null,
      };
    }
    return status;
  });
}

export function isArchived(entity: EntryProps) {
  return !!entity.sys.archivedVersion;
}

export function isPublished(entity: EntryProps) {
  return (
    !!entity.sys.publishedVersion &&
    entity.sys.version === entity.sys.publishedVersion + 1
  );
}

export function isDraft(entity: EntryProps) {
  return !entity.sys.publishedVersion;
}
