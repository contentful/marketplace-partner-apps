import { Button, Form, FormControl, TextInput } from '@contentful/f36-components';
import React from 'react';
import { useForm } from 'react-hook-form';
import PropTypes from 'prop-types';

const SearchForm = ({ searchForResourceName }) => {
  const { register, handleSubmit, reset } = useForm();

  const submitSearch = (data) => {
    searchForResourceName(data.resourceName);
  };

  const resetSearch = () => {
    searchForResourceName('');
    reset();
  };

  return (
    <Form style={{ paddingBottom: '2rem' }} onSubmit={handleSubmit(submitSearch)}>
      <FormControl>
        <FormControl.Label>Resource name</FormControl.Label>
        <TextInput {...register('resourceName')} />
      </FormControl>
      <Button style={{ marginRight: '1rem' }} size="small" variant="primary" type="submit">
        Search
      </Button>
      <Button size="small" variant="secondary" onClick={resetSearch}>
        Clear search results
      </Button>
    </Form>
  );
};

SearchForm.propTypes = {
  searchForResourceName: PropTypes.func,
};
export default SearchForm;
