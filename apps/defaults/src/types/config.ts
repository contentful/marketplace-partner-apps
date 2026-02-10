export type DefaultValueType =
  | "current-date"
  | "offset-date"
  | "start-of-month"
  | "asset"
  | "entry"
  | "json";

export interface FieldDefaultConfig {
  fieldType: "Date" | "Asset" | "Entry" | "JSON" | "AssetArray" | "EntryArray";
  defaultValue: {
    type: DefaultValueType;
    value?: any;
  };
}

export interface ContentTypeConfig {
  enabled: boolean;
  fields: {
    [fieldId: string]: FieldDefaultConfig;
  };
}

export interface AppInstallationParameters {
  contentTypes?: {
    [contentTypeId: string]: ContentTypeConfig;
  };
}
