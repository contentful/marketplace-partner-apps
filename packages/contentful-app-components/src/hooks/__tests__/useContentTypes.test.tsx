import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useContentTypes } from '../useContentTypes';
import { useCMA } from '@contentful/react-apps-toolkit';
import { fetchContentTypes } from '../../utils/apiHelpers';

// Mock at the top before any imports
vi.mock('../../utils/apiHelpers', () => ({
  fetchContentTypes: vi.fn(),
}));

vi.mock('@contentful/react-apps-toolkit', () => ({
  useCMA: vi.fn(),
}));

const mockUseCMA = useCMA as unknown as ReturnType<typeof vi.fn>;
const mockCMA = { contentType: { getMany: vi.fn() } };

describe('useContentTypes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCMA.mockReturnValue(mockCMA);
  });

  it('should initialize with default values', () => {
    (fetchContentTypes as any).mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => useContentTypes());

    expect(result.current.contentTypes).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.total).toBe(0);
    expect(result.current.hasMore).toBe(false);
    expect(typeof result.current.refetch).toBe('function');
    expect(typeof result.current.loadMore).toBe('function');
  });

  it('should have the expected interface', () => {
    (fetchContentTypes as any).mockResolvedValue({ items: [], total: 0 });
    const { result } = renderHook(() => useContentTypes());

    expect(result.current).toHaveProperty('contentTypes');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('total');
    expect(result.current).toHaveProperty('hasMore');
    expect(result.current).toHaveProperty('refetch');
    expect(result.current).toHaveProperty('loadMore');
    expect(result.current).toHaveProperty('isLoadingMore');
  });

  it('should accept custom options', () => {
    (fetchContentTypes as any).mockResolvedValue({ items: [], total: 0 });
    const options = { limit: 50, skip: 10, order: 'sys.id', fetchAll: false };

    expect(() => renderHook(() => useContentTypes(options))).not.toThrow();
  });

  it('should handle filters option', () => {
    (fetchContentTypes as any).mockResolvedValue({ items: [], total: 0 });
    const filters = [{ type: 'name' as const, value: 'test' }];

    expect(() => renderHook(() => useContentTypes({ filters }))).not.toThrow();
  });
});
