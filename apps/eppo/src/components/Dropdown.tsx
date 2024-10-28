import { Autocomplete } from '@contentful/f36-components';
import React, { useCallback, useLayoutEffect, useRef } from 'react';

interface Item {
  id: number;
  name: string;
}

interface DropdownProps {
  items: Item[];
  selectedItem: Item | undefined;
  onSelectItem: (item: Item) => void;
  onClick: () => void;
  isLoading: boolean;
  isInvalid?: boolean;
}

export const Dropdown: React.FunctionComponent<DropdownProps> = (props) => {
  const { items, selectedItem, onSelectItem, onClick, isLoading, isInvalid } = props;

  const textInputRef: React.Ref<HTMLInputElement> = useRef<HTMLInputElement | null>(null);
  const toggleRef: React.Ref<HTMLButtonElement> = useRef<HTMLButtonElement | null>(null);

  const renderItem = useCallback((item: Item | null) => {
    return item?.name ?? 'Select';
  }, []);

  useLayoutEffect(() => {
    if (!selectedItem && textInputRef.current) {
      textInputRef.current.value = '';
    }
  }, [selectedItem]);

  if (textInputRef.current && toggleRef.current && onClick) {
    textInputRef.current.onclick = () => {
      onClick();
    };
    toggleRef.current.onclick = () => {
      onClick();
    };
  }

  return (
    <Autocomplete<Item>
      data-testid="default-entity"
      inputRef={textInputRef}
      toggleRef={toggleRef}
      placeholder="Select"
      items={items}
      renderItem={renderItem}
      itemToString={renderItem}
      selectedItem={selectedItem}
      onSelectItem={onSelectItem}
      textOnAfterSelect={'replace'}
      showClearButton={false}
      isRequired={true}
      isReadOnly={true}
      isLoading={isLoading}
      isInvalid={isInvalid}
    />
  );
};
