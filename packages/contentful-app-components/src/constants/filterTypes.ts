import { FIELD_TYPES } from './fieldTypes';

export const FILTER_OPERATORS = {
  EQUALS: 'equals',
  CONTAINS: 'contains',
  STARTS_WITH: 'startsWith',
  ENDS_WITH: 'endsWith',
  REGEX: 'regex',
} as const;

export type FilterOperator = (typeof FILTER_OPERATORS)[keyof typeof FILTER_OPERATORS];

// Pre-built content type filters
export const CONTENT_TYPE_FILTERS = {
  hasJsonFields: { type: 'fieldType' as const, value: FIELD_TYPES.OBJECT },
  hasRichTextFields: { type: 'fieldType' as const, value: FIELD_TYPES.RICH_TEXT },
  hasAssetFields: { type: 'fieldType' as const, value: FIELD_TYPES.ASSET },
  hasAssetsFields: { type: 'fieldType' as const, value: FIELD_TYPES.ASSETS },
  hasReferenceFields: { type: 'fieldType' as const, value: FIELD_TYPES.LINK },
  hasReferencesFields: { type: 'fieldType' as const, value: FIELD_TYPES.LINKS },
  hasTextFields: { type: 'fieldType' as const, value: FIELD_TYPES.TEXT },
  hasSymbolFields: { type: 'fieldType' as const, value: FIELD_TYPES.SYMBOL },
  hasNumberFields: { type: 'fieldType' as const, value: FIELD_TYPES.NUMBER },
  hasIntegerFields: { type: 'fieldType' as const, value: FIELD_TYPES.INTEGER },
  hasBooleanFields: { type: 'fieldType' as const, value: FIELD_TYPES.BOOLEAN },
  hasDateFields: { type: 'fieldType' as const, value: FIELD_TYPES.DATE },
  hasLocationFields: { type: 'fieldType' as const, value: FIELD_TYPES.LOCATION },
  hasArrayFields: { type: 'fieldType' as const, value: FIELD_TYPES.ARRAY },
} as const;

// Pre-built field filters
export const FIELD_FILTERS = {
  requiredFields: { type: 'required' as const, value: true },
  optionalFields: { type: 'required' as const, value: false },
  localizedFields: { type: 'localized' as const, value: true },
  nonLocalizedFields: { type: 'localized' as const, value: false },
  jsonFields: { type: 'fieldType' as const, value: FIELD_TYPES.OBJECT },
  richTextFields: { type: 'fieldType' as const, value: FIELD_TYPES.RICH_TEXT },
  assetFields: { type: 'fieldType' as const, value: FIELD_TYPES.ASSET },
  assetsFields: { type: 'fieldType' as const, value: FIELD_TYPES.ASSETS },
  referenceFields: { type: 'fieldType' as const, value: FIELD_TYPES.LINK },
  referencesFields: { type: 'fieldType' as const, value: FIELD_TYPES.LINKS },
  textFields: { type: 'fieldType' as const, value: FIELD_TYPES.TEXT },
  symbolFields: { type: 'fieldType' as const, value: FIELD_TYPES.SYMBOL },
  numberFields: { type: 'fieldType' as const, value: FIELD_TYPES.NUMBER },
  integerFields: { type: 'fieldType' as const, value: FIELD_TYPES.INTEGER },
  booleanFields: { type: 'fieldType' as const, value: FIELD_TYPES.BOOLEAN },
  dateFields: { type: 'fieldType' as const, value: FIELD_TYPES.DATE },
  locationFields: { type: 'fieldType' as const, value: FIELD_TYPES.LOCATION },
  arrayFields: { type: 'fieldType' as const, value: FIELD_TYPES.ARRAY },
} as const;
