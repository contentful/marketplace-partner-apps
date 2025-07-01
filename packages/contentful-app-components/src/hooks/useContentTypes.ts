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

  const { filters = [], limit = 1000, skip = 0, order = 'name', onProgress } = options;

  const fetchContentTypesData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Convert legacy fieldTypeFilters to filters if present
      const allFilters = [...filters];

      const response = await fetchContentTypes(cma, {
        limit,
        skip,
        order,
      });

      // Apply filters to the fetched content types
      const filteredContentTypes = filterContentTypes(response.items, allFilters);

      setContentTypes(filteredContentTypes);
      setTotal(response.total);
      setHasMore(skip + limit < response.total);

      // Report progress if callback provided
      if (onProgress) {
        onProgress(filteredContentTypes.length, response.total);
      }
    } catch (err: any) {
      const error = new Error(err?.message || 'Failed to fetch content types');
      setError(error);
      console.error('useContentTypes error:', error);
    } finally {
      setLoading(false);
    }
  }, [cma, filters, limit, skip, order, onProgress]);

  const refetch = useCallback(async () => {
    await fetchContentTypesData();
  }, [fetchContentTypesData]);

  useEffect(() => {
    fetchContentTypesData();
  }, [fetchContentTypesData]);

  return {
    contentTypes,
    loading,
    error,
    total,
    hasMore,
    refetch,
  };
}
