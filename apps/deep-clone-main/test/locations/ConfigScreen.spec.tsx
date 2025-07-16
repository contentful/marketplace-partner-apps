import { describe, expect, it, vi } from 'vitest';
import ConfigScreen from '../../src/locations/ConfigScreen';
import { render } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import React from 'react';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0]?.[0]?.();

    expect(getByText('Clone Text')).toBeDefined();
  });
});
