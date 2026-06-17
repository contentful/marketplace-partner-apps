export enum FieldType {
  Symbol = "Symbol",
  Text = "Text",
  RichText = "RichText"
}

export interface Workflow {
  uuid?: string;
  code: string;
  title?: string;
  description?: string;
  sequence?: number;
  active?: boolean;
}

export interface Locale {
  code: string;
  title: string;
}

export interface ConfigGroup {
  uuid: string;
  name: string;
  locales: string[];
}

export interface ProjectCreation {
  configGroupUuid: string;
  targetLocales: string[];
  displayTitle?: string;
  workflows?: string[];
}

export interface TmChange {
  sourceText: string;
  targetText: string;
  sourceLocale: string;
  targetLocale: string;
  fieldType: FieldType
  fieldId: string;
}

export interface AppInstallationParameters {
  apiKey: string;
  secretKey: string;
  configUuid: string;
  orgUnitUuid: string;
  contactUuid: string;
  workflows: string;
}

