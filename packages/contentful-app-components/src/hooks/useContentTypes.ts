import { useCallback, useEffect, useState, useRef } from 'react';
import { useCMA } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { UseContentTypesOptions, UseContentTypesReturn, ContentTypeFilter } from '../components/ContentTypeSelector/types';
import { filterContentTypes, convertFieldTypeFilters } from '../utils/contentTypeFilters';
import { fetchContentTypes } from '../utils/apiHelpers';

/**
 * Hook for fetching and managing content types with filtering and pagination
 */
export function useContentTypes(options: UseContentTypesOptions = {}): UseContentTypesReturn {
  const cma = useCMA();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use refs to avoid dependency issues
  const currentSkipRef = useRef(0);
  const mountedRef = useRef(true);

  const { filters = [], limit = 1000, skip = 0, order = 'name', onProgress, fetchAll = true } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchContentTypesData = useCallback(
    async (isLoadMore = false) => {
      if (!mountedRef.current) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Convert legacy fieldTypeFilters to filters if present
        const allFilters = [...filters];

        const response = await fetchContentTypes(cma as any, {
          limit,
          skip: isLoadMore ? currentSkipRef.current : skip,
          order,
          fetchAll,
          onProgress,
        });

        if (!mountedRef.current) return;

        // Apply filters to the fetched content types
        const filteredContentTypes = filterContentTypes(response.items, allFilters);

        if (isLoadMore) {
          // Append new content types to existing ones
          setContentTypes((prev) => [...prev, ...filteredContentTypes]);
          currentSkipRef.current += limit;
        } else {
          // Replace content types
          setContentTypes(filteredContentTypes);
          currentSkipRef.current = skip + limit;
        }

        setTotal(response.total);
        // When fetchAll is true, we've already fetched everything, so no more pages
        setHasMore(fetchAll ? false : currentSkipRef.current < response.total);

        // Report progress if callback provided
        if (onProgress) {
          const totalProcessed = isLoadMore ? contentTypes.length + filteredContentTypes.length : filteredContentTypes.length;
          onProgress(totalProcessed, response.total);
        }
      } catch (err: any) {
        if (!mountedRef.current) return;

        const error = new Error(err?.message || 'Failed to fetch content types');
        setError(error);
        console.error('useContentTypes error:', error);
      } finally {
        if (!mountedRef.current) return;

        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [cma, filters, limit, skip, order, onProgress, fetchAll]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore && !fetchAll) {
      await fetchContentTypesData(true);
    }
  }, [hasMore, isLoadingMore, fetchContentTypesData, fetchAll]);

  const refetch = useCallback(async () => {
    currentSkipRef.current = skip;
    await fetchContentTypesData();
  }, [fetchContentTypesData, skip]);

  // Initial fetch - only run once on mount and when skip changes
  useEffect(() => {
    currentSkipRef.current = skip;
    fetchContentTypesData();
  }, [skip]); // Only depend on skip

  return {
    contentTypes,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
    isLoadingMore,
  };
}
