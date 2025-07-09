import type { ContentTypeProps, ContentFields } from 'contentful-management';

export interface ContentTypeFilter {
  id: string;
  name: string;
  test: (contentType: ContentTypeProps) => boolean;
}

export interface FieldFilter {
  id: string;
  name: string;
  test: (field: ContentFields) => boolean;
}

export interface ContentTypeOption {
  id: string;
  name: string;
  description?: string;
}

export interface ContentTypeFieldOption {
  id: string; // format: "contentTypeId:fieldId"
  name: string; // format: "ContentTypeName > FieldName"
  contentTypeId: string;
  fieldId: string;
  contentTypeName: string;
  fieldName: string;
  isAlreadyConfigured?: boolean;
}

export interface ContentTypeField {
  id: string; // format: "contentTypeId:fieldId"
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  isConfigured: boolean;
}

export interface ContentTypeWithFields {
  id: string;
  name: string;
  fields: ContentTypeField[];
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ContentTypesResult {
  contentTypes: ContentTypeProps[];
  total: number;
  hasMore: boolean;
}

export interface UseContentTypesOptions {
  filters?: ContentTypeFilter[];
  pagination?: PaginationOptions;
  onProgress?: (processed: number, total: number) => void;
}

export interface UseContentTypesReturn {
  contentTypes: ContentTypeProps[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  search: (query: string) => void;
  reset: () => void;
}

export interface ContentTypeWithEditorInterface {
  contentType: ContentTypeProps;
  editorInterface: any; // EditorInterface type from contentful-management
  fields: ContentFields[];
}

export interface UseContentTypeFieldsOptions {
  contentTypeFilters?: ContentTypeFilter[];
  fieldFilters?: FieldFilter[];
  appDefinitionId?: string;
  onProgress?: (processed: number, total: number) => void;
}

export interface UseContentTypeFieldsReturn {
  contentTypesWithFields: ContentTypeWithEditorInterface[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  search: (query: string) => void;
  reset: () => void;
  progress: { processed: number; total: number } | null;
}
