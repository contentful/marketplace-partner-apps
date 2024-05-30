import { ITEM_NOT_FOUND_MSG } from "@/consts/common";
import {
  parseCredentials,
  getSingleItem,
  APICredentials,
  getSingleTemplate,
  setItemStatus,
  updateItemContent,
} from "@/services/api";
import {
  CFStatusType,
  GCComponentContent,
  GCFields,
  MappingConfig,
  Structure,
} from "@/type/types";
import { SidebarAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { useRef } from "react";
import useComponentsService from "./useComponentsService";
import { archiveCFEntry } from "@/utils/contentful";
import {
  composeEntryFieldsForCF,
  getComponentIdsFromTemplate,
  getStatusMapping,
} from "@/utils/entriesImport";
import useAssetsService from "./useAssetsService";
import {
  composeGCContentToExport,
  getFieldsFromStructure,
} from "@/utils/entriesExport";
import { CF_GC_ENTRY_NAME_FIELD } from "@/consts/fieldMap";

export default function useSidebarService() {
  const sdk = useSDK<SidebarAppSDK>();
  const credentials = useRef(parseCredentials(sdk.parameters.installation));
  const DEFAULT_LOCALE = sdk.locales.default;
  const {
    importEntryComponents,
    deleteOldComponentInstances,
    composeComponentsContent,
  } = useComponentsService();
  const { uploadAssets, exportAsset } = useAssetsService();

  async function getGCEntry() {
    return (
      await getSingleItem(
        credentials.current as APICredentials,
        sdk.entry.getSys().id
      )
    ).data;
  }

  async function importEntry(config: MappingConfig) {
    const gcEntry = await getGCEntry();
    if (!gcEntry) {
      throw new Error(ITEM_NOT_FOUND_MSG);
    }
    const template = await getSingleTemplate(
      credentials.current as APICredentials,
      gcEntry.template_id
    );
    if (!template?.related) {
      throw new Error("Template for the item not found");
    }
    await deleteOldComponentInstances(
      template.related,
      sdk.entry.getSys().id,
      config.fields
    );
    const content = gcEntry.content as GCFields;
    const {
      fields: mappedFields,
      assets,
      components,
    } = composeEntryFieldsForCF(
      (config as MappingConfig).fields,
      content,
      DEFAULT_LOCALE
    );
    for (const field of Object.keys(mappedFields)) {
      const cfField = sdk.entry.fields[field];
      if (!cfField) continue;
      await cfField.setValue(mappedFields[field][DEFAULT_LOCALE]);
    }
    if (assets.length) {
      const assetsFields = await uploadAssets(assets);
      for (const afield of Object.keys(assetsFields)) {
        const cfField = sdk.entry.fields[afield];
        if (!cfField) continue;
        await cfField.setValue(assetsFields[afield][DEFAULT_LOCALE]);
      }
    }
    if (components.length) {
      const componentsWithIds = getComponentIdsFromTemplate(
        template.related,
        components
      );
      const fields = await importEntryComponents(componentsWithIds);
      for (const field of Object.keys(fields)) {
        const cfField = sdk.entry.fields[field];
        if (!cfField) continue;
        await cfField.setValue(fields[field][DEFAULT_LOCALE]);
      }
    }
    if (config.useGCEntryTitle) {
      const nameField = sdk.entry.fields[CF_GC_ENTRY_NAME_FIELD];
      if (nameField) {
        await nameField.setValue(gcEntry.name);
      }
    }
    await sdk.entry.save();
    const statusMapping = getStatusMapping(
      gcEntry.status_id.toString(),
      config as MappingConfig
    );
    if (statusMapping) {
      const spaceId = sdk.ids.space;
      const envId = sdk.ids.environment;
      if (statusMapping.cfStatus === CFStatusType.Archived) {
        await archiveCFEntry(gcEntry.id, sdk.cma, spaceId, envId);
      } else if (statusMapping.cfStatus === CFStatusType.Published) {
        await sdk.entry.publish();
      } else {
        await sdk.entry.unpublish();
      }
      if (statusMapping.changeStatusInGC) {
        setItemStatus(
          credentials.current as APICredentials,
          gcEntry.id,
          statusMapping.changeStatusInGC
        );
      }
    }
  }

  async function exportEntry(config: MappingConfig) {
    const gcEntry = await getGCEntry();
    if (!gcEntry) {
      throw new Error(ITEM_NOT_FOUND_MSG);
    }
    const template = await getSingleTemplate(
      credentials.current as APICredentials,
      gcEntry.template_id
    );
    if (!template?.related) {
      throw new Error("Template for the item not found");
    }
    const projectId = config.projectId;
    const templateFields = getFieldsFromStructure(
      template.related.structure as Structure
    );
    const entryRefs = (
      await sdk.cma.entry.references({
        entryId: sdk.entry.getSys().id,
        include: 10,
      })
    ).includes;
    const entryAssets = entryRefs?.Asset || [];
    const entryComponents = entryRefs?.Entry || [];
    const {
      content,
      assets: assetFields,
      components,
    } = composeGCContentToExport(
      templateFields,
      (config as MappingConfig).fields,
      sdk.entry.fields,
      DEFAULT_LOCALE
    );
    let contentAssetsFields: { [key: string]: string[] } = {};
    let componentFields: GCComponentContent = {};
    const uploadPromises: Promise<{ assetId: string; fieldId: string }>[] = [];
    for (const { fieldId, assetId } of assetFields) {
      const asset = entryAssets.find((a) => a.sys.id === assetId);
      if (!asset) continue;
      uploadPromises.push(exportAsset(fieldId, asset, projectId));
    }
    const readyAssets = await Promise.all(uploadPromises);
    for (const { fieldId, assetId } of readyAssets) {
      if (!contentAssetsFields[fieldId]) {
        contentAssetsFields[fieldId] = [assetId];
      } else {
        contentAssetsFields[fieldId].push(assetId);
      }
    }
    if (components.length > 0) {
      componentFields = await composeComponentsContent(
        entryComponents,
        templateFields,
        components,
        projectId
      );
    }

    await updateItemContent(credentials.current as APICredentials, gcEntry.id, {
      content: { ...content, ...contentAssetsFields, ...componentFields },
      name: gcEntry.name,
    });
  }

  return { importEntry, exportEntry };
}
