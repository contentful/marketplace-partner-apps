import { EntryAPI, EntryFieldAPI } from "@contentful/app-sdk";
import {
  AssetToExport,
  CFFieldType,
  Field,
  GCContent,
  GCFieldDictionary,
  GCFieldType,
  JSONFieldValue,
  MappingConfig,
  Structure,
} from "@/type/types";
import { converter } from "./common";
import { documentToHtmlString } from "@contentful/rich-text-html-renderer";
import { documentToHTMLOptions } from "./parser";
import { EntryProps } from "contentful-management";
import { repeatableTextOptions } from "@/consts/fieldMap";
import { Document } from "@contentful/rich-text-types";

export function getFieldsFromStructure(structure: Structure) {
  return structure.groups
    .flatMap((group) => group.fields)
    .reduce<GCFieldDictionary>((acc, curr) => {
      acc[curr.uuid] = curr;
      return acc;
    }, {});
}

function findGCOptionId(gcField: Field, label: string) {
  return (
    gcField.metadata.choice_fields?.options?.find(
      (option) => option.label === label
    )?.optionId || null
  );
}

function getChosenOptions(
  GCFields: Field,
  cfField: EntryFieldAPI,
  locale: string
) {
  const cfValue = getValueFromCFField(cfField, locale);
  if (Array.isArray(cfValue)) {
    if (cfValue.length === 0) return [];
    return cfValue
      .map((value) => ({
        id: findGCOptionId(GCFields, value) || "",
        label: value,
      }))
      .filter((value) => value.id);
  } else {
    return [
      {
        id: findGCOptionId(GCFields, cfValue) || "",
        label: cfValue,
      },
    ];
  }
}

export function getGCAssetId(cfId: string) {
  return cfId.replace("-", "/");
}

export function composeAssetIds(
  cfField: EntryFieldAPI,
  fieldId: string,
  locale: string
) {
  const fieldVal = getValueFromCFField(cfField, locale);
  if (fieldVal && Array.isArray(fieldVal)) {
    return fieldVal.map((asset) => ({
      assetId: asset.sys.id,
      fieldId,
    }));
  }
  return [];
}

export function getValueFromCFField(
  cfField: EntryFieldAPI | EntryProps["fields"],
  locale: string
) {
  if ("getValue" in cfField) {
    return cfField.getValue(locale);
  } else {
    return cfField[locale];
  }
}

export function getComponentFieldsDicts(fields: GCFieldDictionary) {
  const componentFields: { fieldId: string; fields: GCFieldDictionary }[] = [];
  for (const fieldId of Object.keys(fields)) {
    const field = fields[fieldId];
    if (field.field_type === GCFieldType.Component && field.component) {
      componentFields.push({
        fieldId,
        fields: field.component.fields.reduce<GCFieldDictionary>(
          (acc, curr) => {
            acc[curr.uuid] = curr;
            return acc;
          },
          {}
        ),
      });
    }
  }
  return componentFields;
}

export function composeGCContentToExport(
  fields: GCFieldDictionary,
  mappedFields: MappingConfig["fields"],
  cfFields: EntryAPI["fields"] | EntryProps["fields"],
  locale: string
) {
  const content: GCContent = {};
  let assets: AssetToExport[] = [];
  let components: { fieldId: string; refs: string[] | string }[] = [];
  for (const field of mappedFields) {
    const gcField = fields[field.gcId];
    const cfField = cfFields[field.cfId];
    if (!gcField || !cfField) continue;
    const isRepeatable = gcField.metadata.repeatable?.isRepeatable || false;
    const isPlain = gcField.metadata.is_plain || false;
    const isChoiceField = [GCFieldType.Checkbox, GCFieldType.Radio].includes(
      gcField.field_type
    );
    // checkbox or radio case
    if (isChoiceField) {
      content[field.gcId] = getChosenOptions(gcField, cfField, locale);
    }
    if (
      gcField.field_type === GCFieldType.Text &&
      isRepeatable &&
      repeatableTextOptions.includes(field.type)
    ) {
      const value = getValueFromCFField(cfField, locale) as JSONFieldValue;
      if (!value || !value.data || value.data.length === 0) {
        content[field.gcId] = [];
      } else {
        if (isPlain) {
          content[field.gcId] = value.data.map(
            (entry) => entry.content as string
          );
        } else {
          content[field.gcId] = value.data.map((entry) => {
            const htmlString = documentToHtmlString(
              entry.content as Document,
              documentToHTMLOptions
            );
            return htmlString;
          });
        }
      }
    }
    // case for plain text fields
    if (gcField.field_type === GCFieldType.Text && !isRepeatable && isPlain) {
      content[field.gcId] = getValueFromCFField(cfField, locale) || "";
    }
    // case for richtext
    if (
      gcField.field_type === GCFieldType.Text &&
      !isPlain &&
      !isRepeatable &&
      field.type === CFFieldType.RichText
    ) {
      const value = getValueFromCFField(cfField, locale);
      if (!value) {
        content[field.gcId] = "";
        continue;
      }
      const htmlString = documentToHtmlString(value, documentToHTMLOptions);
      content[field.gcId] = htmlString;
    }
    // case for html-markdown fields
    if (
      gcField.field_type === GCFieldType.Text &&
      !isPlain &&
      !isRepeatable &&
      field.type !== CFFieldType.RichText
    ) {
      const value = getValueFromCFField(cfField, locale) || "";
      content[field.gcId] = converter.makeHtml(value);
    }
    // case for asset fields
    if (gcField.field_type === GCFieldType.Attachment) {
      const value = getValueFromCFField(cfField, locale);
      if (!value || (Array.isArray(value) && value.length === 0)) {
        content[field.gcId] = [];
      }
      assets = assets.concat(composeAssetIds(cfField, field.gcId, locale));
    }
    // case for component fields
    if (gcField.field_type === GCFieldType.Component) {
      const value = getValueFromCFField(cfField, locale);
      if (!value && isRepeatable) {
        content[field.gcId] = [];
        continue;
      }
      if (!value) continue;
      if (Array.isArray(value)) {
        if (value.length === 0) continue;
        components = components.concat({
          fieldId: field.gcId,
          refs: value.map((entry) => entry.sys.id),
        });
      } else {
        components = components.concat({
          fieldId: field.gcId,
          refs: value.sys.id,
        });
      }
    }
  }
  return { content, assets, components };
}

export function getAssetUrl(url: string | undefined) {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
}
