// src/components/ContentTypeSelector.tsx
import React, { useState, useContext } from 'react';
import { Button, FormControl, Autocomplete, Stack, Text } from '@contentful/f36-components';
import { ContentTypesContext } from '../contexts/ContentTypesContext';
import { ContentType, ContentTypeFilter } from '../types';

interface ContentTypeSelectorProps {
  onSelectContentType: (contentType: ContentType) => void;
  onLinkExisting: () => void;
  filter?: ContentTypeFilter;
}

export const ContentTypeSelector: React.FC<ContentTypeSelectorProps> = ({
  onSelectContentType,
  onLinkExisting,
  filter
}) => {
  const { getFilteredContentTypes, loading } = useContext(ContentTypesContext);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter content types as user types
  const filteredContentTypes = getFilteredContentTypes({
    ...filter,
    search: searchTerm
  });

  return (
    <Stack flexDirection="column" spacing="spacingM">
      <FormControl>
        <FormControl.Label htmlFor="content-type-autocomplete">Content Type</FormControl.Label>
        <Autocomplete
          id="content-type-autocomplete"
          items={filteredContentTypes}
          onInputValueChange={setSearchTerm}
          onSelectItem={(item) => {
            if (item) onSelectContentType(item);
          }}
          itemToString={(item) => (item ? item.name : '')}
          isLoading={loading}
          listMaxHeight={240}
          usePortal
          renderItem={(item) => (
            <Stack spacing="spacingXs">
              <Text fontWeight="fontWeightMedium">{item.name}</Text>
              <Text fontColor="gray600" fontSize="fontSizeS">ID: {item.sys.id}</Text>
            </Stack>
          )}
          inputValue={searchTerm}
        />
        <FormControl.HelpText>Select a content type to create a new entry</FormControl.HelpText>
      </FormControl>
      <Stack flexDirection="row" spacing="spacingM">
        <Button 
          variant="positive" 
          onClick={onLinkExisting}
          isDisabled={loading}
        >
          Link Existing Content
        </Button>
      </Stack>
    </Stack>
  );
};