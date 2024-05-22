import {
  CF_GC_ENTRY_NAME_FIELD,
  CF_HIDDEN_FIELD,
  cfComponentFields,
  cfNumberFields,
  repeatableTextOptions,
} from "@/consts/fieldMap";
import { ContentTypeProps, EntryProps } from "contentful-management";
import {
  CFFieldType,
  CFPrepareAsset,
  CFPrepareComponent,
  EntryFilters,
  Field,
  GCAssetField,
  GCChoiceField,
  GCComponentField,
  GCEntry,
  GCFieldValue,
  GCFields,
  GCTemplate,
  JSONFieldValue,
  MappingConfig,
} from "@/type/types";
import { htmlStringToDocument } from "contentful-rich-text-html-parser";
import { APICredentials, getItemFields } from "@/services/api";
import { US_LOCALE, converter, formatDate } from "./common";
import { Document } from "@contentful/rich-text-types";
import { htmlStringToDocumentOptions } from "./parser";
import {
  CONTENTFUL_LINK,
  ContentfulLinkType,
  getCFComponentUUID,
  getComponentFieldType,
} from "./fieldMapping";
import { getFieldsFromStructure } from "./entriesExport";
import { v4 as uuid } from "uuid";
import { getConfigFieldValue } from "./parseMapping";

export function gcEntryAdapter(entry: any): GCEntry {
  return {
    id: entry.id.toString(),
    name: entry.name,
    status_name: entry.status_name,
    status_color: entry.current_step.color,
    status_id: entry.status_id.toString(),
    status_order: 0,
    project_id: entry.project_id.toString(),
    template_id: entry.template_id.toString(),
    structure: entry.structure,
    updated_at: entry.updated_at,
    lastImportedAt: "-",
  };
}

export function getAvailableStatuses(entries: GCEntry[]) {
  const statuses = new Array<{
    status_id: string;
    status_name: string;
    status_color: string;
    status_order: number;
  }>();
  for (const entry of entries) {
    if (statuses.find((s) => s.status_id === entry.status_id)) continue;
    statuses.push({
      status_id: entry.status_id,
      status_name: entry.status_name,
      status_color: entry.status_color,
      status_order: entry.status_order,
    });
  }
  return statuses.sort((a, b) => a.status_order - b.status_order);
}

export function getStatusMapping(statusId: string, config: MappingConfig) {
  return config.statuses.find((status) => status.id === statusId) || null;
}

export function splitEntriesByCFConnection(entries: GCEntry[]) {
  const entriesWithCFConnection = entries.filter((entry) => entry.cfEntryProps);
  const entriesWithoutCFConnection = entries.filter(
    (entry) => !entry.cfEntryProps
  );
  return [entriesWithCFConnection, entriesWithoutCFConnection];
}

export function getEntryTitle(
  entry: EntryProps,
  contentType: ContentTypeProps,
  locale: string
) {
  const titleField = contentType.displayField;
  const title = entry.fields[titleField]?.[locale];
  return typeof title === "string" ? title : "Untitled";
}

export function getFilteredEntries(
  entries: GCEntry[],
  filters: Map<EntryFilters, string>
) {
  return entries.filter((entry) => {
    let matchingFilters = filters.size;
    if (filters.has(EntryFilters.Status)) {
      matchingFilters =
        entry.status_id === filters.get(EntryFilters.Status)
          ? matchingFilters
          : matchingFilters - 1;
    }
    if (filters.has(EntryFilters.CFName)) {
      if (!entry.cfEntryTitle) matchingFilters = matchingFilters - 1;
      else {
        const trimmedVal = (filters.get(EntryFilters.CFName) as string).trim();
        matchingFilters = entry.cfEntryTitle
          .toLowerCase()
          .includes(trimmedVal.toLowerCase())
          ? matchingFilters
          : matchingFilters - 1;
      }
    }
    if (filters.has(EntryFilters.GCName)) {
      const trimmedVal = (filters.get(EntryFilters.GCName) as string).trim();
      matchingFilters = entry.name
        .toLowerCase()
        .includes(trimmedVal.toLowerCase())
        ? matchingFilters
        : matchingFilters - 1;
    }
    return matchingFilters === filters.size;
  });
}

function setCFLocaleValue(
  value: string | number | Document | any[] | JSONFieldValue | undefined,
  locale: string
) {
  return {
    [locale]: value,
  };
}

