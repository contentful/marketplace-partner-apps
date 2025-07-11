import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';
import type { UseContentTypesOptions, UseContentTypesReturn, ContentTypesResult, PaginationOptions } from '../types';
import { retryWithBackoff, withTimeout, debounce } from '../utils/apiUtils';
import { applyContentTypeFilters } from '../utils/contentTypeUtils';

const INITIAL_LIMIT = 1000;
const SEARCH_LIMIT = 100;
const OVERALL_TIMEOUT = 120000; // 2 minutes

export const useContentTypes = (cma: ConfigAppSDK['cma'], options: UseContentTypesOptions = {}): UseContentTypesReturn => {
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const currentOffset = useRef(0);
  const currentSearch = useRef<string>('');
  const isLoadingMore = useRef(false);
  const isSearching = useRef(false);

  const fetchContentTypes = useCallback(
    async (pagination: PaginationOptions = {}, _isLoadMore: boolean = false, isSearch: boolean = false): Promise<ContentTypesResult> => {
      const { limit = isSearch ? SEARCH_LIMIT : INITIAL_LIMIT, offset = 0, search } = pagination;

      try {
        const query: any = { limit, skip: offset };

        if (search && search.length >= 2) {
          query['sys.id[in]'] = search; // This is a simplified search - in practice you might want more sophisticated search
        }

        const response = (await retryWithBackoff(() => cma.contentType.getMany({ query }))) as any;

        let filteredContentTypes = response.items;

        // Apply filters if provided
        if (options.filters && options.filters.length > 0) {
          filteredContentTypes = applyContentTypeFilters(response.items, options.filters);
        }

        return {
          contentTypes: filteredContentTypes,
          total: response.total,
          hasMore: response.items.length === limit && response.total > offset + limit,
        };
      } catch (err: any) {
        console.error('Failed to fetch content types:', err);
        throw new Error(`Failed to fetch content types: ${err.message}`);
      }
    },
    [cma, options.filters]
  );

  const loadInitial = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    currentOffset.current = 0;
    currentSearch.current = '';

    try {
      const result = await withTimeout(fetchContentTypes({ limit: INITIAL_LIMIT, offset: 0 }), OVERALL_TIMEOUT);

      setContentTypes(result.contentTypes);
      setHasMore(result.hasMore);

      if (options.onProgress) {
        options.onProgress(result.contentTypes.length, result.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchContentTypes, loading, options.onProgress]);

  const loadMore = useCallback(async () => {
    if (loading || isLoadingMore.current || !hasMore) return;

    isLoadingMore.current = true;
    setLoading(true);

    try {
      const newOffset = currentOffset.current + contentTypes.length;
      const result = await fetchContentTypes(
        {
          limit: INITIAL_LIMIT,
          offset: newOffset,
          search: currentSearch.current,
        },
        true
      );

      setContentTypes((prev) => [...prev, ...result.contentTypes]);
      setHasMore(result.hasMore);
      currentOffset.current = newOffset;

      if (options.onProgress) {
        options.onProgress(contentTypes.length + result.contentTypes.length, result.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      isLoadingMore.current = false;
    }
  }, [fetchContentTypes, loading, hasMore, contentTypes.length, options.onProgress]);

  const search = useCallback(
    async (query: string) => {
      if (isSearching.current) return;

      // Only search if query is 2+ characters or empty (to reset)
      if (query.length > 0 && query.length < 2) return;

      isSearching.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await withTimeout(
          fetchContentTypes(
            {
              limit: SEARCH_LIMIT,
              offset: 0,
              search: query,
            },
            false,
            true
          ),
          OVERALL_TIMEOUT
        );

        setContentTypes(result.contentTypes);
        setHasMore(result.hasMore);
        currentOffset.current = 0;
        currentSearch.current = query;

        if (options.onProgress) {
          options.onProgress(result.contentTypes.length, result.total);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        isSearching.current = false;
      }
    },
    [fetchContentTypes, options.onProgress]
  );

  const reset = useCallback(() => {
    setContentTypes([]);
    setError(null);
    setHasMore(false);
    currentOffset.current = 0;
    currentSearch.current = '';
    isLoadingMore.current = false;
    isSearching.current = false;
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length >= 2) {
        await search(query);
      } else if (query.length === 0) {
        // Reset to initial load when search is cleared
        await loadInitial();
      }
    }, 300),
    [search, loadInitial]
  );

  // Load initial content types on mount
  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  return {
    contentTypes,
    loading,
    error,
    hasMore,
    loadMore,
    search: debouncedSearch,
    reset,
  };
};
