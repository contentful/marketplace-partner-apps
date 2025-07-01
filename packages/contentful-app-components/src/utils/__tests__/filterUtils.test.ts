import { describe, it, expect } from 'vitest';
import { filterContentTypes, filterFieldsByType } from '../filterUtils';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('filterUtils', () => {
  describe('filterContentTypes', () => {
    it('should filter content types by search term', () => {
      const result = filterContentTypes(mockContentTypes, 'blog');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blog Post');
    });

    it('should be case insensitive', () => {
      const result = filterContentTypes(mockContentTypes, 'BLOG');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Blog Post');
    });

    it('should return all content types when search term is empty', () => {
      const result = filterContentTypes(mockContentTypes, '');
      expect(result).toHaveLength(3);
    });

    it('should return empty array when no matches found', () => {
      const result = filterContentTypes(mockContentTypes, 'nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should search in both name and description', () => {
      const result = filterContentTypes(mockContentTypes, 'content type');
      expect(result).toHaveLength(3); // All have "content type" in description
    });
  });

  describe('filterFieldsByType', () => {
    it('should filter fields by type', () => {
      const contentType = mockContentTypes[0]; // Blog Post
      const result = filterFieldsByType(contentType, 'Object');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('jsonField');
    });

    it('should return empty array when no fields match type', () => {
      const contentType = mockContentTypes[0]; // Blog Post
      const result = filterFieldsByType(contentType, 'Number');
      expect(result).toHaveLength(0);
    });

    it('should handle content type with no fields', () => {
      const contentTypeWithNoFields = {
        ...mockContentTypes[0],
        fields: [],
      };
      const result = filterFieldsByType(contentTypeWithNoFields, 'Object');
      expect(result).toHaveLength(0);
    });
  });
});
