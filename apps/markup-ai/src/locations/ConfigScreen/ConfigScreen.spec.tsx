import { describe, it, expect, vi, Mock, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test/utils/testUtils';
import ConfigScreen from './ConfigScreen';
import { useSDK } from '@contentful/react-apps-toolkit';
import { mockSdk } from '../../../test/mocks/mockSdk';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: vi.fn(),
}));

vi.mock('../../services/apiService', () => ({
  fetchStyleGuides: vi.fn().mockResolvedValue({ items: [], total: 0 }),
}));

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useSDK as unknown as Mock).mockReturnValue(mockSdk);
    mockSdk.app.getParameters.mockResolvedValue({ apiKey: 'x' });
    mockSdk.app.getCurrentState.mockResolvedValue({ some: 'state' });
    mockSdk.app.onConfigure.mockReset();
  });

  it('initializes parameters and calls setReady', async () => {
    render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.getParameters).toHaveBeenCalled());
    expect(mockSdk.app.setReady).toHaveBeenCalled();
    expect(screen.getByText('Configure the Markup AI App')).toBeInTheDocument();
  });

  it('registers onConfigure and returns parameters/current state', async () => {
    render(<ConfigScreen />);
    await waitFor(() => expect(mockSdk.app.onConfigure).toHaveBeenCalled());
    // Wait for parameters to be set and onConfigure re-registered
    await waitFor(() =>
      expect(
        (mockSdk.app.onConfigure as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
      ).toBeGreaterThanOrEqual(1),
    );
    const calls = (mockSdk.app.onConfigure as unknown as { mock: { calls: Array<[() => Promise<unknown>]> } }).mock
      .calls;
    const handler = calls[calls.length - 1][0];
    const res = await handler();
    expect(mockSdk.app.getCurrentState).toHaveBeenCalled();
    // After initial effect, local parameters are set to the getParameters result
    expect(res).toEqual({ parameters: { apiKey: 'x' }, targetState: { some: 'state' } });
  });
});
