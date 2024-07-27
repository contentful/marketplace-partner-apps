import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, vi, beforeEach } from 'vitest';
import Field from '../Field';
import { mockSdkWithImage } from '../../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdkWithImage,
}));

describe('Field component', () => {
  beforeEach(() => {
    render(<Field />);
  });

  it('Field initial state: with images ', async () => {
    expect(screen.getByText(/^Add More Images$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Barcelona Beach$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Barcelona Beach at sunset$/i)).toBeInTheDocument();
  });
});
