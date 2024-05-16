import { Flex, TextInput } from '@contentful/f36-components';
import { useDebounce } from '@uidotdev/usehooks';
import { useEffect, useState } from 'react';
import useQuery from './hooks/useQuery';

export const WorkbenchActions = () => {
  const { query, setQuery } = useQuery();
  const [searchTerm, setSearchTerm] = useState(query);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    setQuery(debouncedSearchTerm);
  }, [debouncedSearchTerm, setQuery]);

  return (
    <Flex gap="2rem" flex="4" alignItems="center">
      <TextInput
        style={{ maxWidth: '300px' }}
        id="search"
        name="search"
        placeholder="Search"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </Flex>
  );
};
