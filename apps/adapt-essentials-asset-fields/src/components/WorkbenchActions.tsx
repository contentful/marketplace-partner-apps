import { Button, Flex, Select, Stack, TextInput } from '@contentful/f36-components';
import { FilterIcon, PlusIcon } from '@contentful/f36-icons';
import { useDebounce } from '@uidotdev/usehooks';
import { useEffect, useState } from 'react';
import useQuery from './hooks/useQuery';
import { css } from 'emotion';
import tokens from '@contentful/f36-tokens';

export const WorkbenchActions = () => {
  const { query, setQuery } = useQuery();
  const [searchTerm, setSearchTerm] = useState(query);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const styles = {
    searchWrapper: css({
      border: `1px solid ${tokens.gray200}`,
      borderRadius: '0.3rem',
    }),
    searchInput: css({
      border: 'none',
    }),
    searchInputFilter: css({
      border: 'none',
      fontSize: '0.8rem',
      color: tokens.blue600,
      '&:hover': {
        color: tokens.blue600,
      },
    }),
    icon: css({
      border: `1px solid ${tokens.gray600}`,
      borderRadius: '50%',
    }),
    filterButton: css({
      border: `1px dashed ${tokens.gray600}`,
      borderRadius: '0.8rem',
      padding: '0.2rem 0.5rem 0.2rem 0.2rem',
      minHeight: '0',
      fontSize: '0.8rem',
      color: tokens.gray600,
      backgroundColor: tokens.gray100,
    }),
    filters: css({
      marginTop: '0.3rem',
    }),
  };

  useEffect(() => {
    setQuery(debouncedSearchTerm);
  }, [debouncedSearchTerm, setQuery]);

  return (
    <Flex flexDirection="column">
      <TextInput.Group className={styles.searchWrapper}>
        <Flex gap="1rem">
          <Flex>
            <Flex alignItems="center">filterName</Flex>
            <Select id="optionSelect-controlled" name="optionSelect-controlled" value={''}>
              <Select.Option value="optionOne">Option 1</Select.Option>
              <Select.Option value="optionTwo">Long Option 2</Select.Option>
            </Select>
            <Select id="optionSelect-controlled" name="optionSelect-controlled" value={''}>
              <Select.Option value="optionOne">Option 1</Select.Option>
              <Select.Option value="optionTwo">Long Option 2</Select.Option>
            </Select>
          </Flex>
          <Flex>
            <Flex alignItems="center">filterName</Flex>
            <Select id="optionSelect-controlled" name="optionSelect-controlled" value={''}>
              <Select.Option value="optionOne">Option 1</Select.Option>
              <Select.Option value="optionTwo">Long Option 2</Select.Option>
            </Select>
            <Select id="optionSelect-controlled" name="optionSelect-controlled" value={''}>
              <Select.Option value="optionOne">Option 1</Select.Option>
              <Select.Option value="optionTwo">Long Option 2</Select.Option>
            </Select>
          </Flex>
        </Flex>
        <TextInput
          id="search"
          name="search"
          className={styles.searchInput}
          placeholder="Type to search for assets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button variant="secondary" className={styles.searchInputFilter} startIcon={<FilterIcon />} onClick={() => {}} aria-label="Filter">
          Filter
        </Button>
      </TextInput.Group>
      <Stack className={styles.filters}>
        <Button variant="secondary" size="small" className={styles.filterButton} startIcon={<PlusIcon className={styles.icon} />}>
          Created by me
        </Button>
        <Button variant="secondary" className={styles.filterButton} startIcon={<PlusIcon className={styles.icon} />}>
          Status is
        </Button>
        <Button variant="secondary" className={styles.filterButton} startIcon={<PlusIcon className={styles.icon} />}>
          Tag is one of
        </Button>
      </Stack>
    </Flex>
  );
};
