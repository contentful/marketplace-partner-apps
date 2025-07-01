import { describe, it, expect } from 'vitest';
import { filterContentTypes, filterFields, getFieldsByType } from '../contentTypeFilters';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('filterUtils', () => {
  describe('filterContentTypes', () => {
    it('should filter content types by name', () => {
      const result = filterContentTypes(mockContentTypes, [{ type: 'name', value: 'blog', operator: 'contains' }]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blog Post');
    });

    it('should be case insensitive', () => {
      const result = filterContentTypes(mockContentTypes, [{ type: 'name', value: 'BLOG', operator: 'contains' }]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blog Post');
    });

    it('should return all content types when no filters', () => {
      const result = filterContentTypes(mockContentTypes, []);
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const result = filterContentTypes(mockContentTypes, [{ type: 'name', value: 'nonexistent' }]);
      expect(result).toHaveLength(0);
    });

    it('should filter by field type', () => {
      const result = filterContentTypes(mockContentTypes, [{ type: 'fieldType', value: 'Object' }]);
      expect(result).toHaveLength(3); // All have Object fields
    });
  });

  describe('filterFields', () => {
    it('should filter fields by type', () => {
      const contentType = mockContentTypes[0]; // Blog Post
      const result = filterFields(contentType.fields, [{ type: 'fieldType', value: 'Object' }]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('jsonField');
    });

    it('should return empty array when no fields match type', () => {
      const contentType = mockContentTypes[0]; // Blog Post
      const result = filterFields(contentType.fields, [{ type: 'fieldType', value: 'Number' }]);
      expect(result).toHaveLength(0);
    });

    it('should handle content type with no fields', () => {
      const contentTypeWithNoFields = {
        ...mockContentTypes[0],
        fields: [],
      };
      const result = filterFields(contentTypeWithNoFields.fields, [{ type: 'fieldType', value: 'Object' }]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getFieldsByType', () => {
    it('should get fields by type', () => {
      const contentType = mockContentTypes[0]; // Blog Post
      const result = getFieldsByType(contentType, 'Object');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('jsonField');
    });
  });
});
