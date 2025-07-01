import React, { useMemo, useState } from 'react';
import { Autocomplete, Checkbox, Flex, Note, Text, Pill, FormLabel, Subheading, Box } from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { ContentTypeProps, ContentFields } from 'contentful-management';
import { ContentTypeSelectorWithFieldsProps, ContentTypeItem, FieldItem } from './types';
import { filterContentTypes, filterFields, convertFieldTypeFilters } from '../../utils/contentTypeFilters';
import { useContentTypes } from '../../hooks/useContentTypes';
import { useContentTypeSelection } from '../../hooks/useContentTypeSelection';

/**
 * ContentTypeSelectorWithFields component for content type selection with field-level selection
 */
export function ContentTypeSelectorWithFields({
  contentTypes: externalContentTypes,
  selectedContentTypes,
  selectedFields,
  filters = [],
  fieldTypeFilters = [],
  fieldFilters = [],
  multiSelect = true,
  fieldMultiSelect = true,
  searchable = true,
  loading: externalLoading,
  onSelectionChange,
  onFieldSelectionChange,
  onContentTypesLoad,
  placeholder = 'Select content types...',
  disabled = false,
  error,
  renderItem,
  renderFieldItem,
  renderEmptyState,
  renderFieldEmptyState,
  renderLoadingState,
  renderErrorState,
  showFieldSelection = true,
}: ContentTypeSelectorWithFieldsProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [fieldInputValue, setFieldInputValue] = useState<string>('');

  // Use external content types or fetch them using the hook
  const {
    contentTypes: hookContentTypes,
    loading: hookLoading,
    error: hookError,
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
  const contentTypeItems = useMemo((): ContentTypeItem[] => {
    return contentTypes.map((contentType) => ({
      id: contentType.sys.id,
      name: contentType.name,
      description: contentType.description,
      isSelected: selectedContentTypes.includes(contentType.sys.id),
      contentType,
    }));
  }, [contentTypes, selectedContentTypes]);

  // Filter content type items based on search input
  const filteredContentTypeItems = useMemo(() => {
    if (!inputValue) return contentTypeItems;
    return contentTypeItems.filter((item) => item.name.toLowerCase().includes(inputValue.toLowerCase()));
  }, [contentTypeItems, inputValue]);

  // Get fields for selected content types
  const fieldItems = useMemo((): FieldItem[] => {
    const items: FieldItem[] = [];

    selectedContentTypes.forEach((contentTypeId) => {
      const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
      if (!contentType) return;

      // Apply field filters
      const filteredFields = filterFields(contentType.fields, fieldFilters);

      filteredFields.forEach((field) => {
        const isSelected = selectedFields[contentTypeId]?.includes(field.id) || false;
        items.push({
          id: field.id,
          name: field.name,
          type: field.type,
          isRequired: field.required || false,
          isLocalized: field.localized || false,
          isSelected,
          field,
        });
      });
    });

    return items;
  }, [selectedContentTypes, contentTypes, selectedFields, fieldFilters]);

  // Filter field items based on search input
  const filteredFieldItems = useMemo(() => {
    if (!fieldInputValue) return fieldItems;
    return fieldItems.filter((item) => item.name.toLowerCase().includes(fieldInputValue.toLowerCase()));
  }, [fieldItems, fieldInputValue]);

  // Handle content type selection
  const handleContentTypeSelect = (item: ContentTypeItem) => {
    if (disabled) return;

    if (multiSelect) {
      const newSelection = item.isSelected ? selectedContentTypes.filter((id) => id !== item.id) : [...selectedContentTypes, item.id];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(item.isSelected ? [] : [item.id]);
    }
  };

  // Handle field selection
  const handleFieldSelect = (item: FieldItem) => {
    if (disabled) return;

    const contentTypeId = selectedContentTypes.find((ctId) => {
      const contentType = contentTypes.find((ct) => ct.sys.id === ctId);
      return contentType?.fields.some((f) => f.id === item.id);
    });

    if (!contentTypeId) return;

    const currentFields = selectedFields[contentTypeId] || [];
    let newFields: string[];

    if (fieldMultiSelect) {
      if (item.isSelected) {
        newFields = currentFields.filter((id) => id !== item.id);
      } else {
        newFields = [...currentFields, item.id];
      }
    } else {
      newFields = item.isSelected ? [] : [item.id];
    }

    onFieldSelectionChange(contentTypeId, newFields);
  };

  // Handle content type pill removal
  const handleRemoveContentTypePill = (contentTypeId: string) => {
    if (disabled) return;
    const newSelection = selectedContentTypes.filter((id) => id !== contentTypeId);
    onSelectionChange(newSelection);
  };

  // Handle field pill removal
  const handleRemoveFieldPill = (contentTypeId: string, fieldId: string) => {
    if (disabled) return;
    const currentFields = selectedFields[contentTypeId] || [];
    const newFields = currentFields.filter((id) => id !== fieldId);
    onFieldSelectionChange(contentTypeId, newFields);
  };

  // Default render functions
  const defaultRenderContentTypeItem = (item: ContentTypeItem) => (
    <Flex alignItems="center" gap={tokens.spacingXs}>
      <Checkbox value={item.id} id={item.id} isChecked={item.isSelected} isDisabled={disabled} onChange={() => {}} />
      <Text fontWeight="fontWeightMedium">{item.name}</Text>
    </Flex>
  );

  const defaultRenderFieldItem = (item: FieldItem) => (
    <Flex alignItems="center" gap={tokens.spacingXs}>
      <Checkbox value={item.id} id={item.id} isChecked={item.isSelected} isDisabled={disabled} onChange={() => {}} />
      <Text fontWeight="fontWeightMedium">{item.name}</Text>
      <Text fontSize="fontSizeS">({item.type})</Text>
    </Flex>
  );

  const defaultRenderEmptyState = () => <Note variant="neutral">No content types found. Create a content type first to see it here.</Note>;

  const defaultRenderFieldEmptyState = () => <Note variant="neutral">No fields found for the selected content types.</Note>;

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
      {/* Content Type Selection */}
      <Box marginBottom="spacingL">
        <FormLabel htmlFor="content-type-selector">Content Types</FormLabel>

        <Autocomplete
          id="content-type-selector"
          items={filteredContentTypeItems}
          renderItem={renderItem ? (item) => renderItem(item.contentType) : defaultRenderContentTypeItem}
          onInputValueChange={setInputValue}
          onSelectItem={handleContentTypeSelect}
          selectedItem={undefined}
          itemToString={(item) => item.name}
          textOnAfterSelect="preserve"
          closeAfterSelect={false}
          showEmptyList
          listWidth="full"
          usePortal
          isDisabled={disabled || contentTypes.length === 0}
          placeholder={placeholder}
        />

        {/* Selected content types as pills */}
        {selectedContentTypes.length > 0 && (
          <Flex className="pills-row" marginTop="spacingM" gap="spacingXs" flexWrap="wrap">
            {contentTypeItems
              .filter((item) => item.isSelected)
              .map((item) => (
                <Pill key={item.id} label={item.name} onClose={() => handleRemoveContentTypePill(item.id)} />
              ))}
          </Flex>
        )}
      </Box>

      {/* Field Selection */}
      {showFieldSelection && selectedContentTypes.length > 0 && (
        <Box>
          <Subheading>Fields</Subheading>

          {fieldItems.length === 0 ? (
            renderFieldEmptyState ? (
              renderFieldEmptyState()
            ) : (
              defaultRenderFieldEmptyState()
            )
          ) : (
            <>
              <Autocomplete
                id="field-selector"
                items={filteredFieldItems}
                renderItem={renderFieldItem ? (item) => renderFieldItem(item.field, selectedContentTypes[0]) : defaultRenderFieldItem}
                onInputValueChange={setFieldInputValue}
                onSelectItem={handleFieldSelect}
                selectedItem={undefined}
                itemToString={(item) => item.name}
                textOnAfterSelect="preserve"
                closeAfterSelect={false}
                showEmptyList
                listWidth="full"
                usePortal
                isDisabled={disabled}
                placeholder="Select fields..."
              />

              {/* Selected fields as pills */}
              {Object.entries(selectedFields).map(([contentTypeId, fieldIds]) => {
                const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
                if (!contentType || fieldIds.length === 0) return null;

                return (
                  <Box key={contentTypeId} marginTop="spacingM">
                    <Text fontSize="fontSizeS" marginBottom="spacingXs">
                      {contentType.name}:
                    </Text>
                    <Flex gap="spacingXs" flexWrap="wrap">
                      {fieldIds.map((fieldId) => {
                        const field = contentType.fields.find((f) => f.id === fieldId);
                        if (!field) return null;

                        return <Pill key={fieldId} label={field.name} onClose={() => handleRemoveFieldPill(contentTypeId, fieldId)} />;
                      })}
                    </Flex>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      )}
    </div>
  );
}
