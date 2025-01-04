import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import axios from 'axios';
import { CMAClient } from '@contentful/app-sdk';
import { IsSpaceLicensed, IsWithinLicenseLimits, getEditorUsages, getFieldWidgetUsageCount } from '../../src/api/licensing';

// Mock axios
vi.mock('axios');

describe('Licensing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('IsSpaceLicensed', () => {
    it('should return true when space is licensed', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: true });
      
      const result = await IsSpaceLicensed('test-space-id');
      
      expect(result).toBe(true);
      expect(axios.get).toHaveBeenCalledWith(
        'https://api.ellavationlabs.com/api/rtf/license',
        { params: { spaceId: 'test-space-id' } }
      );
    });

    it('should return false when API call fails', async () => {
      vi.mocked(axios.get).mockRejectedValueOnce(new Error('API Error'));
      
      const result = await IsSpaceLicensed('test-space-id');
      
      expect(result).toBe(false);
    });
  });

  describe('IsWithinLicenseLimits', () => {
    const mockCma = {
      appDefinition: {
        get: vi.fn().mockResolvedValue({ sys: { id: 'widget-id' } }),
      },
      editorInterface: {
        get: vi.fn(),
        getMany: vi.fn().mockResolvedValue({ items: [] }),
      },
    } as unknown as CMAClient;

    it('should return true when space is licensed', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: true });
      
      const result = await IsWithinLicenseLimits(mockCma, 'app-id', 'space-id');
      
      expect(result).toBe(true);
    });

    it('should return true when usage count is <= 5', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: false });
      (mockCma.appDefinition.get as Mock).mockResolvedValueOnce({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValueOnce({ items: [] });
      
      const result = await IsWithinLicenseLimits(mockCma, 'app-id', 'space-id');
      
      expect(result).toBe(true);
    });

    it('should return false when not licensed and usage count > 5', async () => {
      vi.mocked(axios.get).mockResolvedValueOnce({ data: false });
      (mockCma.appDefinition.get as Mock).mockResolvedValueOnce({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValueOnce({
        items: Array(6).fill({
          controls: [{ widgetId: 'widget-id' }],
          sys: { contentType: { sys: { id: 'content-type' } } }
        })
      });
      
      const result = await IsWithinLicenseLimits(mockCma, 'app-id', 'space-id');
      
      expect(result).toBe(false);
    });
  });

  describe('getEditorUsages', () => {
    const mockCma = {
      appDefinition: {
        get: vi.fn().mockResolvedValue({ sys: { id: 'widget-id' } }),
      },
      editorInterface: {
        getMany: vi.fn().mockResolvedValue({ items: [] }),
      },
    } as unknown as CMAClient;

    it('should return correct usages array', async () => {
      (mockCma.appDefinition.get as Mock).mockResolvedValue({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValue({
        items: [
          {
            controls: [
              { widgetId: 'widget-id', fieldId: 'field1' },
              { widgetId: 'widget-id', fieldId: 'field2' },
            ],
            sys: { contentType: { sys: { id: 'content-type-1' } } }
          }
        ]
      });

      const result = await getEditorUsages(mockCma, 'app-id');

      expect(result).toEqual([
        { contentModel: 'content-type-1', field: 'field1' },
        { contentModel: 'content-type-1', field: 'field2' },
      ]);
    });

    it('should return empty array when no usages found', async () => {
      (mockCma.appDefinition.get as Mock).mockResolvedValue({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValue({ items: [] });

      const result = await getEditorUsages(mockCma, 'app-id');

      expect(result).toEqual([]);
    });
  });

  describe('getFieldWidgetUsageCount', () => {
    const mockCma = {
      appDefinition: {
        get: vi.fn().mockResolvedValue({ sys: { id: 'widget-id' } }),
      },
      editorInterface: {
        getMany: vi.fn().mockResolvedValue({ items: [] }),
      },
    } as unknown as CMAClient;

    it('should return correct usage count', async () => {
      (mockCma.appDefinition.get as Mock).mockResolvedValue({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValue({
        items: [
          {
            controls: [
              { widgetId: 'widget-id' },
              { widgetId: 'widget-id' },
            ],
            sys: { contentType: { sys: { id: 'content-type-1' } } }
          },
          {
            controls: [
              { widgetId: 'widget-id' },
            ],
            sys: { contentType: { sys: { id: 'content-type-2' } } }
          }
        ]
      });

      const result = await getFieldWidgetUsageCount(mockCma, 'app-id');

      expect(result).toBe(3);
    });

    it('should return 0 when no usages found', async () => {
      (mockCma.appDefinition.get as Mock).mockResolvedValue({ sys: { id: 'widget-id' } });
      (mockCma.editorInterface.getMany as Mock).mockResolvedValue({ items: [] });

      const result = await getFieldWidgetUsageCount(mockCma, 'app-id');

      expect(result).toBe(0);
    });
  });
});