import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

import { SidebarExtension } from '../src/sidebar';
import { mockSdk } from './mock-sdk';

jest.mock('../src/contentful-management-client');
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ mockedData: 'mocked data' })
  })
);

describe('SidebarExtension', () => {
  it('renders component', async () => {
    const sdk = mockSdk();
    sdk.parameters.installation = { liltConnectorToken: 'testtoken' };
    const { findByText } = render(<SidebarExtension sdk={sdk} />);
    const button = await findByText('Send for Localization');
    expect(button).toBeInTheDocument();
  });

  it('renders ContentChangedWarning if source content has changed after submission', async () => {
    const sdk = mockSdk();
    sdk.parameters.installation = { liltConnectorToken: 'testtoken' };
    sdk.entry.fields.lilt_metadata.getValue = () => ({
      changed_since_sent: true
    });

    const { findByText } = render(<SidebarExtension sdk={sdk} />);
    const warning = await findByText('Warning');
    expect(warning).toBeInTheDocument();
  });
});
