import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Autocomplete, Checkbox, Flex, FormLabel, Note, Pill, Subheading, Text } from '@contentful/f36-components';
import { ClockIcon } from '@contentful/f36-icons';
import tokens from '@contentful/f36-tokens';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeFilter, FieldFilter } from './types';
import { filterContentTypes, filterFields } from '../../utils/contentTypeFilters';

export interface ContentTypeFieldItem {
  id: string;
  name: string; // "ContentTypeName > FieldName"
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isSelected: boolean;
}

export interface ContentTypeFieldSelectorProps {
  // Data
  contentTypes?: ContentTypeProps[];
  selectedFieldIds: string[]; // Array of field IDs that are selected
  contentTypesWithEditorInterfaces?: Array<{ contentType: ContentTypeProps; editorInterface: any }>;
  appDefinitionId?: string; // The app ID to check for in editor interfaces

  // Filtering
  contentTypeFilters?: ContentTypeFilter[];
  fieldFilters?: FieldFilter[];

  // Behavior
  multiSelect?: boolean;
  searchable?: boolean;
  loading?: boolean;
  loadingProgress?: { processed: number; total: number } | null; // Progress for large content models

  // Callbacks
  onSelectionChange: (selectedFieldIds: string[]) => void;

  // UI
  placeholder?: string;
  disabled?: boolean;
  error?: string;

  // Customization
  renderItem?: (item: ContentTypeFieldItem) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderErrorState?: (error: string) => React.ReactNode;
}

