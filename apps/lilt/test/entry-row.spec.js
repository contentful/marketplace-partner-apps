import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import EntryRow from '../src/entry-row';
import { mockEntry } from './mock-entry';

describe('EntryRow', () => {
  afterEach(cleanup);

  it('renders EntryRow component', () => {
    const id = '12345';
    const entry = mockEntry();
    const title = 'Test title';
    entry.fields.title['en-US'] = title;
    const handleChange = () => {};
    const { getByText } = render(
      <EntryRow
        key={id}
        entry={entry}
        isSelected={true}
        isDisabled={false}
        onChange={handleChange}
        defaultLocale="en-US"
      />
    );
    expect(getByText(title)).toBeInTheDocument();
  });
});
