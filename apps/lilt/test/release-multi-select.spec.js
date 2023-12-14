import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { mockSdk } from './mock-sdk';
import ReleaseMultiSelect from '../src/release-multi-select';

describe('ReleaseMultiSelect', () => {
  afterEach(cleanup);

  it('renders ReleaseMultiSelect component', () => {
    const sdk = mockSdk();
    const title = 'Select test';
    const handleSelect = () => {};
    const { getByText } = render(
      <ReleaseMultiSelect
        sdk={sdk}
        title={title}
        searchPlaceholder="Search by title"
        items={[]}
        onSelect={handleSelect}
      />
    );
    expect(getByText(title)).toBeInTheDocument();
  });
});