function createValidFileId(fileId: string) {
  return fileId.replace(/[^a-zA-Z0-9-]/g, "-");
}

function prepareAssetsForCF(
  cfFieldId: string,
  gcField: GCAssetField,
  locale: string
): CFPrepareAsset[] {
  const assets: CFPrepareAsset[] = [];
  for (const asset of gcField) {
    assets.push({
      fieldId: cfFieldId,
      assetId: createValidFileId(asset.file_id),
      rawAsset: {
        fields: {
          title: {
            [locale]: asset.filename,
          },
          file: {
            [locale]: {
              contentType: asset.mime_type,
              fileName: asset.filename,
              upload: asset.url,
            },
          },
        },
      },
    });
  }
  return assets;
}

export function createFieldsMappingForComponents(templateFields: Field[]) {
  const fieldMapping: MappingConfig["fields"] = [];
  for (const field of templateFields) {
    fieldMapping.push({
      gcId: field.uuid,
      cfId: getCFComponentUUID(field.uuid),
      type: getComponentFieldType(field),
    });
  }
  return fieldMapping;
}

function getGCComponentValue(value: GCFieldValue): GCComponentField | null {
  if (typeof value == "string") return null;
  if (Array.isArray(value) && "label" in value[0]) return null;
  if (Array.isArray(value) && "file_id" in value[0]) return null;
  return value as GCComponentField;
}

function isComponentEmpty(component: GCComponentField) {
  const componentFields = Object.keys(component);
  let filledFieldsLength = componentFields.length;
  for (const key of Object.keys(component)) {
    const fieldVal = component[key];
    if (Array.isArray(fieldVal) && fieldVal.length === 0) {
      filledFieldsLength--;
    }
    if (typeof fieldVal === "string" && fieldVal === "") {
      filledFieldsLength--;
    }
  }
  return filledFieldsLength === 0;
}

export function composeEntryFieldsForCF(
  configFields: MappingConfig["fields"],
  gcFields: GCFields | GCComponentField,
  defaultLocale: string = US_LOCALE
) {
  const newFields: EntryProps["fields"] = {};
  let assets: CFPrepareAsset[] = [];
  let components: CFPrepareComponent[] = [];
  for (const mappedField of configFields) {
    const value = gcFields[mappedField.gcId];
    const isNumberType = cfNumberFields.includes(mappedField.type);
    const isComponentType = cfComponentFields.includes(mappedField.type);
    // repeatable text case
    if (
      repeatableTextOptions.includes(mappedField.type) &&
      Array.isArray(value)
    ) {
      const isPlain = mappedField.type === CFFieldType.RepeatablePlain;
      const data = value.map((item) => {
        const stringifiedItem = typeof item === "string" ? item : "<p></p>";
        if (isPlain)
          return {
            uuid: uuid(),
            content: stringifiedItem,
          };
        return {
          uuid: uuid(),
          content: htmlStringToDocument(
            stringifiedItem,
            htmlStringToDocumentOptions
          ),
        };
      });
      const fieldValue: JSONFieldValue = {
        isPlain,
        data,
      };
      newFields[mappedField.cfId] = setCFLocaleValue(fieldValue, defaultLocale);
    }
    // plain text case
    if (mappedField.type === CFFieldType.Symbol && typeof value === "string") {
      newFields[mappedField.cfId] = setCFLocaleValue(value, defaultLocale);
    }
    // long text html-markdown case
    if (mappedField.type === CFFieldType.Text && typeof value === "string") {
      const markdown = converter.makeMarkdown(value);
      newFields[mappedField.cfId] = setCFLocaleValue(markdown, defaultLocale);
    }
    // richtext case
    if (
      mappedField.type === CFFieldType.RichText &&
      typeof value === "string"
    ) {
      const document = htmlStringToDocument(value, htmlStringToDocumentOptions);
      newFields[mappedField.cfId] = setCFLocaleValue(document, defaultLocale);
    }
    // numbers case
    if (isNumberType && typeof value === "string") {
      const convertedNum = Number(value);
      newFields[mappedField.cfId] = setCFLocaleValue(
        isNaN(convertedNum) ? 0 : convertedNum,
        defaultLocale
      );
    }
    // empty arr case
    if (Array.isArray(value) && value.length === 0) {
      if (
        mappedField.type === CFFieldType.Text ||
        mappedField.type === CFFieldType.Symbol
      ) {
        // case for empty radio
        newFields[mappedField.cfId] = setCFLocaleValue(
          undefined,
          defaultLocale
        );
      } else {
        // case for empty components, assets, checkboxes
        newFields[mappedField.cfId] = setCFLocaleValue([], defaultLocale);
      }
      continue;
    }
    // radio case
    if (
      mappedField.type === CFFieldType.Symbol &&
      Array.isArray(value) &&
      "label" in value[0]
    ) {
      newFields[mappedField.cfId] = setCFLocaleValue(
        value[0].label,
        defaultLocale
      );
    }
    // checkbox case
    if (
      mappedField.type === CFFieldType.Array &&
      Array.isArray(value) &&
      "label" in value[0]
    ) {
      newFields[mappedField.cfId] = setCFLocaleValue(
        (value as GCChoiceField).map((v) => v.label),
        defaultLocale
      );
    }
    // assets case
    if (mappedField.type === CFFieldType.Assets && Array.isArray(value)) {
      assets = assets.concat(
        prepareAssetsForCF(
          mappedField.cfId,
          value as GCAssetField,
          defaultLocale
        )
      );
    }
    // component case
    if (isComponentType) {
      const componentValue = getGCComponentValue(value);
      if (!componentValue) continue;
      if (Array.isArray(componentValue)) {
        if (componentValue.every(isComponentEmpty)) continue;
      } else {
        if (isComponentEmpty(componentValue)) continue;
      }
      components.push({
        gcFieldId: mappedField.gcId,
        cfFieldId: mappedField.cfId,
        content: componentValue,
      });
    }
  }
  return { fields: newFields, assets, components };
}

