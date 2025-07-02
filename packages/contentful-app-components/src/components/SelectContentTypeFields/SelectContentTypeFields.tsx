import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Autocomplete, Pill, Text, Flex, Note, Spinner, Subheading } from '@contentful/f36-components';
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
}

export const SelectContentTypeFields: React.FC<SelectContentTypeFieldsProps> = ({
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
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement | null>(null);

  const { contentTypesWithFields, loading, error, hasMore, loadMore, search, progress } = useContentTypeFields(cma, {
    contentTypeFilters,
    fieldFilters,
    appDefinitionId,
    onProgress,
  });

  // Convert content types with fields to field options
  const fieldOptions = useMemo((): ContentTypeFieldOption[] => {
    const options: ContentTypeFieldOption[] = [];

    contentTypesWithFields.forEach(({ contentType, editorInterface, fields }) => {
      fields.forEach((field) => {
        // Check if this field is already configured for the app
        const control = editorInterface.controls?.find((c: any) => c.fieldId === field.id);
        const isAlreadyConfigured = appDefinitionId ? control && control.widgetId === appDefinitionId : false;

        options.push({
          id: `${contentType.sys.id}:${field.id}`,
          name: `${contentType.name} > ${field.name}`,
          contentTypeId: contentType.sys.id,
          fieldId: field.id,
          contentTypeName: contentType.name,
          fieldName: field.name,
          isAlreadyConfigured,
        });
      });
    });

    return options;
  }, [contentTypesWithFields, appDefinitionId]);

  // Filter options based on input
  const filteredOptions = useMemo(() => {
    if (!inputValue) return fieldOptions;
    return fieldOptions.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [fieldOptions, inputValue]);

  // Convert selected IDs to pills
  const pills = useMemo(() => {
    return selectedFieldIds
      .map((id) => {
        const option = fieldOptions.find((opt) => opt.id === id);
        return option ? { id: option.id, label: option.name } : null;
      })
      .filter(Boolean) as Array<{ id: string; label: string }>;
  }, [selectedFieldIds, fieldOptions]);

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
    return <Note variant="negative">Error loading content types and fields: {error}</Note>;
  }

  // Show loading state with progress
  if (loading && progress) {
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
            {item.isAlreadyConfigured && (
              <Text fontSize="fontSizeS" fontColor="green600">
                (Already configured)
              </Text>
            )}
          </Flex>
        )}
      />

      {/* Empty state */}
      {!loading && fieldOptions.length === 0 && renderEmptyState && <div style={{ marginTop: '8px' }}>{renderEmptyState()}</div>}
    </div>
  );
};
