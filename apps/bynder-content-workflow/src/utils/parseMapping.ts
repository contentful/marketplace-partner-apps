import { ContentTypeAPI } from "@contentful/app-sdk";
import { CF_HIDDEN_FIELD } from "@/consts/fieldMap";
import { MappingConfig } from "@/type/types";
import { US_LOCALE } from "./common";

export function parseMapping(json: string): MappingConfig | null {
  try {
    const data = JSON.parse(json);
    if (
      data &&
      data.templateId &&
      data.projectId &&
      data.statuses &&
      data.fields
    ) {
      return data as MappingConfig;
    } else {
      throw new Error("Error: Model's GC mapping config is invalid");
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export function getConfigFieldValue(key: keyof MappingConfig, json: string) {
  const config = parseMapping(json);
  if (config) {
    return config[key];
  }
  return null;
}

export function getConfigFromContentType(contentType: ContentTypeAPI) {
  const configField = contentType.fields.find((field) => field.id === CF_HIDDEN_FIELD);
  if (!configField) return null;
  return parseMapping(configField.defaultValue?.[US_LOCALE]);
}
