import { useCallback, useEffect, useState } from 'react';
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
  const [currentSkip, setCurrentSkip] = useState(0);

  const { filters = [], limit = 1000, skip = 0, order = 'name', onProgress, fetchAll = true } = options;

  const fetchContentTypesData = useCallback(
    async (isLoadMore = false) => {
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
          skip: isLoadMore ? currentSkip : skip,
          order,
          fetchAll,
        });

        // Apply filters to the fetched content types
        const filteredContentTypes = filterContentTypes(response.items, allFilters);

        if (isLoadMore) {
          // Append new content types to existing ones
          setContentTypes((prev) => [...prev, ...filteredContentTypes]);
          setCurrentSkip((prev) => prev + limit);
        } else {
          // Replace content types
          setContentTypes(filteredContentTypes);
          setCurrentSkip(skip + limit);
        }

        setTotal(response.total);
        setHasMore(currentSkip + limit < response.total);

        // Report progress if callback provided
        if (onProgress) {
          const totalProcessed = isLoadMore ? contentTypes.length + filteredContentTypes.length : filteredContentTypes.length;
          onProgress(totalProcessed, response.total);
        }
      } catch (err: any) {
        const error = new Error(err?.message || 'Failed to fetch content types');
        setError(error);
        console.error('useContentTypes error:', error);
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [cma, filters, limit, skip, order, onProgress, fetchAll, currentSkip]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore) {
      await fetchContentTypesData(true);
    }
  }, [hasMore, isLoadingMore, fetchContentTypesData]);

  const refetch = useCallback(async () => {
    setCurrentSkip(skip);
    await fetchContentTypesData();
  }, [fetchContentTypesData, skip]);

  useEffect(() => {
    setCurrentSkip(skip);
    fetchContentTypesData();
  }, [fetchContentTypesData, skip]);

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
