import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchContentTypes, withRetry } from '../apiHelpers';
import { mockSdk } from '../../../test/mocks/mockSdk';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('apiUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchContentTypes', () => {
    it('should fetch content types successfully', async () => {
      mockSdk.cma.contentType.getMany.mockResolvedValue({
        items: mockContentTypes,
        total: mockContentTypes.length,
        limit: 1000,
        skip: 0,
      });

      const result = await fetchContentTypes(mockSdk.cma, { limit: 1000 });

      expect(result.items).toEqual(mockContentTypes);
      expect(result.total).toBe(mockContentTypes.length);
      expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledWith({
        query: {
          limit: 1000,
          skip: 0,
          order: 'name',
        },
      });
    });

    it('should handle pagination correctly', async () => {
      const firstBatch = mockContentTypes.slice(0, 2);
      const secondBatch = mockContentTypes.slice(2);

      mockSdk.cma.contentType.getMany
        .mockResolvedValueOnce({
          items: firstBatch,
          total: mockContentTypes.length,
          limit: 2,
          skip: 0,
        })
        .mockResolvedValueOnce({
          items: secondBatch,
          total: mockContentTypes.length,
          limit: 2,
          skip: 2,
        });

      const result = await fetchContentTypes(mockSdk.cma, { limit: 2, skip: 0 });

      expect(result.items).toEqual(firstBatch);
      expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(1);
    });

    it('should fetch all content types when fetchAll is true', async () => {
      const firstBatch = mockContentTypes.slice(0, 2);
      const secondBatch = mockContentTypes.slice(2);

      mockSdk.cma.contentType.getMany
        .mockResolvedValueOnce({
          items: firstBatch,
          total: mockContentTypes.length,
          limit: 2,
          skip: 0,
        })
        .mockResolvedValueOnce({
          items: secondBatch,
          total: mockContentTypes.length,
          limit: 2,
          skip: 2,
        });

      const result = await fetchContentTypes(mockSdk.cma, { limit: 2, fetchAll: true });

      // The API orders by name, so Article comes first, then Blog Post, then Product
      expect(result.items).toHaveLength(3);
      expect(result.items[0].name).toBe('Article');
      expect(result.items[1].name).toBe('Blog Post');
      expect(result.items[2].name).toBe('Product');
      expect(result.total).toBe(mockContentTypes.length);
      expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      // Reset the mock to ensure clean state
      mockSdk.cma.contentType.getMany.mockReset();
      mockSdk.cma.contentType.getMany.mockRejectedValue(error);

      await expect(fetchContentTypes(mockSdk.cma, { limit: 1000 })).rejects.toThrow('API Error');
    });

    it('should handle empty response', async () => {
      mockSdk.cma.contentType.getMany.mockResolvedValue({
        items: [],
        total: 0,
        limit: 1000,
        skip: 0,
      });

      const result = await fetchContentTypes(mockSdk.cma, { limit: 1000 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('withRetry', () => {
    it('should succeed on first try', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');

      const result = await withRetry(() => mockFn(), { maxRetries: 3 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');

      const result = await withRetry(() => mockFn(), { maxRetries: 3 });

      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should throw after max retries', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('rate limit exceeded'));

      await expect(withRetry(() => mockFn(), { maxRetries: 2 })).rejects.toThrow('rate limit exceeded');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      const mockFn = vi
        .fn()
        .mockRejectedValueOnce(new Error('rate limit exceeded'))
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockResolvedValue('success');

      const startTime = Date.now();
      await withRetry(() => mockFn(), { maxRetries: 3 });
      const endTime = Date.now();

      // Should have delays between retries (roughly 100ms + 200ms = 300ms minimum)
      expect(endTime - startTime).toBeGreaterThan(250);
    });
  });
});
