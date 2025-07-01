// Components
export { ContentTypeSelector, ContentTypeSelectorWithFields } from './components/ContentTypeSelector';
export type {
  ContentTypeSelectorProps,
  ContentTypeSelectorWithFieldsProps,
  ContentTypeFilter,
  FieldFilter,
  ContentTypeItem,
  FieldItem,
} from './components/ContentTypeSelector/types';

// Hooks
export { useContentTypes } from './hooks/useContentTypes';
export { useContentTypeSelection } from './hooks/useContentTypeSelection';
export type {
  UseContentTypesOptions,
  UseContentTypesReturn,
  UseContentTypeSelectionOptions,
  UseContentTypeSelectionReturn,
} from './components/ContentTypeSelector/types';

// Utilities
export {
  filterContentTypes,
  filterFields,
  getFieldsByType,
  getFieldTypes,
  hasRequiredFields,
  hasLocalizedFields,
  getContentTypesWithFieldType,
  convertFieldTypeFilters,
} from './utils/contentTypeFilters';

export { processContentTypesInBatches, withRetry, withProgress, fetchContentTypes, fetchEditorInterfaces, updateEditorInterfaces } from './utils/apiHelpers';

export type { BatchOptions, RetryOptions, ProgressOptions } from './components/ContentTypeSelector/types';

// Constants
export { FIELD_TYPES, FIELD_TYPE_LABELS } from './constants/fieldTypes';
export type { FieldType } from './constants/fieldTypes';

export { FILTER_OPERATORS, CONTENT_TYPE_FILTERS, FIELD_FILTERS } from './constants/filterTypes';
export type { FilterOperator } from './constants/filterTypes';

// Pre-built filters for convenience
export const filters = {
  // Content type filters
  hasJsonFields: { type: 'fieldType' as const, value: 'Object' },
  hasRichTextFields: { type: 'fieldType' as const, value: 'RichText' },
  hasAssetFields: { type: 'fieldType' as const, value: 'Asset' },
  hasAssetsFields: { type: 'fieldType' as const, value: 'Assets' },
  hasReferenceFields: { type: 'fieldType' as const, value: 'Link' },
  hasReferencesFields: { type: 'fieldType' as const, value: 'Links' },
  hasTextFields: { type: 'fieldType' as const, value: 'Text' },
  hasSymbolFields: { type: 'fieldType' as const, value: 'Symbol' },
  hasNumberFields: { type: 'fieldType' as const, value: 'Number' },
  hasIntegerFields: { type: 'fieldType' as const, value: 'Integer' },
  hasBooleanFields: { type: 'fieldType' as const, value: 'Boolean' },
  hasDateFields: { type: 'fieldType' as const, value: 'Date' },
  hasLocationFields: { type: 'fieldType' as const, value: 'Location' },
  hasArrayFields: { type: 'fieldType' as const, value: 'Array' },

  // Field filters
  requiredFields: { type: 'required' as const, value: true },
  optionalFields: { type: 'required' as const, value: false },
  localizedFields: { type: 'localized' as const, value: true },
  nonLocalizedFields: { type: 'localized' as const, value: false },
  jsonFields: { type: 'fieldType' as const, value: 'Object' },
  richTextFields: { type: 'fieldType' as const, value: 'RichText' },
  assetFields: { type: 'fieldType' as const, value: 'Asset' },
  assetsFields: { type: 'fieldType' as const, value: 'Assets' },
  referenceFields: { type: 'fieldType' as const, value: 'Link' },
  referencesFields: { type: 'fieldType' as const, value: 'Links' },
  textFields: { type: 'fieldType' as const, value: 'Text' },
  symbolFields: { type: 'fieldType' as const, value: 'Symbol' },
  numberFields: { type: 'fieldType' as const, value: 'Number' },
  integerFields: { type: 'fieldType' as const, value: 'Integer' },
  booleanFields: { type: 'fieldType' as const, value: 'Boolean' },
  dateFields: { type: 'fieldType' as const, value: 'Date' },
  locationFields: { type: 'fieldType' as const, value: 'Location' },
  arrayFields: { type: 'fieldType' as const, value: 'Array' },
};
