import camelcase from "camelcase";
import {
  CF_GC_ENTRY_NAME_FIELD,
  CF_HIDDEN_FIELD,
  IGNORE,
  defaultRichTextValidations,
  fieldMapOptions,
  repeatableTextOptions,
} from "@/consts/fieldMap";
import {
  ContentFields,
  ContentTypeProps,
  EditorInterfaceProps,
} from "contentful-management";
import {
  ExtendedGCTemplate,
  MappingData,
  GCFieldType,
  CFFieldType,
  Option,
  FieldMapping,
  Field,
  ComponentData,
  MappingConfig,
} from "@/type/types";
import { getConfigFieldValue, parseMapping } from "./parseMapping";
import { US_LOCALE } from "./common";

export enum ContentfulLinkType {
  Asset = "Asset",
  Entry = "Entry",
}

export const CONTENTFUL_LINK = "Link";

function correctFieldNameLength(name: string) {
  return name.length > 50 ? name.substring(0, 50) : name;
}

export function initMappingSettings(
  template: ExtendedGCTemplate | null
): MappingData | null {
  if (!template) return null;
  if (template.mappedCFModel && template.mappingConfig) {
    const config = parseMapping(template.mappingConfig);
    if (!config) return null;
    return {
      templateId: template.id,
      projectId: template.project_id,
      name: template.name,
      fields: config.fields,
      statuses: config.statuses,
      useGCEntryTitle: config.useGCEntryTitle || false,
    };
  }
  return {
    templateId: template.id,
    projectId: template.project_id,
    name: template.name,
    fields: mapFieldsToDefaults(template),
    statuses: [],
    useGCEntryTitle: false,
  };
}

export function mapFieldsToDefaults(
  template: ExtendedGCTemplate
): MappingData["fields"] {
  const fields: MappingData["fields"] = [];
  for (const group of template.structure.groups) {
    for (const field of group.fields) {
      if (field.field_type === GCFieldType.Guidelines) continue;
      const isRepeatable = field.metadata?.repeatable?.isRepeatable || false;
      const isPlain = field.metadata?.is_plain || false;
      const cfId = camelcase(field.label.replaceAll(/[^a-zA-Z0-9-_]/g, "-"));
      const gcId = field.uuid;

      if (field.field_type === GCFieldType.Component) {
        fields.push({
          gcId,
          type: isRepeatable
            ? CFFieldType.Components
            : CFFieldType.SingleComponent,
          cfId,
        });
        continue;
      }

      if (field.field_type === GCFieldType.Text && isRepeatable) {
        fields.push({
          gcId,
          type: isPlain
            ? CFFieldType.RepeatablePlain
            : CFFieldType.RepeatableRich,
          cfId,
        });
        continue;
      }

      const defaultFieldType =
        fieldMapOptions.find((f) => f.gatherContent.includes(field.field_type))
          ?.contentful ?? CFFieldType.Ignore;

      fields.push({
        gcId,
        type: defaultFieldType,
        cfId,
      });
    }
  }
  return fields;
}

export function mapFieldsToIgnore(template: ExtendedGCTemplate) {
  const fields: MappingData["fields"] = [];
  for (const group of template.structure.groups) {
    for (const field of group.fields) {
      if (field.field_type === GCFieldType.Guidelines) continue;
      fields.push({
        gcId: field.uuid,
        type: CFFieldType.Ignore,
        cfId: IGNORE,
      });
    }
  }
  return fields;
}

export function updateFieldMappingType(
  fields: MappingData["fields"],
  gcId: string,
  type: CFFieldType
) {
  return fields.map((field) => {
    if (field.gcId === gcId) {
      return {
        ...field,
        type,
      };
    }
    return field;
  });
}

export function updateFieldMappingCfId(
  fields: MappingData["fields"],
  gcId: string,
  cfField: ContentFields,
  gcField: Field
) {
  return fields.map((field) => {
    if (field.gcId === gcId) {
      return {
        ...field,
        cfId: cfField.id,
        type: getContentfulFieldType(cfField, gcField),
      };
    }
    return field;
  });
}

export function getFieldType(fields: MappingData["fields"], gcId: string) {
  return (
    fields.find((field) => field.gcId === gcId)?.type || CFFieldType.Symbol
  );
}

export function getFieldCfId(fields: MappingData["fields"], gcId: string) {
  return fields.find((field) => field.gcId === gcId)?.cfId || "";
}

function choiceFieldProps(fieldType: GCFieldType, options?: Option[]) {
  if (fieldType === GCFieldType.Radio) {
    return {
      validations: [{ in: options?.map((o) => o.label) }],
    };
  }

  return {
    items: {
      type: CFFieldType.Symbol,
      validations: [{ in: options?.map((o) => o.label) }],
    },
  };
}

