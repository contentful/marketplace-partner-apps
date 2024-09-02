import React from 'react';
import { render } from '@testing-library/react';
import NoData from '@/components/UI/NoData'; 
import '@testing-library/jest-dom/extend-expect';

describe('NoData component', () => {
  it('renders correctly', () => {
    const { getByAltText, getByText, container } = render(<NoData />);

    expect(getByAltText('Logo')).toBeInTheDocument();
    expect(getByText('No data')).toBeInTheDocument();
  });
});
