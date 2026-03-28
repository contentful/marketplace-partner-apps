import React, { useMemo, useState } from 'react';
import { Autocomplete, Flex, Pill, Text } from '@contentful/f36-components';
import { ContentType } from '../types';

interface ContentTypePickerProps {
  contentTypes: ContentType[];
  selectedContentTypeIds: string[];
  onSelectionChange: (contentTypeIds: string[]) => void;
  placeholder?: string;
}

interface ContentTypeOption {
  id: string;
  name: string;
  description?: string;
}

export const ContentTypePicker: React.FC<ContentTypePickerProps> = ({
  contentTypes,
  selectedContentTypeIds,
  onSelectionChange,
  placeholder = 'Select content types...',
}) => {
  const [inputValue, setInputValue] = useState('');

  const options = useMemo<ContentTypeOption[]>(
    () =>
      contentTypes.map((contentType) => ({
        id: contentType.sys.id,
        name: contentType.name,
        description: contentType.description,
      })),
    [contentTypes]
  );

  const filteredOptions = useMemo(() => {
    if (!inputValue) {
      return options;
    }

    const normalizedInput = inputValue.toLowerCase();

    return options.filter(
      (option) =>
        option.name.toLowerCase().includes(normalizedInput) ||
        option.id.toLowerCase().includes(normalizedInput) ||
        option.description?.toLowerCase().includes(normalizedInput)
    );
  }, [inputValue, options]);

  const pills = useMemo(
    () =>
      selectedContentTypeIds
        .map((id) => {
          const option = options.find((contentType) => contentType.id === id);
          return option ? { id: option.id, label: option.name } : null;
        })
        .filter(Boolean) as Array<{ id: string; label: string }>,
    [options, selectedContentTypeIds]
  );

  const handleSelectItem = (item: ContentTypeOption | null) => {
    if (!item) {
      return;
    }

    const nextSelection = selectedContentTypeIds.includes(item.id)
      ? selectedContentTypeIds.filter((id) => id !== item.id)
      : [...selectedContentTypeIds, item.id];

    onSelectionChange(nextSelection);
  };

  return (
    <div>
      <Autocomplete
        items={filteredOptions}
        onInputValueChange={setInputValue}
        onSelectItem={handleSelectItem}
        placeholder={placeholder}
        itemToString={(item) => item?.name ?? ''}
        textOnAfterSelect="clear"
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

      {pills.length > 0 && (
        <Flex gap="spacingXs" flexWrap="wrap" marginTop="spacingS">
          {pills.map((pill) => (
            <Pill key={pill.id} label={pill.label} onClose={() => onSelectionChange(selectedContentTypeIds.filter((id) => id !== pill.id))} />
          ))}
        </Flex>
      )}
    </div>
  );
};
