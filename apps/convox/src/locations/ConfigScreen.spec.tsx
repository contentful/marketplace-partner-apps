import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import { mockContentTypes } from '../../test/mocks/mockContentTypes';
import { mockWorkflows } from '../../test/mocks';
import { CONVOX_APP_ERROR_MESSAGES } from '../constants';

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
}));

vi.mock('../hooks/useContentTypes', () => ({
  useContentTypes: () => ({
    contentTypes: mockContentTypes,
    loading: false,
    error: null,
  }),
}));

vi.mock('../hooks/useWorkflows', () => ({
  default: (apiKey: string) => ({
    workflows: apiKey === 'valid-key' ? mockWorkflows : [],
    isAuthenticated: apiKey === 'valid-key',
    hasAuthError: apiKey === 'invalid-key',
    isLoading: false,
  }),
}));

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // eslint-disable-next-line
    mockSdk.app.onConfigure.mockImplementation((callback: () => Promise<any>) => {
      mockSdk.configureCallback = callback;
      return callback;
    });
  });

  it('renders initial configuration screen with Convox components', async () => {
    const { unmount } = render(<ConfigScreen />);

    expect(screen.getByText('Configure Convox Workflows')).toBeTruthy();

    expect(screen.getByText('Convox Deploy Key')).toBeTruthy();

    unmount();
  });

  it('shows workflow configuration when authenticated', async () => {
    const { unmount } = render(<ConfigScreen />);

    const deployKeyInput = screen.getByLabelText('Convox Deploy Key');
    fireEvent.change(deployKeyInput, { target: { value: 'valid-key' } });

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add workflows/i });
      expect(addButton.getAttribute('disabled')).toBeFalsy();
    });

    unmount();
  });

  it('shows validation error when trying to save without workflow configs', async () => {
    const { unmount } = render(<ConfigScreen />);

    const deployKeyInput = screen.getByLabelText('Convox Deploy Key');
    fireEvent.change(deployKeyInput, { target: { value: '123456' } });

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /Add workflows/i });
      expect(addButton.getAttribute('disabled')).toBeFalsy();
    });

    await mockSdk.configureCallback();

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      CONVOX_APP_ERROR_MESSAGES.REQUIRED_WORKFLOWS_ERROR_MESSAGE
    );

    unmount();
  });


  it('loads saved configuration when app is installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);
    mockSdk.app.getParameters.mockResolvedValue({
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Saved Workflow' },
          displayName: 'Saved Workflow'
        }
      ],
      convoxDeployKey: '123456',
      selectedContentTypes: ['contentType1', 'contentType2']
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });
});
