import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Autocomplete, Pill, Text, Flex, Note, Spinner } from '@contentful/f36-components';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import type { ContentTypeProps } from 'contentful-management';
import { withTimeout, fetchAllContentTypes } from '../../utils/apiUtils';
import type { ContentTypeOption } from '../../types';

export interface SelectContentTypesProps {
  cma: ConfigAppSDK['cma'];
  selectedContentTypeIds: string[];
  onSelectionChange: (contentTypeIds: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  onProgress?: (processed: number, total: number) => void;
  renderEmptyState?: () => React.ReactNode;
}

export function SelectContentTypes({
  cma,
  selectedContentTypeIds,
  onSelectionChange,
  placeholder = 'Select content types...',
  disabled = false,
  onProgress,
  renderEmptyState,
}: SelectContentTypesProps) {
  const [inputValue, setInputValue] = useState('');
  const [contentTypes, setContentTypes] = useState<ContentTypeProps[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);

  // Fetch all content types on mount
  useEffect(() => {
    const loadContentTypes = async () => {
      setLoading(true);
      setError(null);

      try {
        const allContentTypes = await withTimeout(
          fetchAllContentTypes(cma, onProgress),
          120000 // 2 minute timeout
        );
        setContentTypes(allContentTypes as ContentTypeProps[]);
      } catch (err: any) {
        console.error('Failed to fetch content types:', err);
        setError(err.message || 'Failed to load content types');
      } finally {
        setLoading(false);
      }
    };

    loadContentTypes();
  }, [cma, onProgress]);

  // Convert content types to options
  const options = useMemo((): ContentTypeOption[] => {
    return contentTypes.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      description: contentType.description,
    }));
  }, [contentTypes]);

  // Filter options based on input (client-side filtering)
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;
    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(inputValue.toLowerCase()))
    );
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

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

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

  // Show error state
  if (error) {
    return <Note variant="negative">Error loading content types: {error}</Note>;
  }

  // Show loading state
  if (loading) {
    return (
      <Flex alignItems="center" gap="spacingS">
        <Spinner size="small" />
        <Text>Loading content types...</Text>
      </Flex>
    );
  }

  // Show empty state when no content types are available
  if (contentTypes.length === 0 && renderEmptyState) {
    return <div>{renderEmptyState()}</div>;
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
            <Text fontWeight="fontWeightMedium">{item.name}</Text>
            {item.description && (
              <Text fontSize="fontSizeS" fontColor="gray600">
                {item.description}
              </Text>
            )}
          </Flex>
        )}
      />

      {/* Selected pills below autocomplete */}
      {pills.length > 0 && (
        <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingS">
          {pills.map((pill) => (
            <Pill key={pill.id} label={pill.label} onClose={() => handlePillRemove(pill.id)} testId={`pill-${pill.id}`} />
          ))}
        </Flex>
      )}

      {/* Empty state for filtered results */}
      {!loading && filteredOptions.length === 0 && inputValue && renderEmptyState && <div style={{ marginTop: '8px' }}>{renderEmptyState()}</div>}
    </div>
  );
}