export function populateHiddenField(data: MappingData | null) {
  if (!data) return null;
  return {
    id: CF_HIDDEN_FIELD,
    name: "Content Workflow Mapping Config DO NOT EDIT",
    required: false,
    localized: false,
    omitted: true,
    disabled: true,
    type: CFFieldType.Text,
    defaultValue: {
      [US_LOCALE]: JSON.stringify({
        templateId: data.templateId,
        projectId: data.projectId,
        statuses: data.statuses,
        fields: filterIgnoreFields(data.fields),
        useGCEntryTitle: data.useGCEntryTitle,
      }),
    },
  };
}

export function populateGCEntryNameField() {
  return {
    id: CF_GC_ENTRY_NAME_FIELD,
    name: "Content Workflow Entry Name",
    required: false,
    localized: false,
    type: CFFieldType.Symbol,
  };
}

export function filterIgnoreFields(fields: MappingData["fields"]) {
  return fields.filter((field) => field.type !== CFFieldType.Ignore);
}

function createFieldType(
  mappedType: FieldMapping["type"],
  templateField: Field
) {
  const isChoiceField = [GCFieldType.Checkbox, GCFieldType.Radio].includes(
    templateField.field_type
  );
  const isRepeatableField = repeatableTextOptions.includes(mappedType);

  if (isRepeatableField) {
    return {
      type: CFFieldType.Object,
    };
  }

  if (isChoiceField) {
    return {
      type: mappedType,
      ...choiceFieldProps(
        templateField.field_type,
        templateField.metadata.choice_fields?.options
      ),
    };
  }

  if (mappedType === CFFieldType.RichText) {
    return {
      type: mappedType,
      validations: defaultRichTextValidations,
    };
  }

  if (mappedType === CFFieldType.Assets) {
    return {
      type: CFFieldType.Array,
      items: {
        type: CONTENTFUL_LINK,
        linkType: ContentfulLinkType.Asset,
      },
    };
  }

  return {
    type: mappedType,
  };
}

export function composeNewFieldsForCf(
  data: MappingData,
  template: ExtendedGCTemplate
) {
  const newCFFields: ContentFields[] = [];
  const components: ComponentData[] = [];
  const templateFields = template.structure.groups.flatMap((g) => g.fields);
  const filteredFields = filterIgnoreFields(data.fields);
  for (const field of filteredFields) {
    const templateField = templateFields.find((f) => f.uuid === field.gcId);
    if (!templateField) continue;
    let name = correctFieldNameLength(templateField.label);
    if (
      templateField.field_type === GCFieldType.Component &&
      templateField.component
    ) {
      components.push({
        cfFieldId: field.cfId,
        cfFieldName: name,
        uuid: templateField.component.uuid,
        fields: templateField.component.fields,
        isRepeatable: templateField.metadata?.repeatable?.isRepeatable || false,
      });
      continue;
    }
    newCFFields.push({
      id: field.cfId,
      name,
      required: false,
      localized: false,
      ...createFieldType(field.type, templateField),
    });
  }
  const hiddenField = populateHiddenField(data);
  if (hiddenField) newCFFields.push(hiddenField);
  return { fields: newCFFields, components };
}

export function chooseCompatibeFields(
  gcFieldType: GCFieldType,
  cfFields: ContentFields[]
) {
  const matchingFields = fieldMapOptions.filter((field) =>
    field.gatherContent.includes(gcFieldType)
  );
  return cfFields.filter((field) =>
    matchingFields.find((f) => f.contentful === field.type)
  );
}

export function filterUnmappedModels(models: ContentTypeProps[]) {
  return models.filter((model) => {
    const fields = model.fields as ContentFields[];
    return !fields.find((field) => field.id === CF_HIDDEN_FIELD);
  });
}

export function getMappedModelsTemplates(models: ContentTypeProps[]) {
  const mappedToIds = models.map((model) => {
    const fields = model.fields as ContentFields[];
    const configField = fields.find((field) => field.id === CF_HIDDEN_FIELD);
    if (!configField) return null;
    const config = parseMapping(configField.defaultValue?.[US_LOCALE]);
    if (!config) return null;
    return config.templateId;
  });
  return mappedToIds.filter((id) => id !== null) as string[];
}

export function getMappedCfField(
  modelFields: ContentFields[],
  fieldId: string
) {
  return modelFields.find((field) => field.id === fieldId) || null;
}

export function areMappedFieldsPresent(data: MappingData | null) {
  if (!data) return false;
  return filterIgnoreFields(data.fields).length > 0;
}

