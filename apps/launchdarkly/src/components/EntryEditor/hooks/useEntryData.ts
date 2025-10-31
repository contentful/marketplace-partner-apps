import { useState, useEffect, useCallback } from 'react';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EditorAppSDK } from '@contentful/app-sdk';
import { EntryPreviewData, EnhancedContentfulEntry } from '../types';
import { useContext } from 'react';
import { ContentTypesContext } from '../contexts/ContentTypesContext';

export function useEntryData(entryLink?: EnhancedContentfulEntry) {
  const sdk = useSDK<EditorAppSDK>();
  const { getContentTypeById } = useContext(ContentTypesContext);
  const [entryData, setEntryData] = useState<EntryPreviewData | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntryData = useCallback(async () => {
    if (!entryLink?.sys?.id) {
      setEntryData(undefined);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Handle both entries and assets
      if (entryLink.sys.linkType === 'Asset') {
        // Fetch asset details
        const asset = await sdk.cma.asset.get({ assetId: entryLink.sys.id });
        const title = asset.fields?.title?.[sdk.locales.default] || 'Untitled Asset';
        const description = asset.fields?.description?.[sdk.locales.default] || '';
        const file = asset.fields?.file?.[sdk.locales.default];
        
        setEntryData({
          title,
          description,
          status: asset.sys.publishedVersion ? 'published' : 'draft',
          contentType: 'Asset',
          contentTypeId: 'asset',
          media: {
            url: file?.url ? `https:${file.url}` : undefined,
            width: file?.details?.image?.width,
            height: file?.details?.image?.height,
            type: file?.contentType
          }
        });
      } else {
        // Fetch entry details
        console.log('[useEntryData] Fetching entry for id:', entryLink.sys.id);
        const entry = await sdk.cma.entry.get({ entryId: entryLink.sys.id });
        const contentTypeId = entry.sys.contentType.sys.id;
        console.log('[useEntryData] Entry contentType ID:', contentTypeId);
        const contentType = await getContentTypeById(contentTypeId);
        console.log('[useEntryData] Found contentType:', contentType);
        
        if (!contentType) {
          console.error('[useEntryData] Content type not found for ID:', contentTypeId);
          throw new Error(`Content type ${contentTypeId} not found`);
        }
        
        const displayField = contentType.displayField;
        const title = entry.fields[displayField]?.[sdk.locales.default] || 'Untitled';
        
        // Find a text field for description
        const descriptionField = contentType.fields.find(
          field => field.id !== displayField && 
                  (field.type === 'Text' || field.type === 'Symbol')
        );
        
        const description = descriptionField 
          ? entry.fields[descriptionField.id]?.[sdk.locales.default] 
          : '';
        
        // Determine entry status
        let status: EntryPreviewData['status'] = 'draft';
        if (entry.sys.archivedVersion) {
          status = 'archived';
        } else if (entry.sys.publishedVersion) {
          status = entry.sys.version > entry.sys.publishedVersion + 1 ? 'changed' : 'published';
        }
        
        // Extract useful fields for preview
        const fields: Record<string, any> = {};
        Object.keys(entry.fields).forEach(fieldId => {
          fields[fieldId] = entry.fields[fieldId][sdk.locales.default];
        });
        
        setEntryData({
          title,
          description,
          status,
          contentType: contentType.name,
          contentTypeId: contentType.sys.id,
          fields
        });
      }
    } catch (err) {
      console.error('Failed to fetch entry data:', err);
      setError('Failed to load content data');
    } finally {
      setLoading(false);
    }
  }, [entryLink?.sys?.id, entryLink?.sys?.linkType, sdk.cma, sdk.locales.default, getContentTypeById]);

  useEffect(() => {
    fetchEntryData();
  }, [fetchEntryData]);

  return { entryData, loading, error, refreshEntryData: fetchEntryData };
} 