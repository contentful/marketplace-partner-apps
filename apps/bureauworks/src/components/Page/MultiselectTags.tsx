import React, { useEffect, useState } from 'react';
import { useCMA } from '@contentful/react-apps-toolkit';

import { Stack } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';
import { TagProps } from 'contentful-management';

interface DashboardProps {
  onSelect: (data: string) => void;
}

export default function MultiselectSearchContentType({ onSelect }: DashboardProps) {
  const init: string[] = [];

  const cma = useCMA();
  useEffect(() => {
    const params: any = { 
      query: { 
        'limit': 1000
      }
    }
    cma.tag.getMany(params).then((result) => result?.items && setTags(result.items));
  }, []);
  
  const [tags, setTags] = useState<TagProps[]>([]);
  const [selectedItems, setSelectedItems] = React.useState(init);
  const [filteredItems, setFilteredItems] = React.useState(tags);
  const [tagsInit, setTagsState] = React.useState(tags);

  React.useEffect(() => {
    setTagsState([...tags])
    setFilteredItems([...tags])
  }, [tags]);

  React.useEffect(() => {
    const tagsQuery = selectedItems.join(",")
    onSelect(tagsQuery);
  }, [selectedItems]);

  const handleSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newFilteredItems = tagsInit.filter((item) =>
      item.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredItems(newFilteredItems);
  };

  const handleSelectItem = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { checked, value } = event.target;
    if (checked) {
      setSelectedItems((prevState) => [...prevState, value]);
    } else {
      const newSelectedItems = selectedItems.filter((item) => item !== value);
      setSelectedItems(newSelectedItems);
    }
  };

  return (
    <Stack flexDirection="column" alignItems="start">
      <Multiselect
        placeholder="Tags"
        searchProps={{
          searchPlaceholder: 'Search tags',
          onSearchValueChange: handleSearchValueChange,
        }}
        popoverProps={{ isFullWidth: true }}
        currentSelection={selectedItems}
      >
        {filteredItems.map((item, index) => {
          return (
            <Multiselect.Option
              value={item.sys.id}
              label={item.name}
              onSelectItem={handleSelectItem}
              key={`${item.sys.id}-${index}`}
              itemId={`${item.sys.id}-${index}`}
              isChecked={selectedItems.includes(item.sys.id)}
            />
          );
        })}
      </Multiselect>
    </Stack>
  );
}