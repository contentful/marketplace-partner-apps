// src/contexts/ContentTypesContext.tsx
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EditorAppSDK } from '@contentful/app-sdk';
import { ContentType } from '../types';
import { useErrorState } from '../../../hooks/useErrorState';
import { ContentTypeFilter } from '../types';

interface ContentTypesContextProps {
  contentTypes: ContentType[];
  loading: boolean;
  error: string | null;
  // Add filtering capabilities
  getContentTypeById: (id: string) => ContentType | undefined;
  getFilteredContentTypes: (filter?: ContentTypeFilter) => ContentType[];
  refreshContentTypes: () => Promise<void>;
}

export const ContentTypesContext = createContext<ContentTypesContextProps>({
  contentTypes: [],
  loading: true,
  error: null,
  getContentTypeById: () => undefined,
  getFilteredContentTypes: () => [],
  refreshContentTypes: async () => {}
});

export const ContentTypesProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const sdk = useSDK<EditorAppSDK>();
  const { error, handleError, clearError } = useErrorState('ContentTypesProvider');
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContentTypes = async () => {
      try {
        setLoading(true);
        clearError();
        console.log('[ContentTypesProvider] Fetching content types...');
        const response = await sdk.space.getContentTypes();
        console.log('[ContentTypesProvider] Fetched content types:', response.items.length);
        setContentTypes(response.items);
      } catch (err) {
        console.error('Failed to load content types:', err);
        handleError('Failed to load content types');
      } finally {
        setLoading(false);
      }
    };

    fetchContentTypes();
  }, [sdk.space, handleError, clearError]);

  // Helper to get a content type by ID
  const getContentTypeById = (id: string) => contentTypes.find(ct => ct.sys.id === id);

  // Helper to filter content types
  const getFilteredContentTypes = (filter?: ContentTypeFilter) => {
    if (!filter) return contentTypes;
    
    let filtered = [...contentTypes];
    
    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(ct => 
        ct.name.toLowerCase().includes(searchLower) || 
        ct.sys.id.toLowerCase().includes(searchLower) ||
        (ct.description && ct.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply type exclusion
    if (filter.excludeTypes && filter.excludeTypes.length > 0) {
      filtered = filtered.filter(ct => !filter.excludeTypes?.includes(ct.sys.id));
    }
    
    // Apply type inclusion
    if (filter.includeTypes && filter.includeTypes.length > 0) {
      filtered = filtered.filter(ct => filter.includeTypes?.includes(ct.sys.id));
    }
    
    return filtered;
  };

  return (
    <ContentTypesContext.Provider
      value={{
        contentTypes, 
        loading, 
        error: error.message, 
        getContentTypeById, 
        getFilteredContentTypes,
        refreshContentTypes: async () => {
          try {
            setLoading(true);
            clearError();
            const response = await sdk.space.getContentTypes();
            setContentTypes(response.items);
          } catch (err) {
            console.error('Failed to refresh content types:', err);
            handleError('Failed to refresh content types');
          } finally {
            setLoading(false);
          }
        }
      }}
    >
      {children}
    </ContentTypesContext.Provider>
  );
};

export const useContentTypes = () => useContext(ContentTypesContext);