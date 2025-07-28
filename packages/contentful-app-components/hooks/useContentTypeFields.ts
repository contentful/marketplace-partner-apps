import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';
import type { UseContentTypeFieldsOptions, UseContentTypeFieldsReturn, ContentTypeWithEditorInterface } from '../types';
import { retryWithBackoff, fetchAllContentTypes, fetchEditorInterfacesInBatches } from '../utils/apiUtils';
import { applyContentTypeFilters, applyFieldFilters } from '../utils/contentTypeUtils';

const INITIAL_LIMIT = 1000;
const SEARCH_LIMIT = 100;
// const OVERALL_TIMEOUT = 120000;

export const useContentTypeFields = (cma: ConfigAppSDK['cma'], options: UseContentTypeFieldsOptions = {}): UseContentTypeFieldsReturn => {
  const [contentTypesWithFields, setContentTypesWithFields] = useState<ContentTypeWithEditorInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ processed: number; total: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchTrigger, setFetchTrigger] = useState(0);

  // Memoize options to prevent unnecessary re-renders
  const memoizedOptions = useMemo(
    () => ({
      contentTypeFilters: options.contentTypeFilters || [],
      fieldFilters: options.fieldFilters || [],
      appDefinitionId: options.appDefinitionId,
      onProgress: options.onProgress,
    }),
    [options.contentTypeFilters, options.fieldFilters, options.appDefinitionId, options.onProgress]
  );

  // Fetch logic, stable and only depends on cma and memoized options
  const fetchContentTypesWithFields = useCallback(async () => {
    if (loading) return; // Prevent concurrent fetches

    setLoading(true);
    setError(null);
    setProgress({ processed: 0, total: 0 });

    try {
      let contentTypes: ContentTypeProps[] = [];

      // Fetch all content types if filters are present
      if (memoizedOptions.contentTypeFilters.length > 0) {
        const allContentTypes = await fetchAllContentTypes(cma, (processed, total) => {
          setProgress({ processed, total });
        });
        contentTypes = applyContentTypeFilters(allContentTypes, memoizedOptions.contentTypeFilters);
      } else {
        // No filters, use regular pagination
        const query: any = { limit: searchQuery ? SEARCH_LIMIT : INITIAL_LIMIT, skip: 0 };
        if (searchQuery && searchQuery.length >= 2) {
          query['sys.id[in]'] = searchQuery;
        }
        const response = (await retryWithBackoff(() => cma.contentType.getMany({ query }))) as any;
        contentTypes = response.items;
      }

      if (contentTypes.length === 0) {
        setContentTypesWithFields([]);
        setProgress(null);
        return;
      }

      setProgress({ processed: 0, total: contentTypes.length });
      const contentTypeIds = contentTypes.map((ct) => ct.sys.id);
      const editorInterfaceResults = await fetchEditorInterfacesInBatches(cma, contentTypeIds, (processed: number, total: number) => {
        setProgress({ processed, total });
      });

      const result: ContentTypeWithEditorInterface[] = contentTypes
        .map((contentType) => {
          const editorInterfaceResult = editorInterfaceResults.find(
            (result: any) => result.status === 'fulfilled' && result.value.contentTypeId === contentType.sys.id
          );
          const editorInterface = editorInterfaceResult?.status === 'fulfilled' ? editorInterfaceResult.value.editorInterface : { controls: [] };
          let fields = contentType.fields;
          if (memoizedOptions.fieldFilters.length > 0) {
            fields = applyFieldFilters(contentType.fields, memoizedOptions.fieldFilters);
          }
          return {
            contentType,
            editorInterface,
            fields,
          };
        })
        .filter((item) => item.fields.length > 0)
        .sort((a, b) => {
          // Sort by content type name first, then by field name
          const typeCompare = a.contentType.name.localeCompare(b.contentType.name);
          if (typeCompare !== 0) return typeCompare;

          // If content types are the same, sort by first field name
          const aFirstField = a.fields[0]?.name || '';
          const bFirstField = b.fields[0]?.name || '';
          return aFirstField.localeCompare(bFirstField);
        });

      setContentTypesWithFields(result);
      setProgress(null);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      setContentTypesWithFields([]);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [cma, memoizedOptions, searchQuery, fetchTrigger]);

  // Fetch on mount only
  useEffect(() => {
    fetchContentTypesWithFields();
  }, []); // Empty dependency array - only run on mount

  // Search handler
  const search = useCallback((query: string) => {
    setSearchQuery(query);
    setFetchTrigger((prev) => prev + 1); // Trigger new fetch
  }, []);

  // Reset handler
  const reset = useCallback(() => {
    setContentTypesWithFields([]);
    setError(null);
    setProgress(null);
    setSearchQuery('');
    setFetchTrigger((prev) => prev + 1); // Trigger new fetch
  }, []);

  return {
    contentTypesWithFields,
    loading,
    error,
    hasMore: false, // Infinite scroll not supported in this simple pattern
    loadMore: async () => {}, // No-op
    search,
    reset,
    progress,
  };
};
