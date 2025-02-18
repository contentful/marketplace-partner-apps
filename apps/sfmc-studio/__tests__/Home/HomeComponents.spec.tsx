import React from 'react';
import { render, screen } from '@testing-library/react';
import Page from '../../src/app/components/Locations/Page';
import { useSDK } from '@contentful/react-apps-toolkit';

// Mocking the components
jest.mock('../../src/app/components/Locations/ConfigScreen', () => () => <div>ConfigScreen Component</div>);
jest.mock('../../src/app/components/Locations/Page', () => () => <div>Page Component</div>);

// Mocking useSDK hook
jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: jest.fn(),
}));

describe('HomeComponent', () => {
  it('renders Page component when location is LOCATION_ENTRY_SIDEBAR', () => {
    const mockUseSDK = useSDK as jest.Mock;
    mockUseSDK.mockReturnValue({
      location: {
        is: (location: string) => location === 'LOCATION_ENTRY_SIDEBAR',
      },
    });
    render(<Page />);
  });
});
