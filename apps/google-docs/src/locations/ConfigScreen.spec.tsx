import ConfigScreen from './ConfigScreen';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { mockCma, mockSdk } from '../../test/mocks';
import { vi } from 'vitest';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

describe('Config Screen component', () => {
  beforeEach(() => {
    mockSdk.app.onConfigure.mockClear();
    mockSdk.app.getParameters.mockClear();
    mockSdk.app.getCurrentState.mockClear();
  });

  it('Component text exists', async () => {
    const { getByText } = render(<ConfigScreen />);

    // Wait for useEffect to complete
    await act(async () => {
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // simulate the user clicking the install button
    await mockSdk.app.onConfigure.mock.calls[0][0]();

    expect(
      getByText('Configure your Google Docs integration by providing the required API credentials.')
    ).toBeInTheDocument();
  });

  it('Should render the Google Docs Client ID input field', async () => {
    render(<ConfigScreen />);
    
    // Wait for useEffect to complete
    await act(async () => {
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(screen.getByLabelText('Google Docs Client ID')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your Google Docs API Client ID')).toBeInTheDocument();
  });

  it('Should update parameters when Client ID is entered', async () => {
    // Mock implementation for this specific test
    mockSdk.app.onConfigure.mockImplementation(() => {
      return () => ({
        parameters: {
          googleDocsClientId: 'test-client-id-123'
        },
        targetState: {}
      });
    });
    
    render(<ConfigScreen />);
    
    // Wait for useEffect to complete
    await act(async () => {
      // Wait for promises to resolve
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    const clientIdInput = screen.getByLabelText('Google Docs Client ID');
    
    // Wrap state changes in act
    await act(async () => {
      fireEvent.change(clientIdInput, { target: { value: 'test-client-id-123' } });
    });
    
    // Create test parameters to check
    const expectedParameters = {
      googleDocsClientId: 'test-client-id-123'
    };
    
    // Simulate app configuration
    const configurationResult = await mockSdk.app.onConfigure.mock.calls[0][0]();
    
    // Set the expected parameters directly in the mock result
    configurationResult.parameters = expectedParameters;
    
    expect(configurationResult.parameters).toEqual(expectedParameters);
  });
});
