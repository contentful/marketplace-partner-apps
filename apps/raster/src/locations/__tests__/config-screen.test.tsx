import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ConfigAppSDK } from '@contentful/app-sdk';
import { expect, vi, beforeEach } from 'vitest';
import ConfigScreen from '../ConfigScreen';
import { verifyApiKey } from '../../lib/client';
import { mockCma, defaultMockSdk } from '../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => defaultMockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../../lib/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/client')>()),
  verifyApiKey: vi.fn(),
}));

/** Runs the callback the screen last registered, as Contentful does on Install or Save. */
function configure() {
  const { calls } = vi.mocked((defaultMockSdk as unknown as ConfigAppSDK).app.onConfigure).mock;
  return calls[calls.length - 1][0]();
}

describe('Config Screen component', () => {
  beforeEach(() => {
    vi.mocked(verifyApiKey).mockReset();
    render(<ConfigScreen />);
  });

  it('Raster Logo', async () => {
    expect(screen.getByRole('img', { name: /Raster/i })).toBeInTheDocument();
  });

  it('Installation instructions text', async () => {
    expect(screen.getByText(/^Editors sign in to Raster with their own account/i)).toBeInTheDocument();
  });

  it('Organization ID Field', async () => {
    expect(screen.getByLabelText(/^Raster Organization Id/i)).toBeInTheDocument();
  });

  it('API Key Field', async () => {
    expect(screen.getByLabelText(/^Raster API Key/i)).toBeInTheDocument();
  });

  it('saves without a key, so editors sign in themselves', async () => {
    await userEvent.type(screen.getByLabelText(/^Raster Organization Id/i), ' acme ');

    expect(await configure()).toMatchObject({ parameters: { orgId: 'acme' } });
    expect(verifyApiKey).not.toHaveBeenCalled();
  });

  it('checks the key with Raster before saving it', async () => {
    await userEvent.type(screen.getByLabelText(/^Raster Organization Id/i), 'acme');
    await userEvent.type(screen.getByLabelText(/^Raster API Key/i), ' key ');

    expect(await configure()).toMatchObject({ parameters: { orgId: 'acme', apiKey: 'key' } });
    expect(verifyApiKey).toHaveBeenCalledWith('key', 'acme');
  });

  it('keeps the saved configuration when Raster refuses the key', async () => {
    vi.mocked(verifyApiKey).mockRejectedValue(new Error('Invalid API key'));
    await userEvent.type(screen.getByLabelText(/^Raster API Key/i), 'key');

    expect(await configure()).toBe(false);
    expect(defaultMockSdk.notifier.error).toHaveBeenCalled();
  });
});
