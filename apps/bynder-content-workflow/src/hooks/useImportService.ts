import {
  APICredentials,
  getProjectItems,
  getProjectStatuses,
  parseCredentials,
  setItemStatus,
} from "@/services/api";
import {
  CFStatusType,
  ExtendedGCTemplate,
  GCEntry,
  GCStatus,
  MappingConfig,
  StatusMapping,
} from "@/type/types";
import {
  publishCFEntry,
  archiveCFEntry,
  makeEntryDraft,
} from "@/utils/contentful";
import {
  addImportTime,
  gcEntryAdapter,
  getComponentIdsFromTemplate,
  getEntryTitle,
  getImportTime,
  getStatusMapping,
  mapEntryFields,
} from "@/utils/entriesImport";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { ContentTypeProps, EntryProps } from "contentful-management";
import { useRef } from "react";
import useAssetsService from "./useAssetsService";
import { isArchived } from "@/utils/statusesMapping";
import useComponentsService from "./useComponentsService";
import { CF_GC_ENTRY_NAME_FIELD } from "@/consts/fieldMap";

export default function useImportService(handleError: (error: any) => void) {
  const sdk = useSDK<PageAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const templateRef = useRef<ExtendedGCTemplate | null>(null);
  const DEFAULT_LOCALE = sdk.locales.default;
  const { uploadAssets } = useAssetsService();
  const { importEntryComponents, deleteOldComponentInstances } =
    useComponentsService();

  function handleMissingTemplate() {
    sdk.notifier.error("Error: Missing template");
    handleError("Cannot import items: the template is missing");
  }

  async function getEntries(template: ExtendedGCTemplate) {
    if (!credentials.current) {
      sdk.notifier.error("Please configure the app first");
      handleError("Missing configuration");
      return;
    }
    templateRef.current = template;

    try {
      const res = await getProjectItems(
        credentials.current,
        template.project_id,
        {
          templateId: template.id,
        }
      );
      const adapted: GCEntry[] = res.data.map((item: any) =>
        gcEntryAdapter(item)
      );
      let cfContentType: ContentTypeProps | null = null;
      for (const entry of adapted) {
        try {
          const connectedCFEntry = await sdk.cma.entry.get({
            entryId: entry.id,
          });
          if (connectedCFEntry) {
            if (!cfContentType) {
              cfContentType = await sdk.cma.contentType.get({
                contentTypeId: connectedCFEntry.sys.contentType.sys.id,
              });
            }
            entry.cfEntryProps = connectedCFEntry;
            entry.cfEntryTitle = getEntryTitle(
              connectedCFEntry,
              cfContentType,
              DEFAULT_LOCALE
            );
            const importTime = getImportTime(connectedCFEntry);
            if (importTime) {
              entry.lastImportedAt = importTime;
            }
          }
        } catch (error: any) {
          // not found code is "a" for some reason, checking the message in case "code will be changed"
          if (error.message !== "The resource could not be found.") {
            console.error(error);
          }
        }
      }
      const adaptedWithStatuses = await getAvailableStatuses(adapted);
      return adaptedWithStatuses;
    } catch (error: any) {
      sdk.notifier.error("Error: Failed to fetch entries");
      handleError(error);
    }
  }

  async function getAvailableStatuses(entries: GCEntry[]) {
    if (entries.length === 0) {
      return [];
    }
    if (!credentials.current) {
      sdk.notifier.error("Please configure the app first");
      throw new Error("Missing configuration");
    }
    const projectId = entries[0].project_id;
    if (!projectId) {
      sdk.notifier.error("Failed to load statuses: Missing project ID");
      return entries;
    }
    const allStatuses = (
      await getProjectStatuses(credentials.current, projectId)
    )?.data;
    if (!allStatuses) {
      sdk.notifier.error(
        `Failed to load statuses for the project ${projectId}`
      );
      return entries;
    }
    return entries.map((entry) => {
      const statusIdx = allStatuses.findIndex(
        (status: GCStatus) => status.id.toString() === entry.status_id
      );
      if (statusIdx > -1) {
        entry.status_name = allStatuses[statusIdx].display_name;
        entry.status_order = statusIdx;
      }
      return entry;
    });
  }

  async function changeGCStatus(mapping: StatusMapping, entryId: string) {
    await setItemStatus(
      credentials.current as APICredentials,
      entryId,
      mapping.changeStatusInGC as string
    );
  }

  async function updateEntries(
    config: MappingConfig,
    entries: GCEntry[],
    incrementEntriesCount: () => void
  ) {
    const template = templateRef.current;
    if (!template) {
      handleMissingTemplate();
      return;
    }
    const itemsToUpdate: Array<Promise<any>> = [];
    const statusChanges: Array<Promise<any>> = [];
    const statusMappings: Array<StatusMapping & { entryId: string }> = [];
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;
    for (const entry of entries) {
      const cfEntry = entry.cfEntryProps as EntryProps;
      const {
        fields: newEntryFields,
        assets,
        components,
      } = await mapEntryFields(
        entry.id,
        config,
        credentials.current as APICredentials
      );
      await deleteOldComponentInstances(
        template,
        cfEntry.sys.id,
        config.fields
      );
      if (isArchived(cfEntry)) {
        await sdk.cma.entry.unarchive({
          spaceId,
          environmentId,
          entryId: cfEntry.sys.id,
        });
      }
      let assetsFields: EntryProps["fields"] = {};
      if (assets.length) {
        assetsFields = await uploadAssets(assets);
      }
      let componentFields: EntryProps["fields"] = {};
      if (components.length > 0) {
        const componentsWithIds = getComponentIdsFromTemplate(
          template as ExtendedGCTemplate,
          components
        );
        componentFields = await importEntryComponents(componentsWithIds);
      }
      const importTime = addImportTime(config);
      if (config.useGCEntryTitle) {
        newEntryFields[CF_GC_ENTRY_NAME_FIELD] = {
          [DEFAULT_LOCALE]: entry.name,
        };
      }
      itemsToUpdate.push(
        sdk.cma.entry.update(
          {
            spaceId,
            environmentId,
            entryId: cfEntry.sys.id,
          },
          {
            ...cfEntry,
            fields: {
              ...newEntryFields,
              ...importTime,
              ...assetsFields,
              ...componentFields,
            },
          }
        )
      );
      const statusMapping = getStatusMapping(entry.status_id, config);
      if (statusMapping) {
        statusMappings.push({
          ...statusMapping,
          entryId: entry.id,
        });
      }
      incrementEntriesCount();
    }
    await Promise.all(itemsToUpdate);
    for (const mapping of statusMappings) {
      if (mapping.changeStatusInGC) {
        statusChanges.push(changeGCStatus(mapping, mapping.entryId));
      }
      if (mapping.cfStatus === CFStatusType.Published) {
        statusChanges.push(
          publishCFEntry(mapping.entryId, sdk.cma, spaceId, environmentId)
        );
      } else if (mapping.cfStatus === CFStatusType.Archived) {
        statusChanges.push(
          archiveCFEntry(mapping.entryId, sdk.cma, spaceId, environmentId)
        );
      } else {
        statusChanges.push(
          makeEntryDraft(mapping.entryId, sdk.cma, spaceId, environmentId)
        );
      }
    }
    await Promise.all(statusChanges);
  }

  async function createEntries(
    config: MappingConfig,
    contentType: string,
    entries: GCEntry[],
    incrementEntriesCount: () => void
  ) {
    const template = templateRef.current;
    if (!template) {
      handleMissingTemplate();
      return;
    }
    const itemsToCreate: Array<Promise<any>> = [];
    const statusChanges: Array<Promise<any>> = [];
    const statusMappings: Array<StatusMapping & { entryId: string }> = [];
    const spaceId = sdk.ids.space;
    const environmentId = sdk.ids.environment;
    for (const entry of entries) {
      const {
        fields: newEntryFields,
        assets,
        components,
      } = await mapEntryFields(
        entry.id,
        config,
        credentials.current as APICredentials
      );
      let assetsFields: EntryProps["fields"] = {};
      if (assets.length) {
        assetsFields = await uploadAssets(assets);
      }
      let componentFields: EntryProps["fields"] = {};
      if (components.length > 0) {
        const componentsWithIds = getComponentIdsFromTemplate(
          template as ExtendedGCTemplate,
          components
        );
        componentFields = await importEntryComponents(componentsWithIds);
      }
      const importTime = addImportTime(config);
      if (config.useGCEntryTitle) {
        newEntryFields[CF_GC_ENTRY_NAME_FIELD] = {
          [DEFAULT_LOCALE]: entry.name,
        };
      }
      itemsToCreate.push(
        sdk.cma.entry.createWithId(
          {
            entryId: entry.id,
            contentTypeId: contentType,
            spaceId,
            environmentId,
          },
          {
            fields: {
              ...newEntryFields,
              ...importTime,
              ...assetsFields,
              ...componentFields,
            },
          }
        )
      );
      const statusMapping = getStatusMapping(entry.status_id, config);
      if (statusMapping) {
        statusMappings.push({
          ...statusMapping,
          entryId: entry.id,
        });
      }
      incrementEntriesCount();
    }
    await Promise.all(itemsToCreate);
    for (const mapping of statusMappings) {
      if (mapping.changeStatusInGC) {
        statusChanges.push(changeGCStatus(mapping, mapping.entryId));
      }
      if (mapping.cfStatus === CFStatusType.Published) {
        statusChanges.push(
          publishCFEntry(mapping.entryId, sdk.cma, spaceId, environmentId)
        );
      } else if (mapping.cfStatus === CFStatusType.Archived) {
        statusChanges.push(
          archiveCFEntry(mapping.entryId, sdk.cma, spaceId, environmentId)
        );
      }
    }
    await Promise.all(statusChanges);
  }

  return { getEntries, updateEntries, createEntries };
}