export function addGCNameField(name: string, defaultLocale: string = US_LOCALE) {
  return {
    [CF_GC_ENTRY_NAME_FIELD]: {
      [defaultLocale]: name,
    },
  };
}

export function createAssetsFieldValue(
  assetIds: string[],
  fieldId: string,
  locale: string
) {
  return {
    [fieldId]: {
      [locale]: assetIds.map((id) => ({
        sys: {
          type: "Link",
          linkType: "Asset",
          id,
        },
      })),
    },
  };
}

export function createEntryRefFieldValue(
  fieldId: string,
  refIds: string | string[],
  locale: string
) {
  if (Array.isArray(refIds)) {
    return {
      [fieldId]: {
        [locale]: refIds.map((id) => ({
          sys: {
            type: CONTENTFUL_LINK,
            linkType: ContentfulLinkType.Entry,
            id,
          },
        })),
      },
    };
  }
  return {
    [fieldId]: {
      [locale]: {
        sys: {
          type: CONTENTFUL_LINK,
          linkType: ContentfulLinkType.Entry,
          id: refIds,
        },
      },
    },
  };
}

export async function mapEntryFields(
  entryId: string,
  config: MappingConfig,
  credentials: APICredentials
) {
  const entryFields = await getItemFields(credentials, entryId);
  return composeEntryFieldsForCF(config.fields, entryFields.data.content);
}

export function getComponentIdsFromTemplate(
  template: GCTemplate,
  components: CFPrepareComponent[]
): Required<CFPrepareComponent>[] {
  const componentsWithIds: Required<CFPrepareComponent>[] = [];
  const templateFields = getFieldsFromStructure(template.structure);
  for (const component of components) {
    const componentId = templateFields[component.gcFieldId].component?.uuid;
    const componentFields =
      templateFields[component.gcFieldId].component?.fields;
    if (!componentId || !componentFields) continue;
    componentsWithIds.push({
      ...component,
      componentId,
      fieldMapping: createFieldsMappingForComponents(componentFields),
    });
  }
  return componentsWithIds;
}

export function addImportTime(config: MappingConfig): EntryProps["fields"] {
  const newFields: EntryProps["fields"] = {};
  const fieldValue = JSON.stringify({
    ...config,
    lastImportedAt: new Date(),
  });
  newFields[CF_HIDDEN_FIELD] = {
    [US_LOCALE]: fieldValue,
  };
  return newFields;
}

export function getImportTime(entry: EntryProps) {
  const importTimeFieldValue = entry.fields[CF_HIDDEN_FIELD]?.[US_LOCALE];
  if (!importTimeFieldValue) return null;
  const timestamp = getConfigFieldValue("lastImportedAt", importTimeFieldValue) as string | null;
  if (!timestamp) return null;
  return formatDate(timestamp);
}
