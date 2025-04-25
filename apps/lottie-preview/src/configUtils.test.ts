import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJsonFields, groupFieldsByContentType, buildEditorInterfaceControls, JsonField } from './configUtils';

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

      expect(result).toEqual([
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

      expect(result[0].contentTypeName).toBe('A Type');
      expect(result[1].contentTypeName).toBe('B Type');
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
});
