import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { mockCma, mockSdk } from '../mocks';
import ConfigScreen from '@/locations/ConfigScreen';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('ConfigScreen component', () => {
  it('renders the component', () => {
    const { getByText } = render(<ConfigScreen />);
    expect(getByText('App Config')).toBeInTheDocument();
  });

  it('displays default Growthbook Server URL', () => {
    const { getByDisplayValue } = render(<ConfigScreen />);
    expect(getByDisplayValue('https://api.growthbook.io')).toBeInTheDocument();
  });

  it('updates Growthbook Server URL on input change', () => {
    const { getByLabelText } = render(<ConfigScreen />);
    const input = getByLabelText('Growthbook API Server URL (defaults to Growthbook Cloud api.growthbook.io)', { selector: 'input' }) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'https://new-url.com' } });
    expect(input.value).toBe('https://new-url.com');
  });

  it('updates Growthbook API Key on input change, then obfuscates on blur, clears it on re-focus, an returns it to obfuscation if blurred again without modification', () => {
    const { getByLabelText } = render(<ConfigScreen />);
    const input = getByLabelText('Growthbook API Key') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-api-key' } });
    expect((input as HTMLInputElement).value).toBe('new-api-key');
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('***********');
    fireEvent.focus(input);
    expect((input as HTMLInputElement).value).toBe('');
    fireEvent.blur(input);
    expect((input as HTMLInputElement).value).toBe('***********');
  });

  it('updates Datasource Id on input change', () => {
    const { getByLabelText } = render(<ConfigScreen />);
    const input = getByLabelText('Datasource Id (The datasource that tracking data gets sent to)') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new-datasource-id' } });
    expect(input.value).toBe('new-datasource-id');
  });

  it('calls onConfigure when sdk.app.onConfigure is triggered', async () => {
    render(<ConfigScreen />);
    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });
    expect(mockSdk.app.onConfigure).toHaveBeenCalled();
  });

  it('sets parameters correctly', async () => {
    const { getByLabelText } = render(<ConfigScreen />);
    await act(async () => {
      await mockSdk.app.onConfigure.mock.calls[0][0]();
    });
    const serverInput = getByLabelText('Growthbook API Server URL (defaults to Growthbook Cloud api.growthbook.io)') as HTMLInputElement;
    const apiKeyInput = getByLabelText('Growthbook API Key') as HTMLInputElement;
    const datasourceIdInput = getByLabelText('Datasource Id (The datasource that tracking data gets sent to)') as HTMLInputElement;

    expect(serverInput.value).toBe('https://api.growthbook.io');
    expect(apiKeyInput.value).toBe('');
    expect(datasourceIdInput.value).toBe('');
  });
});
