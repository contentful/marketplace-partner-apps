import type { Meta, StoryObj } from '@storybook/react';
import { SearchBar as SearchBarComponent, SearchBarProps } from '.';

import { useState } from 'react';

export default {
  title: 'Locations/Page/BulkEditor',
  component: SearchBarComponent,
} satisfies Meta<typeof SearchBarComponent>;

type Story = StoryObj<SearchBarProps>;

export const SearchBar: Story = {
  render: () => {
    const [search, setSearch] = useState('');

    return (
      <SearchBarComponent
        search={search}
        onSearch={setSearch}
        contentTypeOptions={{
          recipe: 'Recipe',
          page: 'Page',
        }}
        userOptions={{
          john: 'John',
          jane: 'Jane',
        }}
        onFilterChange={console.log}
      />
    );
  },
};
