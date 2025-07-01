import { ContentTypeProps, ContentFields } from 'contentful-management';
import { ReactNode } from 'react';
import { FilterOperator } from '../../constants/filterTypes';

// Base filter interface
export interface BaseFilter {
  type: string;
  value: any;
  operator?: FilterOperator;
}

// Content type filter interface
export interface ContentTypeFilter extends BaseFilter {
  type: 'fieldType' | 'name' | 'id' | 'description' | 'custom';
  value: string | RegExp | ((contentType: ContentTypeProps) => boolean);
}

// Field filter interface
export interface FieldFilter extends BaseFilter {
  type: 'fieldType' | 'name' | 'id' | 'required' | 'localized' | 'custom';
  value: string | boolean | RegExp | ((field: ContentFields) => boolean);
}

// Base content type selector props
export interface ContentTypeSelectorProps {
  // Data
  contentTypes?: ContentTypeProps[];
  selectedContentTypes: string[];

  // Filtering
  filters?: ContentTypeFilter[];
  fieldTypeFilters?: string[]; // Legacy support - maps to filters

  // Behavior
  multiSelect?: boolean;
  searchable?: boolean;
  loading?: boolean;

  // Callbacks
  onSelectionChange: (selectedIds: string[]) => void;
  onContentTypesLoad?: (contentTypes: ContentTypeProps[]) => void;

  // UI
  placeholder?: string;
  disabled?: boolean;
  error?: string;

  // Customization
  renderItem?: (contentType: ContentTypeProps) => ReactNode;
  renderEmptyState?: () => ReactNode;
  renderLoadingState?: () => ReactNode;
  renderErrorState?: (error: string) => ReactNode;
}

// Field-aware selector props
export interface ContentTypeSelectorWithFieldsProps extends ContentTypeSelectorProps {
  // Field selection
  selectedFields: Record<string, string[]>; // contentTypeId -> fieldIds[]

  // Field filtering
  fieldFilters?: FieldFilter[];

  // Field callbacks
  onFieldSelectionChange: (contentTypeId: string, fieldIds: string[]) => void;

  // Field UI
  renderFieldItem?: (field: ContentFields, contentTypeId: string) => ReactNode;
  renderFieldEmptyState?: () => ReactNode;

  // Field behavior
  fieldMultiSelect?: boolean;
  showFieldSelection?: boolean;
}

// Internal state types
export interface ContentTypeItem {
  id: string;
  name: string;
  description?: string;
  isSelected: boolean;
  contentType: ContentTypeProps;
}

export interface FieldItem {
  id: string;
  name: string;
  type: string;
  isRequired: boolean;
  isLocalized: boolean;
  isSelected: boolean;
  field: ContentFields;
}

// Hook return types
export interface UseContentTypesOptions {
  filters?: ContentTypeFilter[];
  limit?: number;
  skip?: number;
  order?: string;
  onProgress?: (processed: number, total: number) => void;
  fetchAll?: boolean; // Whether to fetch all content types or just the current page
}

export interface UseContentTypesReturn {
  contentTypes: ContentTypeProps[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>; // Load the next page of content types
  isLoadingMore: boolean; // Whether we're currently loading more content types
}

export interface UseContentTypeFieldsOptions {
  contentTypeIds: string[];
  fieldFilters?: FieldFilter[];
  includeEditorInterfaces?: boolean;
}

export interface UseContentTypeFieldsReturn {
  fieldsByContentType: Record<string, ContentFields[]>;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseContentTypeSelectionOptions {
  initialSelection?: string[];
  initialFieldSelection?: Record<string, string[]>;
  multiSelect?: boolean;
  fieldMultiSelect?: boolean;
}

export interface UseContentTypeSelectionReturn {
  selectedContentTypes: string[];
  selectedFields: Record<string, string[]>;
  toggleContentType: (id: string) => void;
  toggleField: (contentTypeId: string, fieldId: string) => void;
  setSelection: (contentTypeIds: string[], fieldIds?: Record<string, string[]>) => void;
  clearSelection: () => void;
  isContentTypeSelected: (id: string) => boolean;
  isFieldSelected: (contentTypeId: string, fieldId: string) => boolean;
}

// API utility types
export interface BatchOptions {
  batchSize?: number;
  delay?: number;
  maxRetries?: number;
  baseDelay?: number;
}

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

export interface ProgressOptions {
  onProgress?: (processed: number, total: number) => void;
  batchSize?: number;
}
