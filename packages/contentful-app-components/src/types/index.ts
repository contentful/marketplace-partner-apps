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
