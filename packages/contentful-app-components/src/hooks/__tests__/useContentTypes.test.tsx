import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useContentTypes } from '../useContentTypes';
import { mockSdk } from '../../../test/mocks/mockSdk';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('useContentTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch content types on mount', async () => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
      limit: 1000,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual(mockContentTypes);
    expect(result.current.total).toBe(mockContentTypes.length);
    expect(result.current.error).toBe(null);
  });

  it('should handle API errors', async () => {
    const error = new Error('API Error');
    mockSdk.cma.contentType.getMany.mockRejectedValue(error);

    const { result } = renderHook(() => useContentTypes(mockSdk.cma));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('API Error');
    expect(result.current.contentTypes).toEqual([]);
  });

  it('should support custom options', async () => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes.slice(0, 2),
      total: mockContentTypes.length,
      limit: 2,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma, { limit: 2, skip: 0 }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledWith({
      limit: 2,
      skip: 0,
    });
    expect(result.current.contentTypes).toHaveLength(2);
  });

  it('should support fetchAll option', async () => {
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
    expect(mockSdk.cma.contentType.getMany).toHaveBeenCalledTimes(2);
  });

  it('should handle empty response', async () => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: [],
      total: 0,
      limit: 1000,
      skip: 0,
    });

    const { result } = renderHook(() => useContentTypes(mockSdk.cma));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.contentTypes).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('should not refetch when options change if disabled', async () => {
    mockSdk.cma.contentType.getMany.mockResolvedValue({
      items: mockContentTypes,
      total: mockContentTypes.length,
      limit: 1000,
      skip: 0,
    });

    const { result, rerender } = renderHook(({ options }) => useContentTypes(mockSdk.cma, options), { initialProps: { options: { limit: 1000 } } });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const initialCallCount = mockSdk.cma.contentType.getMany.mock.calls.length;

    rerender({ options: { limit: 500 } });

    // Should not make additional calls since refetch is disabled by default
    expect(mockSdk.cma.contentType.getMany.mock.calls.length).toBe(initialCallCount);
  });
});
