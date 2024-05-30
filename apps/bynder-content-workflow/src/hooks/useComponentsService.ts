import { cfComponentFields } from "@/consts/fieldMap";
import { parseCredentials } from "@/services/api";
import {
  AssetToExport,
  CFPrepareComponent,
  FieldMapping,
  GCComponentContent,
  GCComponentField,
  GCContent,
  GCFieldDictionary,
  GCTemplate,
  MappingConfig,
} from "@/type/types";
import { deleteEntry } from "@/utils/contentful";
import {
  composeEntryFieldsForCF,
  createEntryRefFieldValue,
  createFieldsMappingForComponents,
} from "@/utils/entriesImport";
import { getCFComponentUUID, getGCComponentUUID } from "@/utils/fieldMapping";
import { PageAppSDK } from "@contentful/app-sdk";
import { useSDK } from "@contentful/react-apps-toolkit";
import { AssetProps, EntryProps } from "contentful-management";
import useAssetsService from "./useAssetsService";
import { composeGCContentToExport, getComponentFieldsDicts } from "@/utils/entriesExport";

export default function useComponentsService() {
  const sdk = useSDK<PageAppSDK>();
  const DEFAULT_LOCALE = sdk.locales.default;
  const { uploadAssets, exportAsset } = useAssetsService();

  async function deleteOldComponentInstances(
    template: GCTemplate,
    entryId: string,
    fieldMapping: FieldMapping[]
  ) {
    const areComponentFieldsPresent = fieldMapping.some((field) =>
      cfComponentFields.includes(field.type)
    );
    if (!areComponentFieldsPresent) return;
    const templateComponentsIds = template.structure.groups
      .flatMap((g) => g.fields)
      .reduce<string[]>((acc, curr) => {
        if (curr.component) {
          acc.push(curr.component.uuid);
        }
        return acc;
      }, []);
    if (templateComponentsIds.length === 0) return;
    const allRefs = await sdk.cma.entry.references({ entryId, include: 10 });
    const entryRefs = allRefs.includes?.Entry;
    if (!entryRefs) return;
    const valuesToDelete: Promise<void>[] = [];
    for (const ref of entryRefs) {
      const modelId = getGCComponentUUID(ref.sys.contentType.sys.id);
      if (templateComponentsIds.includes(modelId)) {
        valuesToDelete.push(deleteEntry(sdk.cma, ref.sys.id));
      }
    }
    await Promise.all(valuesToDelete);
  }

  async function createComponentInstance(
    componentId: string,
    fieldId: string,
    content: GCComponentField,
    config: FieldMapping[]
  ) {
    const { fields, assets } = composeEntryFieldsForCF(config, content);
    let assetsFields: EntryProps["fields"] = {};
    if (assets.length > 0) {
      assetsFields = await uploadAssets(assets);
    }
    const created = await sdk.cma.entry.create(
      {
        contentTypeId: getCFComponentUUID(componentId),
      },
      {
        fields: {
          ...fields,
          ...assetsFields,
        },
      }
    );
    await sdk.cma.entry.publish(
      {
        entryId: created.sys.id,
      },
      created
    );
    return {
      fieldId,
      entryId: created.sys.id,
    };
  }

  async function importComponents(component: Required<CFPrepareComponent>) {
    const creating: Promise<{ fieldId: string; entryId: string }>[] = [];
    const content = component.content;
    const multipleRefs = Array.isArray(content);
    if (multipleRefs) {
      for (const componentContent of content) {
        creating.push(
          createComponentInstance(
            component.componentId,
            component.cfFieldId,
            componentContent,
            component.fieldMapping
          )
        );
      }
    } else {
      creating.push(
        createComponentInstance(
          component.componentId,
          component.cfFieldId,
          content,
          component.fieldMapping
        )
      );
    }
    const created = await Promise.all(creating);
    if (multipleRefs) {
      return created.reduce<{ [key: string]: string[] }>((acc, curr) => {
        if (acc[curr.fieldId]) {
          acc[curr.fieldId].push(curr.entryId);
        } else {
          acc[curr.fieldId] = [curr.entryId];
        }
        return acc;
      }, {});
    } else {
      return {
        [created[0].fieldId]: created[0].entryId,
      };
    }
  }

  async function getAllCFAssets(assets: AssetToExport[]) {
    const loadingAssets: Promise<AssetProps>[] = [];
    for (const asset of assets) {
      loadingAssets.push(sdk.cma.asset.get({ assetId: asset.assetId }));
    }
    const loadedAssets = await Promise.all(loadingAssets);
    return assets.map((asset, index) => ({
      ...asset,
      assetData: loadedAssets[index],
    }));
  }

  async function createComponentContent(
    fieldId: string,
    fieldDict: GCFieldDictionary,
    fieldMapping: MappingConfig["fields"],
    cfFields: EntryProps["fields"],
    projectId: string,
    isRepeatable: boolean
  ) {
    const { content, assets } = composeGCContentToExport(
      fieldDict,
      fieldMapping,
      cfFields,
      DEFAULT_LOCALE
    );
    const cfAssets = await getAllCFAssets(assets);
    const exportingAssets: Promise<AssetToExport>[] = [];
    for (const asset of cfAssets) {
      exportingAssets.push(exportAsset(asset.fieldId, asset.assetData, projectId));
    }
    const exportedAssets = await Promise.all(exportingAssets);
    const contentAssetFields = exportedAssets.reduce<{ [key: string]: string[] }>(
      (acc, curr) => {
        if (acc[curr.fieldId]) {
          acc[curr.fieldId].push(curr.assetId);
        } else {
          acc[curr.fieldId] = [curr.assetId];
        }
        return acc;
      },
      {}
    );
    return {
      fieldId,
      isRepeatable,
      content: {
        ...content,
        ...contentAssetFields,
      },
    };
  }

  async function importEntryComponents(
    components: Required<CFPrepareComponent>[]
  ) {
    const creatingEntries: Promise<{ [key: string]: string | string[] }>[] = [];
    for (const component of components) {
      creatingEntries.push(importComponents(component));
    }
    const created = await Promise.all(creatingEntries);
    let cfFields: { [key: string]: any } = {};
    for (const ref of created) {
      const fieldId = Object.keys(ref)[0];
      cfFields = {
        ...cfFields,
        ...createEntryRefFieldValue(fieldId, ref[fieldId], DEFAULT_LOCALE),
      };
    }
    return cfFields;
  }
  
  async function composeComponentsContent(
    entryRefs: EntryProps[],
    mainTemplateFields: GCFieldDictionary,
    components: { fieldId: string; refs: string[] | string }[],
    projectId: string
  ) {
    const componentFields = getComponentFieldsDicts(mainTemplateFields);
    const uploadingComponents: Promise<{
      isRepeatable: boolean;
      fieldId: string;
      content: GCContent;
    }>[] = [];
    for (const component of components) {
      const componentFieldsDict = componentFields.find(
        (field) => field.fieldId === component.fieldId
      )?.fields;
      if (!componentFieldsDict) continue;
      const fieldMapping = createFieldsMappingForComponents(
        Object.values(componentFieldsDict)
      );
      if (Array.isArray(component.refs)) {
        for (const ref of component.refs) {
          const entry = entryRefs.find((entry) => entry.sys.id === ref);
          if (!entry) continue;
          uploadingComponents.push(
            createComponentContent(
              component.fieldId,
              componentFieldsDict,
              fieldMapping,
              entry.fields,
              projectId,
              true
            )
          );
        }
      } else {
        const entry = entryRefs.find((entry) => entry.sys.id === component.refs);
        if (!entry) continue;
        uploadingComponents.push(
          createComponentContent(
            component.fieldId,
            componentFieldsDict,
            fieldMapping,
            entry.fields,
            projectId,
            false
          )
        );
      }
    }
    const uploadedComponents = await Promise.all(uploadingComponents);
    return uploadedComponents.reduce<GCComponentContent>((acc, curr) => {
      const fieldValue = acc[curr.fieldId];
      if (!fieldValue && !curr.isRepeatable) {
        acc[curr.fieldId] = curr.content;
      } else if (!fieldValue && curr.isRepeatable) {
        acc[curr.fieldId] = [curr.content];
      } else if (fieldValue && Array.isArray(fieldValue)) {
        acc[curr.fieldId] = [...fieldValue, curr.content];
      }
      return acc;
    }, {});
  }

  return { importEntryComponents, composeComponentsContent, deleteOldComponentInstances };
}
