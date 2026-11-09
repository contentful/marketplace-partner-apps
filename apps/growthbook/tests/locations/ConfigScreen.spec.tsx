import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '@/locations/ConfigScreen';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('ConfigScreen component', () => {
  let getByText: (text: string) => HTMLElement = () => {
    throw new Error('getByText is undefined');
  };

  let getByLabelText: (text: string) => HTMLElement = () => {
    throw new Error('getByLabelText is undefined');
  };

  let getByDisplayValue: (text: string) => HTMLElement = () => {
    throw new Error('getByDisplayValue is undefined');
  };

  it('renders the component', async () => {
    await act(async () => {
      ({ getByText } = render(<ConfigScreen />));
    });
    expect(getByText('App Config')).toBeInTheDocument();
  });

  it('displays default Growthbook Server URL', async () => {
    await act(async () => {
      ({ getByDisplayValue } = render(<ConfigScreen />));
    });
    expect(getByDisplayValue('https://api.growthbook.io')).toBeInTheDocument();
  });

  it('updates Growthbook Server URL on input change', async () => {
    await act(async () => {
      ({ getByLabelText } = render(<ConfigScreen />));
    });
    const input = getByLabelText('Growthbook API Server URL (defaults to Growthbook Cloud api.growthbook.io)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://new-url.com' } });
    expect(input.value).toBe('https://new-url.com');
  });

  it('updates Growthbook API Key on input change, then obfuscates on blur, clears it on re-focus, and returns it to obfuscation if blurred again without modification', async () => {
    await act(async () => {
      ({ getByLabelText } = render(<ConfigScreen />));
    });
    const input = getByLabelText('Growthbook API Key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-api-key' } });
    expect(input.value).toBe('new-api-key');
    fireEvent.blur(input);
    expect(input.value).toBe('***********');
    fireEvent.focus(input);
    expect(input.value).toBe('');
    fireEvent.blur(input);
    expect(input.value).toBe('***********');
  });

  it('updates Datasource Id on input change', async () => {
    await act(async () => {
      ({ getByLabelText } = render(<ConfigScreen />));
    });
    const input = getByLabelText('Datasource Id (The datasource that tracking data gets sent to)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-datasource-id' } });
    expect(input.value).toBe('new-datasource-id');
  });

  it('calls onConfigure when sdk.app.onConfigure is triggered', async () => {
    await act(async () => {
      render(<ConfigScreen />);
    });
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });
    const configureHandler =
      mockSdk.app.onConfigure.mock.calls[mockSdk.app.onConfigure.mock.calls.length - 1][0];
    const result = await configureHandler();
    expect(mockSdk.app.onConfigure).toHaveBeenCalled();
    expect(result).toMatchObject({
      parameters: expect.objectContaining({
        growthbookServerUrl: 'https://api.growthbook.io',
      }),
    });
  });

  it('sets parameters correctly', async () => {
    await act(async () => {
      ({ getByLabelText } = render(<ConfigScreen />));
    });
    await act(async () => {
      fireEvent.change(
        getByLabelText(
          'Growthbook API Server URL (defaults to Growthbook Cloud api.growthbook.io)'
        ),
        { target: { value: 'https://custom.example' } }
      );
      fireEvent.change(getByLabelText('Growthbook API Key'), {
        target: { value: 'secret-api-key' },
      });
      fireEvent.change(
        getByLabelText('Datasource Id (The datasource that tracking data gets sent to)'),
        { target: { value: 'ds-123' } }
      );
    });

    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });
    const configureHandler =
      mockSdk.app.onConfigure.mock.calls[mockSdk.app.onConfigure.mock.calls.length - 1][0];
    const result = await configureHandler();

    expect(result.parameters).toMatchObject({
      growthbookServerUrl: 'https://custom.example',
      growthbookAPIKey: 'secret-api-key',
      datasourceId: 'ds-123',
    });
  });
});
