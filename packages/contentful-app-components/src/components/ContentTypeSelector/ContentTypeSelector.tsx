import React, { useMemo, useState, useCallback } from 'react';
import { Autocomplete, Checkbox, Flex, Note, Text, Pill, FormLabel } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ContentTypeProps } from 'contentful-management';
import { ContentTypeSelectorProps, ContentTypeItem } from './types';
import { filterContentTypes, convertFieldTypeFilters } from '../../utils/contentTypeFilters';
import { useContentTypes } from '../../hooks/useContentTypes';

/**
 * ContentTypeSelector component for basic content type selection
 */
export function ContentTypeSelector({
  contentTypes: externalContentTypes,
  selectedContentTypes,
  filters = [],
  fieldTypeFilters = [],
  multiSelect = true,
  searchable = true,
  loading: externalLoading,
  onSelectionChange,
  onContentTypesLoad,
  placeholder = 'Select content types...',
  disabled = false,
  error,
  renderItem,
  renderEmptyState,
  renderLoadingState,
  renderErrorState,
}: ContentTypeSelectorProps) {
  const [inputValue, setInputValue] = useState<string>('');

  // Use external content types or fetch them using the hook
  const shouldUseHook = !externalContentTypes;
  const {
    contentTypes: hookContentTypes,
    loading: hookLoading,
    error: hookError,
    hasMore,
    loadMore,
    isLoadingMore,
  } = useContentTypes({
    filters: [...filters, ...convertFieldTypeFilters(fieldTypeFilters)],
  });

  const contentTypes = externalContentTypes || hookContentTypes;
  const loading = externalLoading !== undefined ? externalLoading : hookLoading;
  const errorMessage = error || hookError?.message;

  // Notify parent when content types are loaded
  React.useEffect(() => {
    if (onContentTypesLoad && contentTypes.length > 0) {
      onContentTypesLoad(contentTypes);
    }
  }, [contentTypes, onContentTypesLoad]);

  // Convert content types to items for the autocomplete
  const items = useMemo((): ContentTypeItem[] => {
    return contentTypes.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      description: contentType.description,
      isSelected: selectedContentTypes.includes(contentType.sys.id),
      contentType,
    }));
  }, [contentTypes, selectedContentTypes]);

  // Filter items based on search input
  const filteredItems = useMemo(() => {
    if (!inputValue) return items;
    return items.filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [items, inputValue]);

  // Auto-load more content types when needed
  const handleLoadMoreIfNeeded = useCallback(() => {
    if (shouldUseHook && hasMore && !isLoadingMore) {
      // If we have less than 50 items or the search results are limited, load more
      if (contentTypes.length < 50 || (inputValue && filteredItems.length < 20)) {
        loadMore();
      }
    }
  }, [shouldUseHook, hasMore, isLoadingMore, contentTypes.length, inputValue, filteredItems.length, loadMore]);

  // Auto-load more when search input changes and we need more results
  React.useEffect(() => {
    if (inputValue && shouldUseHook && hasMore && !isLoadingMore) {
      // If search results are limited, try to load more content types
      if (filteredItems.length < 20) {
        loadMore();
      }
    }
  }, [inputValue, shouldUseHook, hasMore, isLoadingMore, filteredItems.length, loadMore]);

  // Handle item selection
  const handleSelectItem = (item: ContentTypeItem) => {
    if (disabled) return;

    if (multiSelect) {
      const newSelection = item.isSelected ? selectedContentTypes.filter((id) => id !== item.id) : [...selectedContentTypes, item.id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(item.isSelected ? [] : [item.id]);
    }
  };

  // Handle pill removal
  const handleRemovePill = (contentTypeId: string) => {
    if (disabled) return;
    const newSelection = selectedContentTypes.filter((id) => id !== contentTypeId);
    onSelectionChange(newSelection);
  };

  // Default render functions
  const defaultRenderItem = (item: ContentTypeItem) => (
    <Flex alignItems="center" gap={tokens.spacingXs}>
      <Checkbox value={item.id} id={item.id} isChecked={item.isSelected} isDisabled={disabled} onChange={() => {}} />
      <Text fontWeight="fontWeightMedium">{item.name}</Text>
    </Flex>
  );

  const defaultRenderEmptyState = () => <Note variant="neutral">No content types found. Create a content type first to see it here.</Note>;

  const defaultRenderLoadingState = () => <Note variant="neutral">Loading content types...</Note>;

  const defaultRenderErrorState = (error: string) => <Note variant="negative">Error loading content types: {error}</Note>;

  // Show error state
  if (errorMessage) {
    return renderErrorState ? renderErrorState(errorMessage) : defaultRenderErrorState(errorMessage);
  }

  // Show loading state
  if (loading) {
    return renderLoadingState ? renderLoadingState() : defaultRenderLoadingState();
  }

  // Show empty state
  if (contentTypes.length === 0) {
    return renderEmptyState ? renderEmptyState() : defaultRenderEmptyState();
  }

  return (
    <div>
      <FormLabel htmlFor="content-type-selector">Content Types</FormLabel>

      <Autocomplete
        id="content-type-selector"
        items={filteredItems}
        renderItem={renderItem ? (item) => renderItem(item.contentType) : defaultRenderItem}
        onInputValueChange={(value) => {
          setInputValue(value);
          // Trigger load more if needed when user types
          setTimeout(handleLoadMoreIfNeeded, 100);
        }}
        onSelectItem={handleSelectItem}
        selectedItem={{ name: inputValue }}
        itemToString={(item) => item.name}
        textOnAfterSelect="preserve"
        closeAfterSelect={false}
        showEmptyList
        listWidth="full"
        usePortal
        isDisabled={disabled || contentTypes.length === 0}
        placeholder={placeholder}
        // Add a custom prop to handle scroll events if the Autocomplete component supports it
        // This would ideally be onScroll or similar, but we'll work with what's available
      />

      {/* Selected content types as pills */}
      {selectedContentTypes.length > 0 && (
        <Flex className="pills-row" marginTop="spacingM" gap="spacingXs" flexWrap="wrap">
          {items
            .filter((item) => item.isSelected)
            .map((item) => (
              <Pill key={item.id} label={item.name} onClose={() => handleRemovePill(item.id)} isDisabled={disabled} />
            ))}
        </Flex>
      )}
    </div>
  );
}
