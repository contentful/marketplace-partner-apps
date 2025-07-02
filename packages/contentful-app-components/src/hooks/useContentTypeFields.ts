import { useState, useCallback, useRef, useEffect } from 'react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps, ContentFields } from 'contentful-management';
import type { UseContentTypeFieldsOptions, UseContentTypeFieldsReturn, ContentTypeWithEditorInterface, ContentTypeFilter, FieldFilter } from '../types';
import { retryWithBackoff, withTimeout, debounce, fetchAllContentTypes, fetchEditorInterfacesForContentTypes } from '../utils/apiHelpers';
import { applyContentTypeFilters, applyFieldFilters } from '../utils/contentTypeFilters';

const INITIAL_LIMIT = 1000; // Load all content types on initial load
const SEARCH_LIMIT = 100;
const OVERALL_TIMEOUT = 120000; // 2 minute timeout for large content models
const BATCH_SIZE = 10; // Process editor interfaces in batches of 10
const BATCH_DELAY = 200; // Delay between batches to avoid rate limits

export const useContentTypeFields = (cma: ConfigAppSDK['cma'], options: UseContentTypeFieldsOptions = {}): UseContentTypeFieldsReturn => {
  const [contentTypesWithFields, setContentTypesWithFields] = useState<ContentTypeWithEditorInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);

  const currentOffset = useRef(0);
  const currentSearch = useRef<string>('');
  const isLoadingMore = useRef(false);
  const isSearching = useRef(false);
  const allContentTypesRef = useRef<ContentTypeProps[]>([]);

  // Store filters in refs to prevent infinite loops
  const contentTypeFiltersRef = useRef(options.contentTypeFilters);
  const fieldFiltersRef = useRef(options.fieldFilters);
  const appDefinitionIdRef = useRef(options.appDefinitionId);
  const onProgressRef = useRef(options.onProgress);

  // Update refs when options change
  useEffect(() => {
    contentTypeFiltersRef.current = options.contentTypeFilters;
    fieldFiltersRef.current = options.fieldFilters;
    appDefinitionIdRef.current = options.appDefinitionId;
    onProgressRef.current = options.onProgress;
  }, [options.contentTypeFilters, options.fieldFilters, options.appDefinitionId, options.onProgress]);

  const fetchContentTypesWithFields = useCallback(
    async (
      pagination: { limit?: number; offset?: number; search?: string } = {},
      isLoadMore: boolean = false,
      isSearch: boolean = false
    ): Promise<{ contentTypesWithFields: ContentTypeWithEditorInterface[]; total: number; hasMore: boolean }> => {
      const { limit = isSearch ? SEARCH_LIMIT : INITIAL_LIMIT, offset = 0, search } = pagination;

      try {
        let contentTypes: ContentTypeProps[];

        // If we have filters, we need to fetch ALL content types first to filter them
        if (contentTypeFiltersRef.current && contentTypeFiltersRef.current.length > 0) {
          // Fetch all content types if we don't have them cached
          if (allContentTypesRef.current.length === 0) {
            setProgress({ processed: 0, total: 0 });
            allContentTypesRef.current = await fetchAllContentTypes(cma, (processed, total) => {
              setProgress({ processed, total });
            });
          }

          // Apply content type filters
          contentTypes = applyContentTypeFilters(allContentTypesRef.current, contentTypeFiltersRef.current);

          // Apply pagination to filtered results
          const startIndex = offset;
          const endIndex = startIndex + limit;
          contentTypes = contentTypes.slice(startIndex, endIndex);
        } else {
          // No filters, use regular pagination
          const query: any = { limit, skip: offset };

          if (search && search.length >= 2) {
            query['sys.id[in]'] = search;
          }

          const response = (await retryWithBackoff(() => cma.contentType.getMany({ query }))) as any;

          contentTypes = response.items;
        }

        if (contentTypes.length === 0) {
          return {
            contentTypesWithFields: [],
            total: 0,
            hasMore: false,
          };
        }

        // Fetch editor interfaces for the content types
        setProgress({ processed: 0, total: contentTypes.length });
        const editorInterfaces = await fetchEditorInterfacesForContentTypes(cma, contentTypes, (processed, total) => {
          setProgress({ processed, total });
        });

        // Combine content types with their editor interfaces and filter fields
        const contentTypesWithFields: ContentTypeWithEditorInterface[] = contentTypes
          .map((contentType) => {
            const editorInterface = editorInterfaces.find((ei) => ei.contentTypeId === contentType.sys.id)?.editorInterface || { controls: [] };

            let fields = contentType.fields;

            // Apply field filters if provided
            if (fieldFiltersRef.current && fieldFiltersRef.current.length > 0) {
              fields = applyFieldFilters(contentType.fields, fieldFiltersRef.current);
            }

            return {
              contentType,
              editorInterface,
              fields,
            };
          })
          .filter((item) => item.fields.length > 0); // Only include content types that have matching fields

        return {
          contentTypesWithFields,
          total: contentTypesWithFields.length,
          hasMore: contentTypes.length === limit && contentTypesWithFields.length > 0,
        };
      } catch (err: any) {
        console.error('Failed to fetch content types with fields:', err);
        throw new Error(`Failed to fetch content types with fields: ${err.message}`);
      }
    },
    [cma] // Only depend on cma, not the filters
  );

  const loadInitial = useCallback(async () => {
    if (loading) return;

    setLoading(true);
    setError(null);
    currentOffset.current = 0;
    currentSearch.current = '';
    allContentTypesRef.current = [];

    try {
      const result = await withTimeout(fetchContentTypesWithFields({ limit: INITIAL_LIMIT, offset: 0 }), OVERALL_TIMEOUT);

      setContentTypesWithFields(result.contentTypesWithFields);
      setHasMore(result.hasMore);

      if (onProgressRef.current) {
        onProgressRef.current(result.contentTypesWithFields.length, result.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, [fetchContentTypesWithFields, loading]);

  const loadMore = useCallback(async () => {
    if (loading || isLoadingMore.current || !hasMore) return;

    isLoadingMore.current = true;
    setLoading(true);

    try {
      const newOffset = currentOffset.current + contentTypesWithFields.length;
      const result = await fetchContentTypesWithFields(
        {
          limit: INITIAL_LIMIT,
          offset: newOffset,
          search: currentSearch.current,
        },
        true
      );

      setContentTypesWithFields((prev) => [...prev, ...result.contentTypesWithFields]);
      setHasMore(result.hasMore);
      currentOffset.current = newOffset;

      if (onProgressRef.current) {
        onProgressRef.current(contentTypesWithFields.length + result.contentTypesWithFields.length, result.total);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
      isLoadingMore.current = false;
    }
  }, [fetchContentTypesWithFields, loading, hasMore, contentTypesWithFields.length]);

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
          fetchContentTypesWithFields(
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

        setContentTypesWithFields(result.contentTypesWithFields);
        setHasMore(result.hasMore);
        currentOffset.current = 0;
        currentSearch.current = query;

        if (onProgressRef.current) {
          onProgressRef.current(result.contentTypesWithFields.length, result.total);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
        setProgress(null);
        isSearching.current = false;
      }
    },
    [fetchContentTypesWithFields]
  );

  const reset = useCallback(() => {
    setContentTypesWithFields([]);
    setError(null);
    setHasMore(false);
    setProgress(null);
    currentOffset.current = 0;
    currentSearch.current = '';
    isLoadingMore.current = false;
    isSearching.current = false;
    allContentTypesRef.current = [];
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
    contentTypesWithFields,
    loading,
    error,
    hasMore,
    loadMore,
    search: debouncedSearch,
    reset,
    progress,
  };
};
