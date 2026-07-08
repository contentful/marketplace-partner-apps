import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfigScreen from './ConfigScreen';

jest.mock('../utils', () => ({
  validateCredentials: jest.fn(),
}));

describe('ConfigScreen', () => {
  const updateCredentials = jest.fn();

  const sdk = {
    app: {
      getParameters: jest.fn().mockResolvedValue({}),
      getCurrentState: jest.fn().mockResolvedValue({}),
      setReady: jest.fn(),
      onConfigure: jest.fn(),
      onConfigurationCompleted: jest.fn(),
      isInstalled: jest.fn().mockResolvedValue(false),
    },
    space: {
      getContentTypes: jest.fn().mockResolvedValue({ items: [] }),
    },
    locales: {
      default: 'en-US',
    },
    notifier: {
      error: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sdk.app.getParameters.mockResolvedValue({});
    sdk.app.getCurrentState.mockResolvedValue({});
    sdk.app.isInstalled.mockResolvedValue(false);
    sdk.space.getContentTypes.mockResolvedValue({ items: [] });
  });

  it('renders the configuration form before Wingify is connected', async () => {
    render(
      <ConfigScreen
        sdk={sdk}
        accessToken=""
        accountId=""
        updateCredentials={updateCredentials}
      />
    );

    await waitFor(() => {
      expect(sdk.app.setReady).toHaveBeenCalled();
    });

    expect(screen.getByRole('heading', { name: 'Configuration' })).toBeInTheDocument();
    expect(screen.getByText('Account ID')).toBeInTheDocument();
    expect(screen.getByText('API Key')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect with Wingify' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open Wingify' })).toHaveAttribute(
      'href',
      'https://app.wingify.com/'
    );
  });

  it('renders the install step after Wingify credentials are connected', async () => {
    render(
      <ConfigScreen
        sdk={sdk}
        accessToken="connected-token"
        accountId="account-123"
        updateCredentials={updateCredentials}
      />
    );

    await waitFor(() => {
      expect(sdk.app.setReady).toHaveBeenCalled();
    });

    expect(screen.getByRole('heading', { name: 'Just one more step!' })).toBeInTheDocument();
    expect(
      screen.getByText(/To complete setup, click 'Install' in the top-right corner/i)
    ).toBeInTheDocument();
  });
});
