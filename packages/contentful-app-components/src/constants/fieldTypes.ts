export const FIELD_TYPES = {
  // Basic field types
  TEXT: 'Text',
  SYMBOL: 'Symbol',
  INTEGER: 'Integer',
  NUMBER: 'Number',
  BOOLEAN: 'Boolean',
  DATE: 'Date',
  LOCATION: 'Location',

  // Rich content field types
  RICH_TEXT: 'RichText',
  OBJECT: 'Object',

  // Media field types
  ASSET: 'Asset',
  ASSETS: 'Assets',

  // Reference field types
  LINK: 'Link',
  LINKS: 'Links',

  // Array field types
  ARRAY: 'Array',

  // Special field types
  JSON: 'Json',
} as const;

export type FieldType = (typeof FIELD_TYPES)[keyof typeof FIELD_TYPES];

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FIELD_TYPES.TEXT]: 'Short text',
  [FIELD_TYPES.SYMBOL]: 'Short text',
  [FIELD_TYPES.INTEGER]: 'Integer',
  [FIELD_TYPES.NUMBER]: 'Number',
  [FIELD_TYPES.BOOLEAN]: 'Boolean',
  [FIELD_TYPES.DATE]: 'Date and time',
  [FIELD_TYPES.LOCATION]: 'Location',
  [FIELD_TYPES.RICH_TEXT]: 'Rich text',
  [FIELD_TYPES.OBJECT]: 'JSON Object',
  [FIELD_TYPES.ASSET]: 'Media',
  [FIELD_TYPES.ASSETS]: 'Media (multiple)',
  [FIELD_TYPES.LINK]: 'Reference',
  [FIELD_TYPES.LINKS]: 'References (multiple)',
  [FIELD_TYPES.ARRAY]: 'List',
  [FIELD_TYPES.JSON]: 'JSON',
};
