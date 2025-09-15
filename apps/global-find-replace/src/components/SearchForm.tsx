import React from 'react';
import { Flex, FormLabel, TextInput, Select, Option, Button, Spinner, Popover, List, ListItem, Checkbox, Tooltip } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { ContentType, SearchFilters } from '../types';
import { HelpCircleIcon } from '@contentful/f36-icons';

interface SearchFormProps {
  filters: SearchFilters;
  contentTypes: ContentType[];
  locales: string[];
  searching: boolean;
  contentTypeDropdownOpen: boolean;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onSearch: () => void;
  onContentTypeDropdownToggle: () => void;
  onContentTypeDropdownClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export const SearchForm: React.FC<SearchFormProps> = ({
  filters,
  contentTypes,
  locales,
  searching,
  contentTypeDropdownOpen,
  onFiltersChange,
  onSearch,
  onContentTypeDropdownToggle,
  onContentTypeDropdownClose,
  anchorRef,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleContentTypeToggle = (contentTypeId: string) => {
    const isSelected = filters.selectedContentTypes.includes(contentTypeId);
    const newSelection = isSelected ? filters.selectedContentTypes.filter((id) => id !== contentTypeId) : [...filters.selectedContentTypes, contentTypeId];

    onFiltersChange({ selectedContentTypes: newSelection });
  };

  return (
    <Flex marginTop="spacingL" justifyContent="center">
      <Flex
        alignItems="flex-start"
        gap="spacingM"
        justifyContent="center"
        className={css({
          flexWrap: 'wrap',
          background: '#e8edf2',
          padding: '24px',
          borderRadius: '10px',
          display: 'inline-flex',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          maxWidth: '100%',
        })}>
        <Flex flexDirection="column">
          <FormLabel htmlFor="find">Find</FormLabel>
          <TextInput id="find" value={filters.find} onChange={(e) => onFiltersChange({ find: e.target.value })} onKeyDown={handleKeyDown} autoFocus />
          <Checkbox
            id="caseSensitive"
            isChecked={filters.caseSensitive}
            onChange={(e) => onFiltersChange({ caseSensitive: e.target.checked })}
            className={css({ marginTop: '12px' })}>
            Case sensitive
          </Checkbox>
        </Flex>

        <Flex flexDirection="column">
          <FormLabel htmlFor="replace">Replace</FormLabel>
          <TextInput id="replace" value={filters.replace} onChange={(e) => onFiltersChange({ replace: e.target.value })} onKeyDown={handleKeyDown} />
          <Flex flexDirection="row">
            <Checkbox
              id="includeAllFields"
              isChecked={filters.includeAllFields}
              onChange={(e) => onFiltersChange({ includeAllFields: e.target.checked })}
              className={css({ marginTop: '12px' })}>
              Include non-text fields
            </Checkbox>
            <Flex alignItems="end" marginLeft="spacingXs">
              <Tooltip placement="bottom" content="Includes numbers, dates, and other non-text fields in your search. This may slow down search performance">
                <HelpCircleIcon />
              </Tooltip>
            </Flex>
          </Flex>
        </Flex>

        <Flex flexDirection="column">
          <FormLabel htmlFor="contentTypes">Content Types</FormLabel>
          <Popover isOpen={contentTypeDropdownOpen} onClose={onContentTypeDropdownClose}>
            <Popover.Trigger>
              <Button variant="secondary" ref={anchorRef} className={css({ fontWeight: 'normal' })} onClick={onContentTypeDropdownToggle}>
                {filters.selectedContentTypes.length === 0 ? 'All Content Types' : `${filters.selectedContentTypes.length} selected`}
              </Button>
            </Popover.Trigger>

            <Popover.Content>
              <List
                className={css({
                  listStyle: 'none',
                  fontWeight: 'normal',
                  padding: 5,
                  margin: 0,
                })}>
                {contentTypes.map((ct) => {
                  const isChecked = filters.selectedContentTypes.includes(ct.sys.id);
                  return (
                    <ListItem key={ct.sys.id}>
                      <Checkbox isChecked={isChecked} onChange={() => handleContentTypeToggle(ct.sys.id)}>
                        {ct.name}
                      </Checkbox>
                    </ListItem>
                  );
                })}
              </List>
            </Popover.Content>
          </Popover>
        </Flex>

        <Flex flexDirection="column">
          <FormLabel htmlFor="locale">Locale</FormLabel>
          <Select id="locale" value={filters.locale} onChange={(e) => onFiltersChange({ locale: e.target.value })} className={css({ minWidth: '120px' })}>
            {locales.map((loc) => (
              <Option key={loc} value={loc}>
                {loc}
              </Option>
            ))}
          </Select>
        </Flex>

        <Flex flexDirection="column" alignSelf="center">
          <Button variant="primary" onClick={onSearch} isDisabled={searching}>
            {searching ? <Spinner size="small" /> : 'Search'}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};
