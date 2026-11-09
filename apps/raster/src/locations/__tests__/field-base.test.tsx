import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, vi, beforeEach } from 'vitest';
import Field from '../Field';
import { defaultMockSdk } from '../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => defaultMockSdk,
}));

describe('Field component', () => {
  beforeEach(() => {
    render(<Field />);
  });

  it('Field initial state: no images', async () => {
    expect(screen.getByText(/Add Raster images/i)).toBeInTheDocument();
  });

  it('opens a dialog that grows with the picker and scrolls rather than hiding its buttons', async () => {
    await userEvent.click(screen.getByText(/Add Raster images/i));

    const [options] = vi.mocked(defaultMockSdk.dialogs.openCurrentApp).mock.calls[0];
    expect(options).toMatchObject({ allowHeightOverflow: true });
    expect(options).not.toHaveProperty('minHeight');
  });
});
