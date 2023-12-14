import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import EntryTable from '../src/entry-table';
import { mockEntry } from './mock-entry';

describe('EntryTable', () => {
  afterEach(cleanup);

  it('renders EntryTable component', () => {
    const entry = mockEntry();
    const entryTitle = 'Test title';
    entry.fields.title['en-US'] = entryTitle;
    const entries = [entry];
    const mockFunction = () => {};
    const { getByText } = render(
      <EntryTable
        entries={entries}
        selected={[]}
        areAllSelected={false}
        onChangeAll={mockFunction}
        onCheckboxChange={mockFunction}
        isEntryDisabled={() => true}
        defaultLocale="en-US"
      />
    );
    expect(getByText(entryTitle)).toBeInTheDocument();
  });
});
