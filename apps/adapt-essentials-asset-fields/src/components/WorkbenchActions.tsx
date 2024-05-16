import { Flex, TextInput } from '@contentful/f36-components';
import { useDebounce } from '@uidotdev/usehooks';
import { useEffect, useState } from 'react';
import useQuery from './hooks/useQuery';
import styles from './styles.module.css';

export const WorkbenchActions = () => {
  const { query, setQuery } = useQuery();
  const [searchTerm, setSearchTerm] = useState(query);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

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
