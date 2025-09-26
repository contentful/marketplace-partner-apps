import React, { useEffect, useState } from 'react';
import { Box, Stack, Pill } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';

export interface Tag {
  id: string;
  name: string;
}

interface TagMultiSelectProps {
  selectedTags: Tag[];
  setSelectedTags: (tags: Tag[]) => void;
  sdk: ConfigAppSDK;
  cma: CMAClient;
}

const TagMultiSelect: React.FC<TagMultiSelectProps> = ({ selectedTags, setSelectedTags, sdk, cma }) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredItems, setFilteredItems] = React.useState<Tag[]>([]);

  const getPlaceholderText = (): string => {
    if (loading) return 'Loading tags...';
    if (selectedTags.length === 0) return 'Select one or more tags';
    if (selectedTags.length === 1) return selectedTags[0]?.name || '';
    return `${selectedTags[0]?.name || ''} and ${selectedTags.length - 1} more`;
  };

  const handleSearchValueChange = (event: { target: { value: any } }) => {
    const value = event.target.value;
    const newFilteredItems = availableTags.filter((tag) => tag.name.toLowerCase().includes(value.toLowerCase()));
    setFilteredItems(newFilteredItems);
  };

  useEffect(() => {
    const loadTagsAndCurrentState = async () => {
      try {
        setLoading(true);

        const currentParameters = await sdk.app.getParameters();
        const currentTagIds = (currentParameters as any)?.reusableEntryTags || [];
        
        const response = await cma.tag.getMany({
          spaceId: sdk.ids.space,
          environmentId: sdk.ids.environment,
          query: {
            limit: 1000,
            order: 'name',
          },
        });

        const tags: Tag[] = response.items.map((tag) => ({
          id: tag.sys.id,
          name: tag.name,
        }));

        setAvailableTags(tags);
        setFilteredItems(tags);
        
        if (currentTagIds.length > 0) {
          const currentTags = tags.filter(tag => currentTagIds.includes(tag.id));
          setSelectedTags(currentTags);
        }
      } catch (error) {
        console.error('Error fetching tags:', error);
        setAvailableTags([]);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadTagsAndCurrentState();
  }, [sdk, cma, setSelectedTags]);

  return (
    <>
      <Stack marginTop="spacingXs" flexDirection="column" alignItems="start">
        <Multiselect
          searchProps={{
            searchPlaceholder: 'Search tags',
            onSearchValueChange: handleSearchValueChange,
          }}
          placeholder={getPlaceholderText()}>
          {filteredItems.map((item) => (
            <Multiselect.Option
              key={item.id}
              value={item.id}
              itemId={item.id}
              isChecked={selectedTags.some((tag) => tag.id === item.id)}
              onSelectItem={(e: React.ChangeEvent<HTMLInputElement>) => {
                const checked = e.target.checked;
                if (checked) {
                  setSelectedTags([...selectedTags, item]);
                } else {
                  setSelectedTags(selectedTags.filter((tag) => tag.id !== item.id));
                }
              }}>
              {item.name}
            </Multiselect.Option>
          ))}
        </Multiselect>

        {selectedTags.length > 0 && (
          <Box width="full" overflow="auto">
            <Stack flexDirection="row" spacing="spacingXs" flexWrap="wrap">
              {selectedTags.map((tag, index) => (
                <Pill
                  key={index}
                  label={tag.name}
                  isDraggable={false}
                  onClose={() => setSelectedTags(selectedTags.filter((t) => t.id !== tag.id))}
                />
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    </>
  );
};

export default TagMultiSelect;