import { useCallback, useState } from 'react';
import { UseContentTypeSelectionOptions, UseContentTypeSelectionReturn } from '../components/ContentTypeSelector/types';

/**
 * Hook for managing content type and field selection state
 */
export function useContentTypeSelection(options: UseContentTypeSelectionOptions = {}): UseContentTypeSelectionReturn {
  const { initialSelection = [], initialFieldSelection = {}, multiSelect = true, fieldMultiSelect = true } = options;

  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(initialSelection);
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>(initialFieldSelection);

  const toggleContentType = useCallback(
    (id: string) => {
      setSelectedContentTypes((prev: string[]) => {
        if (multiSelect) {
          if (prev.includes(id)) {
            return prev.filter((contentTypeId: string) => contentTypeId !== id);
          } else {
            return [...prev, id];
          }
        } else {
          return prev.includes(id) ? [] : [id];
        }
      });

      // If deselecting a content type, also clear its field selections
      setSelectedFields((prev: Record<string, string[]>) => {
        if (selectedContentTypes.includes(id)) {
          const newSelection = { ...prev };
          delete newSelection[id];
          return newSelection;
        }
        return prev;
      });
    },
    [multiSelect, selectedContentTypes]
  );

  const toggleField = useCallback(
    (contentTypeId: string, fieldId: string) => {
      setSelectedFields((prev: Record<string, string[]>) => {
        const currentFields = prev[contentTypeId] || [];

        if (fieldMultiSelect) {
          if (currentFields.includes(fieldId)) {
            const newFields = currentFields.filter((id: string) => id !== fieldId);
            if (newFields.length === 0) {
              const newSelection = { ...prev };
              delete newSelection[contentTypeId];
              return newSelection;
            }
            return { ...prev, [contentTypeId]: newFields };
          } else {
            return { ...prev, [contentTypeId]: [...currentFields, fieldId] };
          }
        } else {
          return { ...prev, [contentTypeId]: [fieldId] };
        }
      });
    },
    [fieldMultiSelect]
  );

  const setSelection = useCallback((contentTypeIds: string[], fieldIds?: Record<string, string[]>) => {
    setSelectedContentTypes(contentTypeIds);
    if (fieldIds) {
      setSelectedFields(fieldIds);
    }
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedContentTypes([]);
    setSelectedFields({});
  }, []);

  const isContentTypeSelected = useCallback(
    (id: string) => {
      return selectedContentTypes.includes(id);
    },
    [selectedContentTypes]
  );

  const isFieldSelected = useCallback(
    (contentTypeId: string, fieldId: string) => {
      return selectedFields[contentTypeId]?.includes(fieldId) || false;
    },
    [selectedFields]
  );

  return {
    selectedContentTypes,
    selectedFields,
    toggleContentType,
    toggleField,
    setSelection,
    clearSelection,
    isContentTypeSelected,
    isFieldSelected,
  };
}
