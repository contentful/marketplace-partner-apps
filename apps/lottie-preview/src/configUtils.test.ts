import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getJsonFields,
  getContentTypesWithJsonFieldsCount,
  getAllContentTypesWithJsonFields,
  updateFieldEnabledStates,
  groupFieldsByContentType,
  buildEditorInterfaceControls,
  JsonField,
} from './configUtils';

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

  describe('buildEditorInterfaceControls', () => {
    it('merges updated and existing controls correctly', () => {
      const allFields: JsonField[] = [
        { contentTypeId: 'blogPost', contentTypeName: 'Blog Post', fieldId: 'jsonA', fieldName: 'A', isEnabled: true, originalEnabled: false },
        { contentTypeId: 'blogPost', contentTypeName: 'Blog Post', fieldId: 'jsonB', fieldName: 'B', isEnabled: false, originalEnabled: true },
      ];

      const existingControls = [
        { fieldId: 'jsonA', widgetId: 'objectEditor', widgetNamespace: 'builtin' },
        { fieldId: 'jsonB', widgetId: appId, widgetNamespace: 'app' },
        { fieldId: 'otherField', widgetId: 'something', widgetNamespace: 'builtin' },
      ];

      const result = buildEditorInterfaceControls(allFields, existingControls, appId);

      expect(result).toEqual([
        { fieldId: 'otherField', widgetId: 'something', widgetNamespace: 'builtin' },
        { fieldId: 'jsonA', widgetId: appId, widgetNamespace: 'app' },
        { fieldId: 'jsonB', widgetId: 'objectEditor', widgetNamespace: 'builtin' },
      ]);
    });

    it('filters out controls without widgetId or widgetNamespace', () => {
      const result = buildEditorInterfaceControls(
        [{ contentTypeId: 'x', contentTypeName: '', fieldId: 'f1', fieldName: '', isEnabled: true, originalEnabled: false }],
        [{ fieldId: 'f2' }],
        appId
      );

      expect(result).toEqual([{ fieldId: 'f1', widgetId: appId, widgetNamespace: 'app' }]);
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

  describe('getAllContentTypesWithJsonFields', () => {
    it('returns all JSON fields without editor interface data', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            sys: { id: 'blogPost' },
            name: 'Blog Post',
            fields: [
              { id: 'jsonA', name: 'A', type: 'Object' },
              { id: 'text', name: 'Text', type: 'Text' },
            ],
          },
        ],
      });

      const result = await getAllContentTypesWithJsonFields(mockCma as any);

      expect(result).toEqual([
        {
          contentTypeId: 'blogPost',
          contentTypeName: 'Blog Post',
          fieldId: 'jsonA',
          fieldName: 'A',
          isEnabled: false,
          originalEnabled: false,
        },
      ]);
    });

    it('sorts results alphabetically', async () => {
      mockCma.contentType.getMany.mockResolvedValue({
        items: [
          {
            sys: { id: 'z' },
            name: 'Z Type',
            fields: [{ id: 'z', name: 'Z', type: 'Object' }],
          },
          {
            sys: { id: 'a' },
            name: 'A Type',
            fields: [{ id: 'a', name: 'A', type: 'Object' }],
          },
        ],
      });

      const result = await getAllContentTypesWithJsonFields(mockCma as any);

      expect(result[0].contentTypeName).toBe('A Type');
      expect(result[1].contentTypeName).toBe('Z Type');
    });
  });

  describe('updateFieldEnabledStates', () => {
    it('updates enabled states based on editor interfaces', async () => {
      const fields: JsonField[] = [
        { contentTypeId: 'ct1', contentTypeName: 'CT1', fieldId: 'f1', fieldName: 'F1', isEnabled: false, originalEnabled: false },
        { contentTypeId: 'ct1', contentTypeName: 'CT1', fieldId: 'f2', fieldName: 'F2', isEnabled: false, originalEnabled: false },
      ];

      mockCma.editorInterface.get.mockResolvedValue({
        controls: [
          { fieldId: 'f1', widgetId: appId, widgetNamespace: 'app' },
          { fieldId: 'f2', widgetId: 'objectEditor', widgetNamespace: 'builtin' },
        ],
      });

      const result = await updateFieldEnabledStates(mockCma as any, appId, fields);

      expect(result[0].isEnabled).toBe(true);
      expect(result[0].originalEnabled).toBe(true);
      expect(result[1].isEnabled).toBe(false);
      expect(result[1].originalEnabled).toBe(false);
    });

    it('handles editor interface fetch errors gracefully', async () => {
      const fields: JsonField[] = [{ contentTypeId: 'ct1', contentTypeName: 'CT1', fieldId: 'f1', fieldName: 'F1', isEnabled: false, originalEnabled: false }];

      mockCma.editorInterface.get.mockRejectedValue(new Error('API Error'));

      const result = await updateFieldEnabledStates(mockCma as any, appId, fields);

      expect(result[0].isEnabled).toBe(false);
      expect(result[0].originalEnabled).toBe(false);
    });
  });
});
