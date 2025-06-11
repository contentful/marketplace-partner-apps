import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJsonFields, getContentTypesWithJsonFieldsCount, groupFieldsByContentType, JsonField } from './configUtils';

const mockCma = {
  contentType: {
    getMany: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
  },
};

const appId = 'my-app-id';

describe('configUtils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('getJsonFields', () => {
    it('returns sorted fields with isEnabled and originalEnabled set correctly', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            sys: { id: 'blogPost' },
            name: 'Blog Post',
            fields: [
              { id: 'jsonA', name: 'A', type: 'Object' },
              { id: 'jsonB', name: 'B', type: 'Object' },
              { id: 'nonJson', name: 'Non', type: 'Text' },
            ],
          },
        ],
      });

      mockCma.editorInterface.get.mockResolvedValue({
        controls: [
          { fieldId: 'jsonA', widgetId: appId, widgetNamespace: 'app' },
          { fieldId: 'jsonB', widgetId: 'objectEditor', widgetNamespace: 'builtin' },
        ],
      });

      const result = await getJsonFields(mockCma as any, appId);

      expect(result.fields).toEqual([
        {
          contentTypeId: 'blogPost',
          contentTypeName: 'Blog Post',
          fieldId: 'jsonA',
          fieldName: 'A',
          isEnabled: true,
          originalEnabled: true,
        },
        {
          contentTypeId: 'blogPost',
          contentTypeName: 'Blog Post',
          fieldId: 'jsonB',
          fieldName: 'B',
          isEnabled: false,
          originalEnabled: false,
        },
      ]);
      expect(result.totalContentTypes).toBe(1);
      expect(result.hasMore).toBe(false);
    });

    it('sorts fields by content type name then field name', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            sys: { id: 'b' },
            name: 'B Type',
            fields: [{ id: 'z', name: 'Z', type: 'Object' }],
          },
          {
            sys: { id: 'a' },
            name: 'A Type',
            fields: [{ id: 'a', name: 'A', type: 'Object' }],
          },
        ],
      });

      mockCma.editorInterface.get.mockResolvedValue({ controls: [] });

      const result = await getJsonFields(mockCma as any, appId);

      expect(result.fields[0].contentTypeName).toBe('A Type');
      expect(result.fields[1].contentTypeName).toBe('B Type');
    });
  });

  describe('groupFieldsByContentType', () => {
    it('groups fields by content type ID', () => {
      const fields: JsonField[] = [
        { contentTypeId: 'a', contentTypeName: '', fieldId: 'f1', fieldName: '', isEnabled: true, originalEnabled: true },
        { contentTypeId: 'b', contentTypeName: '', fieldId: 'f2', fieldName: '', isEnabled: true, originalEnabled: true },
        { contentTypeId: 'a', contentTypeName: '', fieldId: 'f3', fieldName: '', isEnabled: true, originalEnabled: true },
      ];

      const result = groupFieldsByContentType(fields);

      expect(result).toEqual({
        a: [fields[0], fields[2]],
        b: [fields[1]],
      });
    });
  });

  describe('getContentTypesWithJsonFieldsCount', () => {
    it('returns count of content types with JSON fields', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            fields: [{ type: 'Object' }, { type: 'Text' }],
          },
          {
            fields: [{ type: 'Text' }, { type: 'Symbol' }],
          },
          {
            fields: [{ type: 'Object' }],
          },
        ],
      });

      const result = await getContentTypesWithJsonFieldsCount(mockCma as any);

      expect(result).toBe(2); // Only 2 content types have JSON fields
    });

    it('returns 0 when no content types have JSON fields', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            fields: [{ type: 'Text' }],
          },
        ],
      });

      const result = await getContentTypesWithJsonFieldsCount(mockCma as any);

      expect(result).toBe(0);
    });

    it('handles API errors gracefully', async () => {
      mockCma.contentType.getMany.mockRejectedValue(new Error('API Error'));

      const result = await getContentTypesWithJsonFieldsCount(mockCma as any);

      expect(result).toBe(0);
    });
  });
});
