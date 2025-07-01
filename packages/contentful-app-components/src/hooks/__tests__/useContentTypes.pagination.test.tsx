import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContentTypes } from '../useContentTypes';
import { mockSdk } from '../../../test/mocks/mockSdk';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('useContentTypes - Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should automatically fetch all content types in batches', async () => {
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

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 2, fetchAll: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual([...firstBatch, ...secondBatch]);
    expect(result.current.total).toBe(mockContentTypes.length);
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
  });

  it('should handle large content models with multiple batches', async () => {
    // Simulate a large content model with 2500 content types
    const largeContentTypes = Array.from({ length: 2500 }, (_, i) => ({
      ...mockContentTypes[0],
      sys: { ...mockContentTypes[0].sys, id: `contentType${i}` },
      name: `Content Type ${i}`,
    }));

    // Mock 3 API calls (1000 + 1000 + 500)
    mockSdk.cma.contentType.getMany
      .mockResolvedValueOnce({
        items: largeContentTypes.slice(0, 1000),
        total: largeContentTypes.length,
        limit: 1000,
        skip: 0,
      })
      .mockResolvedValueOnce({
        items: largeContentTypes.slice(1000, 2000),
        total: largeContentTypes.length,
        limit: 1000,
        skip: 1000,
      })
      .mockResolvedValueOnce({
        items: largeContentTypes.slice(2000),
        total: largeContentTypes.length,
        limit: 1000,
        skip: 2000,
      });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 1000, fetchAll: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toHaveLength(2500);
    expect(result.current.total).toBe(2500);
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(3);
  });

  it('should handle API errors during pagination', async () => {
    mockSdk.cma.contentType.getMany
      .mockResolvedValueOnce({
        items: mockContentTypes.slice(0, 2),
        total: mockContentTypes.length,
        limit: 2,
        skip: 0,
      })
      .mockRejectedValueOnce(new Error('API Error on second batch'));

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 2, fetchAll: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('API Error on second batch');
    expect(result.current.contentTypes).toEqual(mockContentTypes.slice(0, 2));
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
  });

  it('should handle empty batches during pagination', async () => {
    mockSdk.cma.contentType.getMany
      .mockResolvedValueOnce({
        items: mockContentTypes.slice(0, 2),
        total: mockContentTypes.length,
        limit: 2,
        skip: 0,
      })
      .mockResolvedValueOnce({
        items: [],
        total: mockContentTypes.length,
        limit: 2,
        skip: 2,
      });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 2, fetchAll: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes.slice(0, 2));
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
  });

  it('should respect manual pagination when fetchAll is false', async () => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes.slice(0, 2),
      total: mockContentTypes.length,
      limit: 2,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 2, skip: 0, fetchAll: false }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes.slice(0, 2));
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(1);
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledWith({
      limit: 2,
      skip: 0,
    });
  });

  it('should handle retry logic for failed requests', async () => {
    const error = new Error('Temporary API Error');

    mockSdk.cma.contentType.getMany.mockRejectedValueOnce(error).mockRejectedValueOnce(error).mockResolvedValueOnce({
      items: mockContentTypes,
      total: mockContentTypes.length,
      limit: 1000,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 1000 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(result.current.error).toBe(null);
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(3);
  });

  it('should handle edge case with exactly 1000 content types', async () => {
    const exactly1000ContentTypes = Array.from({ length: 1000 }, (_, i) => ({
      ...mockContentTypes[0],
      sys: { ...mockContentTypes[0].sys, id: `contentType${i}` },
      name: `Content Type ${i}`,
    }));

    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: exactly1000ContentTypes,
      total: exactly1000ContentTypes.length,
      limit: 1000,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 1000, fetchAll: true }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toHaveLength(1000);
    expect(result.current.total).toBe(1000);
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(1);
  });
});
