import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockCma, mockSdk } from '../../test/mocks';
import ConfigScreen from './ConfigScreen';
import { mockContentTypes } from '../../test/mocks/mockContentTypes';
import { mockWorkflows } from '../../test/mocks';
import { CONVOX_APP_ERROR_MESSAGES } from '../constants';
import { IAppInstallationParameters } from '../customTypes/IAppInstallationParameters';

type ConfigCallback = () => Promise<
  | false
  | {
    parameters: IAppInstallationParameters;
    targetState: {
      EditorInterface: Record<string, unknown>;
    };
  }
>;

// mock success authentication
const defaultMockHookReturn = {
  workflows: mockWorkflows,
  isAuthenticated: true,
  hasAuthError: false,
  isLoading: false,
  runWorkflow: vi.fn().mockResolvedValue('job-id')
};

// mock for authentication error
const authErrorMockReturn = {
  workflows: [],
  isAuthenticated: false,
  hasAuthError: true,
  isLoading: false,
  runWorkflow: vi.fn().mockResolvedValue(null)
};

// mock for loading state
const loadingMockReturn = {
  workflows: [],
  isAuthenticated: false,
  hasAuthError: false,
  isLoading: true,
  runWorkflow: vi.fn().mockResolvedValue(null)
};

// a variable to hold current mock return val
let currentMockReturn = defaultMockHookReturn;

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
  default: () => currentMockReturn
}));

vi.mock('../helpers/ContentTypesHelper', () => ({
  selectedContentTypesToTargetState: vi.fn().mockReturnValue({ contentType1: {} }),
  targetStateToSelectedContentTypes: vi.fn().mockReturnValue(['contentType1']),
}));

describe('ConfigScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    currentMockReturn = defaultMockHookReturn;

    mockSdk.app.onConfigure.mockImplementation((callback: ConfigCallback) => {
      mockSdk.configureCallback = callback;
      return callback;
    });

    mockSdk.app.isInstalled.mockResolvedValue(false);
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });
  });

  it('renders the app and sets ready', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });

  it('loads saved configuration when app is already installed', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);

    const savedParams = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Saved Workflow' },
          displayName: 'Saved Workflow'
        }
      ],
      convoxDeployKey: 'valid-key',
      selectedContentTypes: ['contentType1']
    };

    mockSdk.app.getParameters.mockResolvedValue(savedParams);

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });
  });

  it('validates configuration on save', async () => {
    currentMockReturn = {
      ...defaultMockHookReturn,
      workflows: []
    };

    render(<ConfigScreen />);

    await mockSdk.configureCallback();

    expect(mockSdk.notifier.error).toHaveBeenCalled();
  });

  it('shows authentication error when authentication fails', async () => {
    currentMockReturn = authErrorMockReturn;

    render(<ConfigScreen />);

    await mockSdk.configureCallback();

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      CONVOX_APP_ERROR_MESSAGES.AUTHENTICATION_DEPLOY_KEY_ERROR_MESSAGE
    );
  });

  it('shows loading message when validating key', async () => {
    currentMockReturn = loadingMockReturn;

    render(<ConfigScreen />);

    await mockSdk.configureCallback();

    expect(mockSdk.notifier.error).toHaveBeenCalledWith(
      "Please wait while we validate your authentication..."
    );
  });

  it('successfully configures app with valid settings', async () => {
    currentMockReturn = defaultMockHookReturn;

    const validConfig = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Test Workflow' },
          displayName: 'Test Workflow'
        }
      ],
      convoxDeployKey: 'valid-key',
      selectedContentTypes: ['contentType1']
    };

    mockSdk.app.getParameters.mockResolvedValue(validConfig);
    mockSdk.app.isInstalled.mockResolvedValue(true);

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    mockSdk.configureCallback = vi.fn().mockResolvedValue({
      parameters: validConfig,
      targetState: { EditorInterface: { contentType1: {} } }
    });

    const result = await mockSdk.configureCallback();

    expect(result).toBeTruthy();
    expect(mockSdk.notifier.error).not.toHaveBeenCalled();

    expect(result.parameters).toEqual(validConfig);
  });


  it('preserve content-type selection from existing configuration', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);
    mockSdk.app.getCurrentState.mockResolvedValue({
      EditorInterface: { contentType1: {}, contentType2: {} }
    });

    const existingConfig = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Existing Workflow' },
          displayName: 'Existing Workflow'
        }
      ],
      convoxDeployKey: 'existing-key',
      selectedContentTypes: ['contentType1', 'contentType2']
    };

    mockSdk.app.getParameters.mockResolvedValue(existingConfig);

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    mockSdk.configureCallback = vi.fn().mockResolvedValue({
      parameters: existingConfig,
      targetState: {
        EditorInterface: { contentType1: {}, contentType2: {} }
      }
    });

    const result = await mockSdk.configureCallback();

    expect(result).toBeTruthy();
    expect(result.parameters.selectedContentTypes).toEqual(['contentType1', 'contentType2']);
  });

  it('handles the first-time app installation with no existing config', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(false);
    mockSdk.app.getParameters.mockResolvedValue(null);
    mockSdk.app.getCurrentState.mockResolvedValue({ EditorInterface: {} });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const firstTimeConfig = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'New Workflow' },
          displayName: 'New Workflow'
        }
      ],
      convoxDeployKey: 'new-key',
      selectedContentTypes: ['contentType1']
    };

    mockSdk.configureCallback = vi.fn().mockResolvedValue({
      parameters: firstTimeConfig,
      targetState: { EditorInterface: { contentType1: {} } }
    });

    const result = await mockSdk.configureCallback();

    expect(result).toBeTruthy();
    expect(result.parameters).toEqual(firstTimeConfig);
  });

  it('updates workflow config correctly', async () => {
    mockSdk.app.isInstalled.mockResolvedValue(true);

    const initialConfig = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Initial Workflow' },
          displayName: 'Initial Workflow'
        }
      ],
      convoxDeployKey: 'valid-key',
      selectedContentTypes: ['contentType1']
    };

    mockSdk.app.getParameters.mockResolvedValue(initialConfig);

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(mockSdk.app.setReady).toHaveBeenCalled();
    });

    const updatedConfig = {
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Updated Workflow' },
          displayName: 'Updated Workflow'
        },
        {
          workflow: { id: 'workflow-2', name: 'New Workflow' },
          displayName: 'New Workflow'
        }
      ],
      convoxDeployKey: 'valid-key',
      selectedContentTypes: ['contentType1', 'contentType2']
    };

    mockSdk.configureCallback = vi.fn().mockResolvedValue({
      parameters: updatedConfig,
      targetState: {
        EditorInterface: { contentType1: {}, contentType2: {} }
      }
    });

    const result = await mockSdk.configureCallback();

    expect(result).toBeTruthy();
    expect(result.parameters.workflowConfigs.length).toBe(2);
    expect(result.parameters.workflowConfigs[0].displayName).toBe('Updated Workflow');
    expect(result.parameters.selectedContentTypes).toContain('contentType2');
  });
});
