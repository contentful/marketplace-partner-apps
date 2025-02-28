import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import axios from 'axios';
import { CMAClient } from '@contentful/app-sdk';
import { IsSpaceLicensed, IsWithinLicenseLimits } from '../../src/api/licensing';

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
});