import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect, vi, beforeEach } from 'vitest';
import Dialog from '../Dialog';
import { mockDialog } from '../../../../test/mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockDialog,
}));

describe('Dialog component', () => {
  beforeEach(() => {
    render(<Dialog />);
  });

  it('Select Library: ', async () => {
    expect(screen.getByText(/^Select a library to view 👀 images/i)).toBeInTheDocument();
  });
});
