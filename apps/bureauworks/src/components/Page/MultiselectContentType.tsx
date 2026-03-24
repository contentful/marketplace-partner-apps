import React from 'react';
import { ContentType } from '@contentful/app-sdk';

import { Stack } from '@contentful/f36-components';
import { Multiselect } from '@contentful/f36-multiselect';

interface DashboardProps {
  contentTypes: ContentType[];
  onSelect: (data: string) => void;
}

export default function MultiselectSearchContentType({ contentTypes, onSelect }: DashboardProps) {
  const init: string[] = [];

  const [selectedItems, setSelectedItems] = React.useState(init);
  const [filteredItems, setFilteredItems] = React.useState(contentTypes);
  const [contentTypesInit, setContentTypesState] = React.useState(contentTypes);

  React.useEffect(() => {
    setContentTypesState([...contentTypes])
    setFilteredItems([...contentTypes])
  }, [contentTypes]);

  React.useEffect(() => {
    const contentTypeQuery = selectedItems.join(",")
    onSelect(contentTypeQuery);
  }, [selectedItems]);

  const handleSearchValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const newFilteredItems = contentTypesInit.filter((item) =>
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
        placeholder="Content types"
        searchProps={{
          searchPlaceholder: 'Search content types',
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