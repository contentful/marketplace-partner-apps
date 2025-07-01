import { useCallback, useEffect, useState, useRef } from 'react';
import { useCMA } from '@contentful/react-apps-toolkit';
import { ContentTypeProps } from 'contentful-management';
import { UseContentTypesOptions } from '../components/ContentTypeSelector/types';
import { filterContentTypes } from '../utils/contentTypeFilters';
import { fetchContentTypes, fetchEditorInterfaces } from '../utils/apiHelpers';

export interface ContentTypeWithEditorInterface {
  contentType: ContentTypeProps;
  editorInterface: any;
}

export interface UseContentTypesWithEditorInterfacesOptions extends UseContentTypesOptions {
  appDefinitionId?: string; // The app ID to check for in editor interfaces
  includeEditorInterfaces?: boolean; // Whether to fetch editor interfaces
  onProgress?: (processed: number, total: number) => void; // Progress callback for editor interface fetching
}

export interface UseContentTypesWithEditorInterfacesReturn {
  contentTypes: ContentTypeProps[];
  contentTypesWithEditorInterfaces: ContentTypeWithEditorInterface[];
  loading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  isLoadingMore: boolean;
}

/**
 * Hook for fetching content types and their editor interfaces to determine current app configuration
 */
export function useContentTypesWithEditorInterfaces(options: UseContentTypesWithEditorInterfacesOptions = {}): UseContentTypesWithEditorInterfacesReturn {
  const cma = useCMA();
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [contentTypesWithEditorInterfaces, setContentTypesWithEditorInterfaces] = useState<ContentTypeWithEditorInterface[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Use refs to avoid dependency issues
  const currentSkipRef = useRef(0);
  const mountedRef = useRef(true);

  const { filters = [], limit = 1000, skip = 0, order = 'name', onProgress, fetchAll = true, appDefinitionId, includeEditorInterfaces = true } = options;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchContentTypesWithEditorInterfaces = useCallback(
    async (isLoadMore = false) => {
      if (!mountedRef.current) return;

      try {
        if (isLoadMore) {
          setIsLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError(null);

        // Fetch content types (without progress tracking here)
        const response = await fetchContentTypes(cma as any, {
          limit,
          skip: isLoadMore ? currentSkipRef.current : skip,
          order,
          fetchAll,
        });

        if (!mountedRef.current) return;

        // Apply filters to the fetched content types
        const filteredContentTypes = filterContentTypes(response.items, filters);

        if (includeEditorInterfaces && filteredContentTypes.length > 0) {
          // Fetch editor interfaces for the filtered content types with progress tracking
          const contentTypeIds = filteredContentTypes.map((ct) => ct.sys.id);

          // Track progress for editor interface fetching
          let processedEditorInterfaces = 0;
          const editorInterfaces = await fetchEditorInterfaces(cma as any, contentTypeIds, {
            batchSize: 10,
            delay: 1000,
            maxRetries: 3,
            onProgress: (processed, total) => {
              processedEditorInterfaces = processed;
              if (onProgress) {
                onProgress(processed, total);
              }
            },
          });

          if (!mountedRef.current) return;

          // Combine content types with their editor interfaces
          const combined = filteredContentTypes.map((contentType) => ({
            contentType,
            editorInterface: editorInterfaces[contentType.sys.id] || null,
          }));

          if (isLoadMore) {
            setContentTypesWithEditorInterfaces((prev) => [...prev, ...combined]);
            setContentTypes((prev) => [...prev, ...filteredContentTypes]);
            currentSkipRef.current += limit;
          } else {
            setContentTypesWithEditorInterfaces(combined);
            setContentTypes(filteredContentTypes);
            currentSkipRef.current = skip + limit;
          }
        } else {
          // Just set content types without editor interfaces
          if (isLoadMore) {
            setContentTypes((prev) => [...prev, ...filteredContentTypes]);
            currentSkipRef.current += limit;
          } else {
            setContentTypes(filteredContentTypes);
            currentSkipRef.current = skip + limit;
          }
        }

        setTotal(filteredContentTypes.length); // Use filtered count, not total
        // When fetchAll is true, we've already fetched everything, so no more pages
        setHasMore(fetchAll ? false : currentSkipRef.current < response.total);
      } catch (err: any) {
        if (!mountedRef.current) return;

        const error = new Error(err?.message || 'Failed to fetch content types with editor interfaces');
        setError(error);
        console.error('useContentTypesWithEditorInterfaces error:', error);
      } finally {
        if (!mountedRef.current) return;

        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [cma, filters, limit, skip, order, onProgress, fetchAll, includeEditorInterfaces]
  );

  const loadMore = useCallback(async () => {
    if (hasMore && !isLoadingMore && !fetchAll) {
      await fetchContentTypesWithEditorInterfaces(true);
    }
  }, [hasMore, isLoadingMore, fetchContentTypesWithEditorInterfaces, fetchAll]);

  const refetch = useCallback(async () => {
    currentSkipRef.current = skip;
    await fetchContentTypesWithEditorInterfaces();
  }, [fetchContentTypesWithEditorInterfaces, skip]);

  // Initial fetch - only run once on mount and when skip changes
  useEffect(() => {
    currentSkipRef.current = skip;
    fetchContentTypesWithEditorInterfaces();
  }, [skip]); // Only depend on skip

  return {
    contentTypes,
    contentTypesWithEditorInterfaces,
    loading,
    error,
    total,
    hasMore,
    refetch,
    loadMore,
    isLoadingMore,
  };
}
