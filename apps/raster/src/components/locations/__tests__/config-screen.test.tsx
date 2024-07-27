import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, vi, beforeEach } from 'vitest';
import ConfigScreen from '../ConfigScreen';
import { mockCma, defaultMockSdk } from '../../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => defaultMockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    render(<ConfigScreen />);
  });

  it('Raster Logo', async () => {
    expect(screen.getByRole('img', { name: /Raster/i })).toBeInTheDocument();
  });

  it('Installation instructions text', async () => {
    expect(screen.getByText(/^To utilize the Raster plugin, you must configure it/i)).toBeInTheDocument();
  });

  it('Organization ID Field', async () => {
    expect(screen.getByLabelText(/^Organization Id/i)).toBeInTheDocument();
  });

  it('API Key Field', async () => {
    expect(screen.getByLabelText(/^API Key/i)).toBeInTheDocument();
  });
});
