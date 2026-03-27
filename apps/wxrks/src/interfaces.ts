export enum WorkflowType {
  TRANSLATION = "TRANSLATION",
  PROOFREADING = "PROOFREADING",
  REVIEW = "REVIEW",
  REVIEW_2 = "REVIEW 2",
  REVIEW_3 = "REVIEW 3",
  ICR = "ICR",
  REGIONAL_APPROVAL = "REGIONAL APPROVAL",
  ICR_2 = "ICR 2",
  WEB_QA = "WEB QA",
  FEEDBACK_IMPLEMENTATION = "FEEDBACK IMPLEMENTATION"
}

export enum FieldType {
  Symbol = "Symbol",
  Text = "Text",
  RichText = "RichText"
}

export interface Workflow {
  key: WorkflowType;
  description: string;
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
  workflows: string[];
  selectedContentTypes: string[];
}

export interface EditorInterfaceAssignment {
  [key: string]: { [key: string]: { position: number } };
}