function areFieldsMappingsEqual(
  arr1: MappingData["fields"],
  arr2: MappingData["fields"]
) {
  const arr1Copy = [...arr1];
  const arr2Copy = [...arr2];
  if (arr1Copy.length !== arr2Copy.length) return false;
  arr1Copy.sort((a, b) => a.gcId.localeCompare(b.gcId));
  arr2Copy.sort((a, b) => a.gcId.localeCompare(b.gcId));
  for (let i = 0; i < arr1Copy.length; i += 1) {
    if (arr1Copy[i].cfId !== arr2Copy[i].cfId) return false;
  }
  return true;
}

function areStatusesMappingsEqual(
  arr1: MappingData["statuses"],
  arr2: MappingData["statuses"]
) {
  const arr1Copy = [...arr1];
  const arr2Copy = [...arr2];
  if (arr1Copy.length !== arr2Copy.length) return false;
  arr1Copy.sort((a, b) => a.id.localeCompare(b.id));
  arr2Copy.sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < arr1Copy.length; i += 1) {
    if (
      arr1Copy[i].cfStatus !== arr2Copy[i].cfStatus ||
      arr1Copy[i].changeStatusInGC !== arr2Copy[i].changeStatusInGC
    )
      return false;
  }
  return true;
}

export function isMappingDataUnchanged(
  data: MappingData | null,
  config: string
) {
  if (!data) return false;
  const parsedConfig = parseMapping(config);
  if (!parsedConfig) return false;
  const fieldsEqual = areFieldsMappingsEqual(
    parsedConfig.fields,
    filterIgnoreFields(data.fields)
  );
  const statusesEqual = areStatusesMappingsEqual(
    parsedConfig.statuses,
    data.statuses
  );
  const useGCEntryTitleEqual =
    parsedConfig.useGCEntryTitle === data.useGCEntryTitle;
  return fieldsEqual && statusesEqual && useGCEntryTitleEqual;
}

function setFieldMappingFromConfig(
  fields: MappingData["fields"],
  template: ExtendedGCTemplate
) {
  const newFields: MappingData["fields"] = [];
  for (const group of template.structure.groups) {
    for (const field of group.fields) {
      if (field.field_type === GCFieldType.Guidelines) continue;
      const mapping = fields.find((f) => f.gcId === field.uuid);
      if (mapping) {
        newFields.push(mapping);
      } else {
        newFields.push({
          gcId: field.uuid,
          type: CFFieldType.Ignore,
          cfId: IGNORE,
        });
      }
    }
  }
  return newFields;
}

export function setMappingFromModel(
  model: ContentTypeProps,
  template: ExtendedGCTemplate,
  fields?: MappingData["fields"],
  statuses?: MappingData["statuses"],
  useGCEntryTitle?: MappingData["useGCEntryTitle"]
) {
  return {
    templateId: template.id,
    projectId: template.project_id,
    name: model.name,
    description: model.description || "",
    fields: fields?.length
      ? setFieldMappingFromConfig(fields, template)
      : mapFieldsToIgnore(template),
    statuses: statuses?.length ? statuses : [],
    useGCEntryTitle: useGCEntryTitle || false,
  };
}

export function findMappedModelConfig(
  cfModels: ContentTypeProps[],
  templateId: string
) {
  for (const model of cfModels) {
    const hiddenField = model.fields.find(
      (field) => field.id === CF_HIDDEN_FIELD
    );
    if (hiddenField && hiddenField.defaultValue) {
      const id = getConfigFieldValue(
        "templateId",
        hiddenField.defaultValue[US_LOCALE]
      );
      if (id === templateId)
        return {
          config: hiddenField.defaultValue[US_LOCALE],
          modelId: model.sys.id,
        };
    }
  }
  return null;
}

export function getRepeatableTextFieldIds(config: MappingConfig) {
  const ids: string[] = [];
  for (const field of config.fields) {
    if (repeatableTextOptions.includes(field.type)) {
      ids.push(field.cfId);
    }
  }
  return ids;
}

export function updateCFControls(
  controls: EditorInterfaceProps["controls"],
  appId: string,
  repeatableTextFields: string[]
) {
  return (
    controls?.map((control) => {
      if (control.fieldId === CF_HIDDEN_FIELD) {
        return {
          ...control,
          widgetNamespace: "app",
          widgetId: appId,
          settings: {
            helpText:
              "This field stores Content Workflow template mapping config. Do not edit!",
          },
        };
      }
      if (control.fieldId === CF_GC_ENTRY_NAME_FIELD) {
        return {
          ...control,
          widgetNamespace: "app",
          widgetId: appId,
          settings: {
            helpText:
              "This field's value is imported from Content Workflow if mapping config is configured to do so.",
          },
        };
      }
      if (repeatableTextFields.includes(control.fieldId)) {
        return {
          ...control,
          widgetNamespace: "app",
          widgetId: appId,
          settings: {
            helpText: "This field represents Content Workflow repeatable text",
          },
        };
      }
      return control;
    }) || []
  );
}

