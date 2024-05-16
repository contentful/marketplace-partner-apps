import { Flex, TextInput } from '@contentful/f36-components';
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
  };

  useEffect(() => {
    setQuery(debouncedSearchTerm);
  }, [debouncedSearchTerm, setQuery]);

  return (
    <Flex flexDirection="column">
      <TextInput.Group className={styles.searchWrapper}>
        <TextInput
          id="search"
          name="search"
          className={styles.searchInput}
          placeholder="Type to search for assets"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </TextInput.Group>
    </Flex>
  );
};
