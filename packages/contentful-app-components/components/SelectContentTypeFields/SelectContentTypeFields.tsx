import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Autocomplete, Checkbox, Pill, Text, Flex, Note, Subheading } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import { useContentTypeFields } from '../../hooks/useContentTypeFields';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeFilter, FieldFilter, ContentTypeFieldOption } from '../../types';

export interface SelectContentTypeFieldsProps {
  cma: ConfigAppSDK['cma'];
  selectedFieldIds: string[]; // format: "contentTypeId:fieldId"
  onSelectionChange: (fieldIds: string[]) => void;
  contentTypeFilters?: ContentTypeFilter[];
  fieldFilters?: FieldFilter[];
  appDefinitionId?: string; // For checking if fields are already configured
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  onProgress?: (processed: number, total: number) => void;
  renderEmptyState?: () => React.ReactNode;
  onFieldDataChange?: (
    fieldData: Array<{ contentTypeId: string; contentTypeName: string; fieldId: string; fieldName: string; isAlreadyConfigured: boolean }>
  ) => void;
}

export function SelectContentTypeFields({
  cma,
  selectedFieldIds,
  onSelectionChange,
  contentTypeFilters = [],
  fieldFilters = [],
  appDefinitionId,
  placeholder = 'Select content types and fields...',
  disabled = false,
  searchable = true,
  onProgress,
  renderEmptyState,
  onFieldDataChange,
}: SelectContentTypeFieldsProps) {
  const [inputValue, setInputValue] = useState('');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);
  const hasAutoPopulatedRef = useRef<boolean>(false);

  const { contentTypesWithFields, loading, error, hasMore, loadMore, search, progress } = useContentTypeFields(cma, {
    contentTypeFilters,
    fieldFilters,
    appDefinitionId: appDefinitionId || '',
    onProgress: onProgress || (() => {}),
  });

  // Helper function to check if a field is already configured
  const isFieldAlreadyConfigured = useCallback(
    (editorInterface: any, fieldId: string) => {
      const control = editorInterface.controls?.find((c: any) => c.fieldId === fieldId);
      return appDefinitionId ? control && control.widgetId === appDefinitionId : false;
    },
    [appDefinitionId]
  );

  // Auto-populate selectedFieldIds with already configured fields on initial load
  useEffect(() => {
    if (!loading && contentTypesWithFields.length > 0 && selectedFieldIds.length === 0 && !hasAutoPopulatedRef.current) {
      const alreadyConfiguredFieldIds: string[] = [];

      contentTypesWithFields.forEach(({ contentType, editorInterface, fields }) => {
        fields.forEach((field) => {
          if (isFieldAlreadyConfigured(editorInterface, field.id)) {
            alreadyConfiguredFieldIds.push(`${contentType.sys.id}:${field.id}`);
          }
        });
      });

      if (alreadyConfiguredFieldIds.length > 0) {
        onSelectionChange(alreadyConfiguredFieldIds);
        hasAutoPopulatedRef.current = true;
      }
    }
  }, [loading, contentTypesWithFields, selectedFieldIds.length, isFieldAlreadyConfigured, onSelectionChange]);

  // Notify parent of field data changes
  useEffect(() => {
    if (onFieldDataChange && !loading) {
      const fieldData: Array<{ contentTypeId: string; contentTypeName: string; fieldId: string; fieldName: string; isAlreadyConfigured: boolean }> = [];

      contentTypesWithFields.forEach(({ contentType, editorInterface, fields }) => {
        fields.forEach((field) => {
          fieldData.push({
            contentTypeId: contentType.sys.id,
            contentTypeName: contentType.name,
            fieldId: field.id,
            fieldName: field.name,
            isAlreadyConfigured: isFieldAlreadyConfigured(editorInterface, field.id),
          });
        });
      });

      onFieldDataChange(fieldData);
    }
  }, [contentTypesWithFields, loading, isFieldAlreadyConfigured, onFieldDataChange]);

  // Convert content types with fields to field options
  const fieldOptions = useMemo((): ContentTypeFieldOption[] => {
    const options: ContentTypeFieldOption[] = [];

    contentTypesWithFields.forEach(({ contentType, editorInterface, fields }) => {
      fields.forEach((field) => {
        // Only add to dropdown if NOT already configured
        if (!isFieldAlreadyConfigured(editorInterface, field.id)) {
          options.push({
            id: `${contentType.sys.id}:${field.id}`,
            name: `${contentType.name} > ${field.name}`,
            contentTypeId: contentType.sys.id,
            fieldId: field.id,
            contentTypeName: contentType.name,
            fieldName: field.name,
            isAlreadyConfigured: false, // Always false since we filter these out
          });
        }
      });
    });

    return options;
  }, [contentTypesWithFields, isFieldAlreadyConfigured]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return fieldOptions;
    return fieldOptions.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [fieldOptions, inputValue]);

  // Convert selected IDs to pills (all selected items)
  const selectedPills = useMemo(() => {
    return selectedFieldIds
      .map((id) => {
        // First check if it's in fieldOptions (newly selected, not already configured)
        const option = fieldOptions.find((opt) => opt.id === id);
        if (option) {
          return { id: option.id, label: option.name };
        }

        // If not in fieldOptions, it might be an already configured item
        // We need to find it in the content types data
        for (const { contentType, fields } of contentTypesWithFields) {
          for (const field of fields) {
            if (`${contentType.sys.id}:${field.id}` === id) {
              return { id, label: `${contentType.name} > ${field.name}` };
            }
          }
        }

        return null;
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  }, [selectedFieldIds, fieldOptions, contentTypesWithFields]);

  const handleInputChange = useCallback(
    (value: string) => {
      setInputValue(value);
      if (searchable && value.length >= 2) {
        search(value);
      } else if (value.length === 0) {
        // Reset search when input is cleared
        search('');
      }
    },
    [search, searchable]
  );

  const handleSelectItem = useCallback(
    (item: ContentTypeFieldOption) => {
      const isSelected = selectedFieldIds.includes(item.id);
      const newSelection = isSelected ? selectedFieldIds.filter((id) => id !== item.id) : [...selectedFieldIds, item.id];

      onSelectionChange(newSelection);
    },
    [selectedFieldIds, onSelectionChange]
  );

  const handlePillRemove = useCallback(
    (pillId: string) => {
      // Allow removing any selected item
      const newSelection = selectedFieldIds.filter((id) => id !== pillId);
      onSelectionChange(newSelection);
    },
    [selectedFieldIds, onSelectionChange]
  );

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current = observer;

    if (lastItemRef.current) {
      observer.observe(lastItemRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMore]);

  // Show error state
  if (error) {
    return <Note variant="negative">Error loading content types and fields: {error}</Note>;
  }

  // Show loading state with progress
  if (loading && progress && progress.total > 0) {
    return (
      <Note variant="neutral" icon={<ClockIcon />}>
        <Flex flexDirection="column">
          <span>
            <Subheading>Loading content types</Subheading>
          </span>
          <span>
            {progress.processed} of {progress.total} completed
          </span>
        </Flex>
      </Note>
    );
  }

  return (
    <div>
      {/* Autocomplete */}
      <Autocomplete
        items={filteredOptions}
        onInputValueChange={handleInputChange}
        onSelectItem={handleSelectItem}
        placeholder={placeholder}
        isDisabled={disabled}
        itemToString={(item) => item.name}
        textOnAfterSelect="preserve"
        closeAfterSelect={false}
        showEmptyList
        listWidth="full"
        usePortal
        renderItem={(item) => (
          <Flex alignItems="center" gap="spacingXs" testId={`option-${item.id}`}>
            <Checkbox isChecked={selectedFieldIds.includes(item.id)} onChange={() => handleSelectItem(item)} />
            <Text fontWeight="fontWeightMedium">{item.name}</Text>
          </Flex>
        )}
      />

      {/* Selected pills below autocomplete */}
      {selectedPills.length > 0 && (
        <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingS">
          {selectedPills.map((pill: { id: string; label: string }) => (
            <Pill key={pill.id} label={pill.label} onClose={() => handlePillRemove(pill.id)} testId={`pill-${pill.id}`} />
          ))}
        </Flex>
      )}

      {/* Empty state */}
      {!loading && fieldOptions.length === 0 && renderEmptyState && <div style={{ marginTop: '8px' }}>{renderEmptyState()}</div>}
    </div>
  );
}
