import {
  AppInstallationParameters,
  ContentTypeConfig,
  FieldDefaultConfig,
} from "../types/config";

export function setContentTypeEnabled(
  prev: AppInstallationParameters,
  ctId: string,
  enabled: boolean
): AppInstallationParameters {
  const current = prev.contentTypes?.[ctId];
  return {
    ...prev,
    contentTypes: {
      ...prev.contentTypes,
      [ctId]: {
        enabled,
        fields: current?.fields ?? {},
      },
    },
  };
}

export function toggleFieldSelection(
  prev: AppInstallationParameters,
  ctId: string,
  fieldId: string,
  fieldType: FieldDefaultConfig["fieldType"]
): AppInstallationParameters {
  const ctConfig: ContentTypeConfig = prev.contentTypes?.[ctId] ?? {
    enabled: false,
    fields: {},
  };
  const fieldExists = !!ctConfig.fields[fieldId];

  const updatedFields: Record<string, FieldDefaultConfig> = {
    ...ctConfig.fields,
  };
  if (fieldExists) {
    delete updatedFields[fieldId];
  } else {
    let defaultValue: FieldDefaultConfig["defaultValue"];
    if (fieldType === "Date") defaultValue = { type: "current-date" };
    else if (fieldType === "JSON") defaultValue = { type: "json", value: {} };
    else if (fieldType === "Asset" || fieldType === "AssetArray")
      defaultValue = { type: "asset" };
    else defaultValue = { type: "entry" };
    updatedFields[fieldId] = { fieldType, defaultValue };
  }

  const newEnabled = hasConfiguredField(updatedFields);

  return {
    ...prev,
    contentTypes: {
      ...prev.contentTypes,
      [ctId]: {
        ...ctConfig,
        enabled: newEnabled,
        fields: updatedFields,
      },
    },
  };
}

export function setLinkValue(
  prev: AppInstallationParameters,
  ctId: string,
  fieldId: string,
  linkType: "Asset" | "Entry",
  idValue: string | string[]
): AppInstallationParameters {
  const ctConfig: ContentTypeConfig = prev.contentTypes?.[ctId] ?? {
    enabled: false,
    fields: {},
  };

  const prevFieldType = ctConfig.fields[fieldId]?.fieldType;
  const inferredType: FieldDefaultConfig["fieldType"] = prevFieldType
    ? prevFieldType
    : Array.isArray(idValue)
    ? linkType === "Asset"
      ? "AssetArray"
      : "EntryArray"
    : linkType;

  const updatedFields: Record<string, FieldDefaultConfig> = {
    ...ctConfig.fields,
    [fieldId]: {
      fieldType: inferredType,
      defaultValue: {
        type: linkType === "Asset" ? "asset" : "entry",
        value: idValue,
      },
    },
  };

  const newEnabled = hasConfiguredField(updatedFields);

  return {
    ...prev,
    contentTypes: {
      ...(prev.contentTypes ?? {}),
      [ctId]: {
        ...ctConfig,
        enabled: newEnabled,
        fields: updatedFields,
      },
    },
  };
}

export function setJsonValue(
  prev: AppInstallationParameters,
  ctId: string,
  fieldId: string,
  value: any
): AppInstallationParameters {
  const ctConfig = prev.contentTypes?.[ctId];
  if (!ctConfig) return prev;
  const updatedFields: Record<string, FieldDefaultConfig> = {
    ...ctConfig.fields,
    [fieldId]: {
      fieldType: "JSON",
      defaultValue: { type: "json", value },
    },
  };

  const newEnabled = hasConfiguredField(updatedFields);

  return {
    ...prev,
    contentTypes: {
      ...prev.contentTypes,
      [ctId]: {
        ...ctConfig,
        enabled: newEnabled,
        fields: updatedFields,
      },
    },
  };
}

export function setDateConfig(
  prev: AppInstallationParameters,
  ctId: string,
  fieldId: string,
  defaultValue: FieldDefaultConfig["defaultValue"]
): AppInstallationParameters {
  const ctConfig = prev.contentTypes?.[ctId];
  if (!ctConfig) return prev;
  const updatedFields: Record<string, FieldDefaultConfig> = {
    ...ctConfig.fields,
    [fieldId]: {
      fieldType: "Date",
      defaultValue,
    },
  };

  const newEnabled = hasConfiguredField(updatedFields);

  return {
    ...prev,
    contentTypes: {
      ...prev.contentTypes,
      [ctId]: {
        ...ctConfig,
        enabled: newEnabled,
        fields: updatedFields,
      },
    },
  };
}

function hasConfiguredField(
  fields: Record<string, FieldDefaultConfig>
): boolean {
  return Object.values(fields).some((fieldCfg) => {
    if (!fieldCfg) return false;
    if (fieldCfg.fieldType === "Date") return true;
    const val = (fieldCfg.defaultValue as any)?.value;
    if (val === undefined) return false;
    if (typeof val === "string") return val !== "";
    return true;
  });
}
