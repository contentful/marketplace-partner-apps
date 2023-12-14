import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { IconButton, Stack, TextInput } from '@contentful/f36-components';
import { CloseTrimmedIcon } from '@contentful/f36-icons';

const SearchBar = ({ onChange, onClear, placeholder }) => {
  const [query, setQuery] = useState('');

  const handleChange = event => {
    const newQuery = event.currentTarget.value.toLowerCase();
    setQuery(newQuery);
    onChange(newQuery);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <Stack spacing="none" className="vertical-padding" fullWidth>
      <TextInput value={query} onChange={handleChange} type="text" placeholder={placeholder} />
      <IconButton
        onClick={handleClear}
        variant="negative"
        label="Clear"
        icon={<CloseTrimmedIcon />}
      />
    </Stack>
  );
};

SearchBar.propTypes = {
  placeholder: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired
};

export default SearchBar;
