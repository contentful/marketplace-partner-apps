import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, vi, beforeEach } from 'vitest';
import Field from '../Field';
import { defaultMockSdk } from '../../../../test/mocks';

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
});
