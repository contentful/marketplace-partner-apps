import ConfigScreen from './ConfigScreen';
import { render, screen } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  it('renders the credential form', () => {
    render(<ConfigScreen />);

    expect(screen.getByText('Connect Alchemer')).toBeInTheDocument();
    expect(screen.getByText('API token')).toBeInTheDocument();
    expect(screen.getByText('API token secret')).toBeInTheDocument();
  });

  it('blocks install when credentials are missing', async () => {
    render(<ConfigScreen />);

    // Simulate the user clicking Install with empty credentials; onConfigure
    // must return false to abort and surface a notifier error.
    const result = await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(result).toBe(false);
    expect(mockSdk.notifier.error).toHaveBeenCalled();
  });
});
