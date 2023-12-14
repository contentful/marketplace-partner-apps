import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import SearchBar from '../src/search-bar';

describe('SearchBar', () => {
  afterEach(cleanup);

  it('renders SearchBar component', () => {
    const placeholder = 'Search...';
    const { getByPlaceholderText } = render(
      <SearchBar onChange={() => {}} onClear={() => {}} placeholder={placeholder} />
    );
    expect(getByPlaceholderText(placeholder)).toBeInTheDocument();
  });
});
