import { ContentTypeProps, ContentFields } from 'contentful-management';
import { ContentTypeFilter, FieldFilter } from '../components/ContentTypeSelector/types';
import { FILTER_OPERATORS } from '../constants/filterTypes';

/**
 * Apply filters to content types
 */
export function filterContentTypes(contentTypes: ContentTypeProps[], filters: ContentTypeFilter[] = []): ContentTypeProps[] {
  if (!filters.length) {
    return contentTypes;
  }

  return contentTypes.filter((contentType) => {
    return filters.every((filter) => {
      return applyContentTypeFilter(contentType, filter);
    });
  });
}

/**
 * Apply a single filter to a content type
 */
function applyContentTypeFilter(contentType: ContentTypeProps, filter: ContentTypeFilter): boolean {
  const { type, value, operator = FILTER_OPERATORS.EQUALS } = filter;

  switch (type) {
    case 'fieldType':
      return hasFieldType(contentType, value as string);

    case 'name':
      return matchString(contentType.name, value as string | RegExp, operator);

    case 'id':
      return matchString(contentType.sys.id, value as string | RegExp, operator);

    case 'description':
      const description = contentType.description || '';
      return matchString(description, value as string | RegExp, operator);

    case 'custom':
      if (typeof value === 'function') {
        return value(contentType);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Check if content type has a field of the specified type
 */
function hasFieldType(contentType: ContentTypeProps, fieldType: string): boolean {
  return contentType.fields.some((field: ContentFields) => field.type === fieldType);
}

/**
 * Match string based on operator
 */
function matchString(target: string, value: string | RegExp, operator: string): boolean {
  if (value instanceof RegExp) {
    return value.test(target);
  }

  const targetLower = target.toLowerCase();
  const valueLower = value.toLowerCase();

  switch (operator) {
    case FILTER_OPERATORS.EQUALS:
      return targetLower === valueLower;

    case FILTER_OPERATORS.CONTAINS:
      return targetLower.includes(valueLower);

    case FILTER_OPERATORS.STARTS_WITH:
      return targetLower.startsWith(valueLower);

    case FILTER_OPERATORS.ENDS_WITH:
      return targetLower.endsWith(valueLower);

    case FILTER_OPERATORS.REGEX:
      try {
        const regex = new RegExp(value, 'i');
        return regex.test(target);
      } catch {
        return false;
      }

    default:
      return false;
  }
}

/**
 * Apply filters to fields
 */
export function filterFields(fields: ContentFields[], filters: FieldFilter[] = []): ContentFields[] {
  if (!filters.length) {
    return fields;
  }

  return fields.filter((field) => {
    return filters.every((filter) => {
      return applyFieldFilter(field, filter);
    });
  });
}

/**
 * Apply a single filter to a field
 */
function applyFieldFilter(field: ContentFields, filter: FieldFilter): boolean {
  const { type, value, operator = FILTER_OPERATORS.EQUALS } = filter;

  switch (type) {
    case 'fieldType':
      return field.type === value;

    case 'name':
      return matchString(field.name, value as string | RegExp, operator);

    case 'id':
      return matchString(field.id, value as string | RegExp, operator);

    case 'required':
      return field.required === value;

    case 'localized':
      return field.localized === value;

    case 'custom':
      if (typeof value === 'function') {
        return value(field);
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get fields of a specific type from a content type
 */
export function getFieldsByType(contentType: ContentTypeProps, fieldType: string): ContentFields[] {
  return contentType.fields.filter((field: ContentFields) => field.type === fieldType);
}

/**
 * Get all field types present in a content type
 */
export function getFieldTypes(contentType: ContentTypeProps): string[] {
  return [...new Set(contentType.fields.map((field: ContentFields) => field.type))] as string[];
}

/**
 * Check if content type has any required fields
 */
export function hasRequiredFields(contentType: ContentTypeProps): boolean {
  return contentType.fields.some((field: ContentFields) => field.required);
}

/**
 * Check if content type has any localized fields
 */
export function hasLocalizedFields(contentType: ContentTypeProps): boolean {
  return contentType.fields.some((field: ContentFields) => field.localized);
}

/**
 * Get content types that have fields of a specific type
 */
export function getContentTypesWithFieldType(contentTypes: ContentTypeProps[], fieldType: string): ContentTypeProps[] {
  return contentTypes.filter((contentType) => hasFieldType(contentType, fieldType));
}

/**
 * Convert legacy fieldTypeFilters to ContentTypeFilter array
 */
export function convertFieldTypeFilters(fieldTypeFilters: string[]): ContentTypeFilter[] {
  return fieldTypeFilters.map((fieldType) => ({
    type: 'fieldType',
    value: fieldType,
  }));
}
