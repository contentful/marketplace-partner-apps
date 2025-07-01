import React, { useCallback, useMemo, useState } from 'react';
import { Autocomplete, Checkbox, Flex, FormLabel, Pill, Text } from '@contentful/f36-components';
import { ContentTypeProps } from 'contentful-management';
import tokens from '@contentful/f36-tokens';
import { ContentTypeFilter } from './types';
import { filterContentTypes } from '../../utils/contentTypeFilters';

export interface ContentTypeItem {
  id: string;
  name: string;
  description?: string;
  isSelected: boolean;
  contentType: ContentTypeProps;
}

export interface ContentTypeSelectorProps {
  // Data
  contentTypes?: ContentTypeProps[];
  selectedContentTypeIds: string[]; // Array of content type IDs that are selected

  // Filtering
  contentTypeFilters?: ContentTypeFilter[];

  // Behavior
  multiSelect?: boolean;
  searchable?: boolean;
  loading?: boolean;

  // Callbacks
  onSelectionChange: (selectedContentTypeIds: string[]) => void;

  // UI
  placeholder?: string;
  disabled?: boolean;
  error?: string;

  // Customization
  renderItem?: (item: ContentTypeItem) => React.ReactNode;
  renderEmptyState?: () => React.ReactNode;
  renderErrorState?: (error: string) => React.ReactNode;
}

export function ContentTypeSelector({
  contentTypes = [],
  selectedContentTypeIds = [],
  contentTypeFilters = [],
  multiSelect = true,
  searchable = true,
  loading = false,
  onSelectionChange,
  placeholder = 'Select content types...',
  disabled = false,
  error,
  renderItem,
  renderEmptyState,
  renderErrorState,
}: ContentTypeSelectorProps) {
  const [inputValue, setInputValue] = useState('');

  // Filter content types
  const filteredContentTypes = useMemo(() => {
    return filterContentTypes(contentTypes, contentTypeFilters);
  }, [contentTypes, contentTypeFilters]);

  // Convert to items
  const contentTypeItems = useMemo(() => {
    return filteredContentTypes.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      description: contentType.description,
      isSelected: selectedContentTypeIds.includes(contentType.sys.id),
      contentType,
    }));
  }, [filteredContentTypes, selectedContentTypeIds]);

  // Filter items based on search input
  const filteredItems = useMemo(() => {
    if (!inputValue) return contentTypeItems;
    return contentTypeItems.filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [contentTypeItems, inputValue]);

  const handleSelectItem = useCallback(
    (item: ContentTypeItem) => {
      if (multiSelect) {
        const newSelection = selectedContentTypeIds.includes(item.id)
          ? selectedContentTypeIds.filter((id) => id !== item.id)
          : [...selectedContentTypeIds, item.id];
        onSelectionChange(newSelection);
      } else {
        onSelectionChange([item.id]);
      }
    },
    [selectedContentTypeIds, multiSelect, onSelectionChange]
  );

  const handlePillRemove = useCallback(
    (itemId: string) => {
      const newSelection = selectedContentTypeIds.filter((id) => id !== itemId);
      onSelectionChange(newSelection);
    },
    [selectedContentTypeIds, onSelectionChange]
  );

  const handleRemoveItem = useCallback(
    (item: ContentTypeItem) => {
      const newSelection = selectedContentTypeIds.filter((id) => id !== item.id);
      onSelectionChange(newSelection);
    },
    [selectedContentTypeIds, onSelectionChange]
  );

  const selectedItems = useMemo(() => {
    return contentTypeItems.filter((item) => item.isSelected);
  }, [contentTypeItems]);

  // Show loading state
  if (loading) {
    return (
      <Flex alignItems="center" gap={tokens.spacingS}>
        <div>Loading content types...</div>
      </Flex>
    );
  }

  // Show error state
  if (error) {
    return renderErrorState ? renderErrorState(error) : <div>Error: {error}</div>;
  }

  // Show empty state
  if (contentTypeItems.length === 0) {
    return renderEmptyState ? renderEmptyState() : <div>No content types found</div>;
  }

  return (
    <div>
      <FormLabel htmlFor="content-type-autocomplete">Select content types</FormLabel>
      <Autocomplete
        id="content-type-autocomplete"
        items={filteredItems}
        renderItem={(item) =>
          renderItem ? (
            renderItem(item)
          ) : (
            <Flex alignItems="center" gap={tokens.spacingXs}>
              <Checkbox
                value={item.id}
                id={item.id}
                data-test-id={`checkbox-${item.id}`}
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
        selectedItem={inputValue ? { id: '', name: inputValue, description: '', isSelected: false, contentType: {} as ContentTypeProps } : undefined}
        itemToString={(item) => item.name}
        textOnAfterSelect="preserve"
        closeAfterSelect={false}
        showEmptyList
        listWidth="full"
        usePortal
        isDisabled={disabled || contentTypeItems.length === 0}
        placeholder={placeholder}
      />

      {selectedItems.length > 0 && (
        <Flex gap={tokens.spacingXs} marginTop="spacingS" flexWrap="wrap">
          {selectedItems.map((item) => (
            <Pill key={item.id} label={item.name} onClose={() => handleRemoveItem(item)} testId={`pill-${item.id}`} />
          ))}
        </Flex>
      )}
    </div>
  );
}
