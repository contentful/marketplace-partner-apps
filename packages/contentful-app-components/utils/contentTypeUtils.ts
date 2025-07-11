import type { ContentTypeProps, ContentFields } from 'contentful-management';
import type { ContentTypeFilter, FieldFilter } from '../types';

// Generic utility for grouping fields by content type
export function groupFieldsByContentType<T extends { contentTypeId: string }>(fields: T[]): Record<string, T[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) {
      acc[field.contentTypeId] = [];
    }
    acc[field.contentTypeId]?.push(field);
    return acc;
  }, {} as Record<string, T[]>);
}

// Content Type Filters
export const hasJsonFields: ContentTypeFilter = {
  id: 'hasJsonFields',
  name: 'Has JSON fields',
  test: (contentType: ContentTypeProps) => contentType.fields.some((field) => field.type === 'Object'),
};

export const hasRichTextFields: ContentTypeFilter = {
  id: 'hasRichTextFields',
  name: 'Has Rich Text fields',
  test: (contentType: ContentTypeProps) => contentType.fields.some((field) => field.type === 'RichText'),
};

export const hasAssetFields: ContentTypeFilter = {
  id: 'hasAssetFields',
  name: 'Has Asset fields',
  test: (contentType: ContentTypeProps) => contentType.fields.some((field) => field.type === 'Asset'),
};

export const hasReferenceFields: ContentTypeFilter = {
  id: 'hasReferenceFields',
  name: 'Has Reference fields',
  test: (contentType: ContentTypeProps) => contentType.fields.some((field) => field.type === 'Link'),
};

export const hasArrayFields: ContentTypeFilter = {
  id: 'hasArrayFields',
  name: 'Has Array fields',
  test: (contentType: ContentTypeProps) => contentType.fields.some((field) => field.type === 'Array'),
};

// Field Filters
export const jsonFields: FieldFilter = {
  id: 'jsonFields',
  name: 'JSON fields',
  test: (field: ContentFields) => field.type === 'Object',
};

export const richTextFields: FieldFilter = {
  id: 'richTextFields',
  name: 'Rich Text fields',
  test: (field: ContentFields) => field.type === 'RichText',
};

export const assetFields: FieldFilter = {
  id: 'assetFields',
  name: 'Asset fields',
  test: (field: ContentFields) => field.type === 'Asset',
};

export const referenceFields: FieldFilter = {
  id: 'referenceFields',
  name: 'Reference fields',
  test: (field: ContentFields) => field.type === 'Link',
};

export const arrayFields: FieldFilter = {
  id: 'arrayFields',
  name: 'Array fields',
  test: (field: ContentFields) => field.type === 'Array',
};

// Generic field type filter creator
export const createFieldTypeFilter = (fieldType: string): FieldFilter => ({
  id: `has${fieldType}Fields`,
  name: `Has ${fieldType} fields`,
  test: (field: ContentFields) => field.type === fieldType,
});

// Apply filters to content types
export const applyContentTypeFilters = (contentTypes: ContentTypeProps[], filters: ContentTypeFilter[]): ContentTypeProps[] => {
  if (filters.length === 0) return contentTypes;

  return contentTypes.filter((contentType) => filters.every((filter) => filter.test(contentType)));
};

// Apply filters to fields
export const applyFieldFilters = (fields: ContentFields[], filters: FieldFilter[]): ContentFields[] => {
  if (filters.length === 0) return fields;

  return fields.filter((field) => filters.every((filter) => filter.test(field)));
};
