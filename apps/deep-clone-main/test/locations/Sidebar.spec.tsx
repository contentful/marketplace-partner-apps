import React from 'react';
import { vi, describe, it, expect } from 'vitest';
import Sidebar from '../../src/locations/Sidebar';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Sidebar component', () => {
  it('Component text exists', () => {
    const { getByText } = render(<Sidebar />);

    expect(getByText('Clone')).toBeDefined();
  });
});