export function getConfigFromMappingData(data: MappingData) {
  return {
    templateId: data.templateId,
    projectId: data.projectId,
    fields: filterIgnoreFields(data.fields),
    statuses: data.statuses,
    useGCEntryTitle: data.useGCEntryTitle,
  };
}

export function getContentfulFieldType(
  field: ContentFields,
  gcField: Field
): CFFieldType {
  if (
    field.type === CFFieldType.Object &&
    gcField.field_type === GCFieldType.Text &&
    gcField.metadata?.repeatable?.isRepeatable
  ) {
    const isPlain = gcField.metadata?.is_plain || false;
    return isPlain ? CFFieldType.RepeatablePlain : CFFieldType.RepeatableRich;
  }
  if (
    field.type === CONTENTFUL_LINK &&
    field.linkType === ContentfulLinkType.Entry
  ) {
    return CFFieldType.SingleComponent;
  }
  if (field.type !== CFFieldType.Array) return field.type as CFFieldType;
  const isLink = field.items?.type === CONTENTFUL_LINK;
  const linkType = field.items?.linkType;
  if (isLink && linkType === ContentfulLinkType.Asset)
    return CFFieldType.Assets;
  if (isLink && linkType === ContentfulLinkType.Entry)
    return CFFieldType.Components;
  return field.type;
}

export function createEntryRefFieldType(ids: string[], isArray: boolean) {
  const commonData = {
    type: CONTENTFUL_LINK,
    linkType: ContentfulLinkType.Entry,
    validations: [
      {
        linkContentType: ids,
      },
    ],
  };
  if (isArray) {
    return {
      type: CFFieldType.Array,
      items: commonData,
    };
  }
  return {
    ...commonData,
  };
}

export function getComponentFieldType(field: Field) {
  let fieldType = CFFieldType.Text;
  const isRepeatable = field.metadata?.repeatable?.isRepeatable || false;
  const isPlain = field.metadata?.is_plain || false;
  if (field.field_type === GCFieldType.Text && isRepeatable) {
    return isPlain ? CFFieldType.RepeatablePlain : CFFieldType.RepeatableRich;
  }
  if (field.field_type === GCFieldType.Text && !isPlain) {
    return CFFieldType.RichText;
  }
  if (field.field_type === GCFieldType.Checkbox) {
    return CFFieldType.Array;
  }
  if (field.field_type === GCFieldType.Attachment) {
    return CFFieldType.Assets;
  }
  return fieldType;
}

export function createComponentField(field: Field): ContentFields {
  let fieldType = getComponentFieldType(field);
  return {
    id: getCFComponentUUID(field.uuid),
    name: correctFieldNameLength(field.label),
    required: false,
    localized: false,
    ...createFieldType(fieldType, field),
  };
}

export function composeComponentModel(
  component: ComponentData,
  modelName: string
) {
  const fields: ContentFields[] = [];
  for (const field of component.fields) {
    if (field.field_type === GCFieldType.Guidelines) continue;
    fields.push(createComponentField(field));
  }
  return {
    name: modelName,
    description: "",
    displayField: fields[0].id,
    fields,
  };
}

export function getCFComponentUUID(id: string) {
  return "Component" + id.replaceAll("-", "_");
}

export function getGCComponentUUID(id: string) {
  return id.replaceAll("_", "-").replace("Component", "");
}

export function setCFFieldValidation(
  field: ContentFields,
  newContentId: string
) {
  const newField = { ...field };
  if (newField.type === CFFieldType.Array && newField.items?.validations) {
    for (const validation of newField.items.validations) {
      if (validation.linkContentType) {
        validation.linkContentType.push(newContentId);
        return newField;
      }
    }
  }
  if (
    newField.type === CFFieldType.Array &&
    newField.items &&
    !newField.items?.validations
  ) {
    newField.items.validations = [{ linkContentType: [newContentId] }];
    return newField;
  }
  if (newField.validations) {
    for (const validation of newField.validations) {
      if (validation.linkContentType) {
        validation.linkContentType.push(newContentId);
        return newField;
      }
    }
  } else {
    newField.validations = [{ linkContentType: [newContentId] }];
  }
  return newField;
}
