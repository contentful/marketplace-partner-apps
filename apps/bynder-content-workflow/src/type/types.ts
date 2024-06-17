import {
  ContentFields,
  CreateAssetProps,
  EntryProps,
} from "contentful-management";
import { Document } from "@contentful/rich-text-types";
import { APICredentials } from "@/services/api";

export type CFFields = Pick<ContentFields, "name" | "type">[] | null;

export enum AppScreens {
  SelectTemplate = "selectTemplate",
  ViewAllMappings = "viewAllMappings",
  EditMapping = "importTemplate",
  ImportEntries = "importEntries",
}

export enum GCFieldType {
  Checkbox = "choice_checkbox",
  Radio = "choice_radio",
  Guidelines = "guidelines",
  Attachment = "attachment",
  Text = "text",
  Component = "component",
}

export enum CFFieldType {
  Number = "Number",
  Integer = "Integer",
  Symbol = "Symbol",
  Text = "Text",
  Object = "Object",
  Array = "Array",
  RichText = "RichText",
  Assets = "Assets",
  SingleComponent = "SingleComponent",
  Components = "Components",
  RepeatableRich = "RepeatableRich",
  RepeatablePlain = "RepeatablePlain",
  Ignore = "Ignore",
}

export enum MappingFieldTypeName {
  TextShort = "Text (Short)",
  TextLong = "Text (Long)",
  NumberInteger = "Number (Integer)",
  NumberDecimal = "Number (Decimal)",
  Array = "Array",
  JSONObject = "JSON Object",
}

export type Option = {
  optionId: string;
  label: string;
};

export type Metadata = {
  is_plain: boolean;
  validation: unknown | null;
  repeatable: {
    limit: number;
    isRepeatable: boolean;
    limitEnabled: boolean;
  };
  choice_fields: {
    options: Option[];
  };
};

export type Field = {
  uuid: string;
  label: string;
  field_type: GCFieldType;
  metadata: Partial<Metadata>;
  instructions?: string;
  component?: {
    uuid: string;
    fields: Omit<Field, "component">[];
  };
};

export type ComponentData = Required<Field["component"]> & {
  isRepeatable: boolean;
  cfFieldId: string;
  cfFieldName: string;
};

export type Group = {
  uuid: string;
  name: string;
  fields: Field[];
};

export type Structure = {
  uuid: string;
  groups: Group[];
};

export type GCTemplate = {
  id: string;
  name: string;
  number_of_items_using: number;
  structure_uuid: string;
  project_id: string;
  updated_at: number;
  updated_by: number;
  structure: Structure;
};

export type ExtendedGCTemplate = GCTemplate & {
  mappedCFModel?: string;
  mappingConfig?: string;
  account_id: string;
  account_slug: string;
  project_name: string;
};

export interface GCAccount {
  id: string;
  name: string;
  slug: string;
  timezone: string;
}

export interface GCProject {
  account_id: string;
  account_slug: string;
  id: string;
  active: boolean;
  name: string;
  type: string;
}

export interface FieldMapping {
  gcId: string;
  cfId: string;
  type: CFFieldType;
}

export interface MappingData {
  templateId: string;
  projectId: string;
  name: string;
  fields: FieldMapping[];
  statuses: StatusMapping[];
  description?: string;
  connectedCFModelId?: string;
  useGCEntryTitle: boolean;
}

export type MappingConfig = Pick<
  MappingData,
  "templateId" | "projectId" | "fields" | "statuses" | "useGCEntryTitle"
> & { lastImportedAt?: number }

export enum CFStatusType {
  Draft = "draft",
  Published = "published",
  Archived = "archived",
  Changed = "changed",
}

export type DefaultStatusType =
  | CFStatusType.Draft
  | CFStatusType.Published
  | "ignore";

export type GCStatus = {
  id: string;
  name: string;
  display_name: string;
  color: string;
  workflow_name: string;
  workflow_uuid: string;
  workflow_is_default: boolean;
  cfStatus: CFStatusType;
  changeStatusInGC: string | null;
};

export type StatusMapping = Pick<
  GCStatus,
  "id" | "cfStatus" | "changeStatusInGC"
>;

export interface GCEntry {
  id: string;
  name: string;
  project_id: string;
  template_id: string;
  status_id: string;
  status_name: string;
  status_color: string;
  status_order: number;
  structure: Structure;
  updated_at: string;
  cfEntryProps?: EntryProps;
  cfEntryTitle?: string;
  lastImportedAt: string;
}

export enum EntryFilters {
  Status = "status",
  CFName = "cfName",
  GCName = "gcName",
}

export type GCChoiceField = Array<{ id: string; label: string }>;
export type GCAssetField = Array<{
  alt_text: string | null;
  filename: string;
  file_id: string;
  mime_type: string;
  download_url: string;
  optimised_image_url: string;
  size: string;
  url: string;
}>;
export interface GCComponentField {
  [key: string]: GCChoiceField | GCAssetField | string;
}

export type GCFieldValue =
  | GCComponentField
  | GCComponentField[]
  | GCChoiceField
  | GCAssetField
  | string;

export interface GCFields {
  [key: string]: GCFieldValue;
}

export type GCComponentContent = {
  [key: string]: GCContent | GCContent[];
};

export type GCContent = {
  [key: string]: GCChoiceField | string[] | string;
};

export interface CFPrepareAsset {
  fieldId: string;
  assetId: string;
  rawAsset: CreateAssetProps;
}

export type AssetToExport = Pick<CFPrepareAsset, "assetId" | "fieldId">;

export interface CFPrepareComponent {
  gcFieldId: string;
  cfFieldId: string;
  componentId?: string;
  fieldMapping?: FieldMapping[];
  content: GCComponentField | GCComponentField[];
}

export interface RepeatableTextData {
  uuid: string;
  content: string | Document;
}

export interface JSONFieldValue {
  isPlain: boolean;
  limit?: number;
  data: RepeatableTextData[];
}

export interface GCFieldDictionary {
  [key: string]: Field;
}
