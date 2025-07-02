import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Autocomplete, Pill, Text, Flex, Note, Spinner } from '@contentful/f36-components';
import { useContentTypes } from '../../hooks/useContentTypes';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeFilter, ContentTypeOption } from '../../types';

export interface SelectContentTypesProps {
  cma: ConfigAppSDK['cma'];
  selectedContentTypeIds: string[];
  onSelectionChange: (contentTypeIds: string[]) => void;
  filters?: ContentTypeFilter[];
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  onProgress?: (processed: number, total: number) => void;
  renderEmptyState?: () => React.ReactNode;
}

export const SelectContentTypes: React.FC<SelectContentTypesProps> = ({
  cma,
  selectedContentTypeIds,
  onSelectionChange,
  filters = [],
  placeholder = 'Select content types...',
  disabled = false,
  searchable = true,
  onProgress,
  renderEmptyState,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const { contentTypes, loading, error, hasMore, loadMore, search } = useContentTypes(cma, {
    filters,
    onProgress,
  });

  // Convert content types to options
  const options = useMemo((): ContentTypeOption[] => {
    return contentTypes.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      description: contentType.description,
    }));
  }, [contentTypes]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [options, inputValue]);

  // Convert selected IDs to pills
  const pills = useMemo(() => {
    return selectedContentTypeIds
      .map((id) => {
        const option = options.find((opt) => opt.id === id);
        return option ? { id: option.id, label: option.name } : null;
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  }, [selectedContentTypeIds, options]);

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
    (item: ContentTypeOption) => {
      const isSelected = selectedContentTypeIds.includes(item.id);
      const newSelection = isSelected ? selectedContentTypeIds.filter((id) => id !== item.id) : [...selectedContentTypeIds, item.id];

      onSelectionChange(newSelection);
    },
    [selectedContentTypeIds, onSelectionChange]
  );

  const handlePillRemove = useCallback(
    (pillId: string) => {
      const newSelection = selectedContentTypeIds.filter((id) => id !== pillId);
      onSelectionChange(newSelection);
    },
    [selectedContentTypeIds, onSelectionChange]
  );

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
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
    return <Note variant="negative">Error loading content types: {error}</Note>;
  }

  return (
    <div>
      {/* Selected pills */}
      {pills.length > 0 && (
        <Flex gap="spacingXs" flexWrap="wrap" marginBottom="spacingS">
          {pills.map((pill) => (
            <Pill key={pill.id} label={pill.label} onClose={() => handlePillRemove(pill.id)} testId={`pill-${pill.id}`} />
          ))}
        </Flex>
      )}

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
            <Text fontWeight="fontWeightMedium">{item.name}</Text>
            {item.description && (
              <Text fontSize="fontSizeS" fontColor="gray600">
                {item.description}
              </Text>
            )}
          </Flex>
        )}
      />

      {/* Empty state */}
      {!loading && options.length === 0 && renderEmptyState && <div style={{ marginTop: '8px' }}>{renderEmptyState()}</div>}
    </div>
  );
};