export function ContentTypeFieldSelector({
  contentTypes = [],
  selectedFieldIds = [],
  contentTypesWithEditorInterfaces = [],
  appDefinitionId,
  contentTypeFilters = [],
  fieldFilters = [],
  multiSelect = true,
  searchable = true,
  loading = false,
  loadingProgress = null,
  onSelectionChange,
  placeholder = 'Select fields...',
  disabled = false,
  error,
  renderItem,
  renderEmptyState,
  renderErrorState,
}: ContentTypeFieldSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  // Initialize selected fields from editor interfaces (only once)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (!hasInitializedRef.current && contentTypesWithEditorInterfaces.length > 0 && selectedFieldIds.length === 0 && appDefinitionId) {
      const preSelectedIds: string[] = [];

      for (const { contentType, editorInterface } of contentTypesWithEditorInterfaces) {
        if (editorInterface?.controls) {
          for (const control of editorInterface.controls) {
            if (control.widgetId === appDefinitionId) {
              const fieldId = `${contentType.sys.id}:${control.fieldId}`;
              preSelectedIds.push(fieldId);
            }
          }
        }
      }

      if (preSelectedIds.length > 0) {
        onSelectionChange(preSelectedIds);
      }

      hasInitializedRef.current = true;
    }
  }, [contentTypesWithEditorInterfaces, appDefinitionId, onSelectionChange]);

  // Filter content types first
  const filteredContentTypes = useMemo(() => {
    return filterContentTypes(contentTypes, contentTypeFilters);
  }, [contentTypes, contentTypeFilters]);

  // Flatten content types into field items
  const fieldItems = useMemo(() => {
    const items: ContentTypeFieldItem[] = [];

    for (const contentType of filteredContentTypes) {
      // Filter fields based on field filters
      const filteredFields = filterFields(contentType.fields, fieldFilters);

      for (const field of filteredFields) {
        const itemId = `${contentType.sys.id}:${field.id}`;

        // Determine if this field is selected based on the selectedFieldIds prop
        const isSelected = selectedFieldIds.includes(itemId);

        items.push({
          id: itemId,
          name: `${contentType.name} > ${field.name}`,
          contentTypeId: contentType.sys.id,
          contentTypeName: contentType.name,
          fieldId: field.id,
          fieldName: field.name,
          isSelected,
        });
      }
    }

    // Sort by content type name, then by field name
    return items.sort((a, b) => {
      const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
      return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
    });
  }, [filteredContentTypes, fieldFilters, selectedFieldIds]);

  // Filter items based on search input
  const filteredItems = useMemo(() => {
    if (!inputValue) return fieldItems;
    return fieldItems.filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [fieldItems, inputValue]);

  const handleSelectItem = useCallback(
    (item: ContentTypeFieldItem) => {
      if (multiSelect) {
        const newSelection = selectedFieldIds.includes(item.id) ? selectedFieldIds.filter((id) => id !== item.id) : [...selectedFieldIds, item.id];
        onSelectionChange(newSelection);
      } else {
        onSelectionChange([item.id]);
      }
    },
    [selectedFieldIds, multiSelect, onSelectionChange]
  );

  const handlePillRemove = useCallback(
    (itemId: string) => {
      const newSelection = selectedFieldIds.filter((id) => id !== itemId);
      onSelectionChange(newSelection);
    },
    [selectedFieldIds, onSelectionChange]
  );

  const handleRemoveItem = useCallback(
    (item: ContentTypeFieldItem) => {
      const newSelection = selectedFieldIds.filter((id) => id !== item.id);
      onSelectionChange(newSelection);
    },
    [selectedFieldIds, onSelectionChange]
  );

  const selectedItems = useMemo(() => {
    return fieldItems.filter((item) => item.isSelected);
  }, [fieldItems]);

  // Debug logging
  console.log('ContentTypeFieldSelector loading state:', {
    loading,
    loadingProgress,
    contentTypesCount: contentTypes?.length || 0,
    hasProgressData: !!loadingProgress,
  });

  // Show loading state
  if (loading) {
    // Only show custom loading UI if we have progress data (large content models)
    if (loadingProgress) {
      console.log('Showing detailed loading UI with progress:', loadingProgress);
      return (
        <Note variant="neutral" icon={<ClockIcon />}>
          <Flex flexDirection="column">
            <span>
              <Subheading>Loading content types</Subheading>
            </span>
            <span>
              {loadingProgress.processed} of {loadingProgress.total} completed
            </span>
          </Flex>
        </Note>
      );
    } else {
      // For small content models, don't show loading - let autocomplete render
      console.log('No progress data, skipping loading state');
      return null;
    }
  }

  // Show error state
  if (error) {
    return renderErrorState ? renderErrorState(error) : <div>Error: {error}</div>;
  }

  // Show empty state
  if (fieldItems.length === 0) {
    return renderEmptyState ? renderEmptyState() : <div>No fields found</div>;
  }

  return (
    <div>
      <FormLabel htmlFor="field-autocomplete">Select fields</FormLabel>
      <Autocomplete
        id="field-autocomplete"
        items={filteredItems}
        renderItem={(item) =>
          renderItem ? (
            renderItem(item)
          ) : (
            <Flex alignItems="center" gap={tokens.spacingXs}>
              <Checkbox
                value={item.id}
                id={item.id}
                data-test-id={`checkbox-${item.fieldId}`}
                isChecked={item.isSelected}
                isDisabled={false}
                onChange={() => handleSelectItem(item)}
              />
              <Text fontWeight="fontWeightMedium">{item.name}</Text>
            </Flex>
          )
        }
        onInputValueChange={setInputValue}
        onSelectItem={handleSelectItem}
        selectedItem={
          inputValue ? { id: '', name: inputValue, contentTypeId: '', contentTypeName: '', fieldId: '', fieldName: '', isSelected: false } : undefined
        }
        itemToString={(item) => item.name}
        textOnAfterSelect="preserve"
        closeAfterSelect={false}
        showEmptyList
        listWidth="full"
        usePortal
        isDisabled={disabled || fieldItems.length === 0}
        placeholder={placeholder}
      />

      {selectedItems.length > 0 && (
        <Flex gap={tokens.spacingXs} marginTop="spacingS" flexWrap="wrap">
          {selectedItems.map((item) => (
            <Pill key={item.id} label={item.name} onClose={() => handleRemoveItem(item)} testId={`pill-${item.fieldId}`} />
          ))}
        </Flex>
      )}
    </div>
  );
}
