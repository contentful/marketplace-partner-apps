import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { Notification } from '@contentful/f36-components';
import { useCMA, useSDK } from '@contentful/react-apps-toolkit';

import bwxApi from '../api/api';
import ConfigScreen from './ConfigScreen';

jest.mock('@contentful/react-apps-toolkit', () => ({
  useCMA: jest.fn(),
  useSDK: jest.fn(),
}));

jest.mock('@contentful/f36-components', () => {
  const actual = jest.requireActual('@contentful/f36-components');

  return {
    ...actual,
    Notification: {
      error: jest.fn(),
      success: jest.fn(),
    },
  };
});

jest.mock('@contentful/f36-image', () => ({
  Image: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

jest.mock('../api/api', () => ({
  __esModule: true,
  default: {
    getWorkflows: jest.fn(),
    login: jest.fn(),
  },
}));

jest.mock('../components/BwxConfigInput', () => ({
  __esModule: true,
  default: ({ configUuid, onInput }: { configUuid: string; onInput: (value: string) => void }) => (
    <label>
      Connector Config UUID
      <input
        aria-label="Connector Config UUID"
        value={configUuid}
        onChange={(event) => onInput(event.target.value)}
      />
    </label>
  ),
}));

jest.mock('../components/BwxMultiselectWorkflows', () => ({
  __esModule: true,
  default: ({
    onInput,
    workflowOptions,
    workflowsError,
    workflowsLoading,
    workflowsValue,
  }: {
    onInput: (value: string[]) => void;
    workflowOptions: { code: string; title?: string }[];
    workflowsError: boolean;
    workflowsLoading: boolean;
    workflowsValue: string[];
  }) => (
    <div>
      <div data-testid="workflow-options">Workflow options: {workflowOptions.length}</div>
      <div>Selected workflows: {workflowsValue.join(',')}</div>
      {workflowsLoading && <span>Loading workflows</span>}
      {workflowsError && <span>Failed to load workflows</span>}
      <button type="button" onClick={() => onInput(['workflow-a'])}>
        Select workflow
      </button>
    </div>
  ),
}));

interface InstallationParameters {
  apiKey: string;
  secretKey: string;
  configUuid: string;
  orgUnitUuid: string;
  contactUuid: string;
  workflows: string;
}

type ConfigureCallback = () => Promise<{ parameters: InstallationParameters }>;

const mockedUseSDK = useSDK as jest.MockedFunction<() => unknown>;
const mockedUseCMA = useCMA as jest.MockedFunction<() => unknown>;
const mockedBwxApi = bwxApi as unknown as jest.Mocked<Pick<typeof bwxApi, 'getWorkflows' | 'login'>>;
const mockedNotification = Notification as unknown as {
  error: jest.Mock;
  success: jest.Mock;
};

describe('ConfigScreen', () => {
  const cma = {};
  let configureCallback: ConfigureCallback;
  const sdk = {
    app: {
      getParameters: jest.fn(),
      onConfigure: jest.fn(),
      setReady: jest.fn(),
    },
  };

  beforeEach(() => {
    configureCallback = async () => {
      throw new Error('Configure callback was not registered');
    };

    mockedUseSDK.mockReturnValue(sdk);
    mockedUseCMA.mockReturnValue(cma);
    sdk.app.getParameters.mockResolvedValue(null);
    sdk.app.onConfigure.mockImplementation((callback: ConfigureCallback) => {
      configureCallback = callback;
    });
    mockedBwxApi.getWorkflows.mockResolvedValue([{ code: 'workflow-a', title: 'Workflow A' }]);
    mockedBwxApi.login.mockResolvedValue({ token: 'token' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads saved installation parameters and marks the app as ready', async () => {
    sdk.app.getParameters.mockResolvedValue({
      apiKey: 'saved-api-id',
      secretKey: 'saved-secret-key',
      configUuid: 'saved-config',
      orgUnitUuid: 'saved-org-unit',
      contactUuid: 'saved-contact',
      workflows: 'workflow-a',
    });

    render(<ConfigScreen />);

    await waitFor(() => {
      expect(sdk.app.setReady).toHaveBeenCalled();
    });
    expect(sdk.app.onConfigure).toHaveBeenCalledWith(expect.any(Function));
    expect(screen.getByDisplayValue('saved-api-id')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Test Connection' })).toBeEnabled();
  });

  it('rejects configuration when required values are missing', async () => {
    render(<ConfigScreen />);

    await waitFor(() => {
      expect(sdk.app.setReady).toHaveBeenCalled();
    });

    await expect(configureCallback()).rejects.toThrow('Invalid app configuration');
    expect(mockedNotification.error).toHaveBeenCalledWith(
      'Please fill in API ID, Secret Key, Connector Config UUID, and workflows.',
      { title: 'Invalid Configuration' }
    );
  });

  it('authenticates and returns trimmed installation parameters on configure', async () => {
    const { container } = render(<ConfigScreen />);

    await waitFor(() => {
      expect(sdk.app.setReady).toHaveBeenCalled();
    });

    const inputs = container.querySelectorAll('input');
    fireEvent.change(inputs[0], { target: { value: ' api-id ' } });
    fireEvent.change(inputs[1], { target: { value: ' secret-key ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Test Connection' }));

    await waitFor(() => {
      expect(mockedBwxApi.login).toHaveBeenCalledWith('api-id', 'secret-key', sdk, cma, false);
    });
    expect(mockedNotification.success).toHaveBeenCalledWith('Successfully authenticated with wxrks.');
    expect(await screen.findByText('Project Settings (2/2)')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId('workflow-options')).toHaveTextContent('Workflow options: 1');
    });

    fireEvent.change(screen.getByLabelText('Connector Config UUID'), {
      target: { value: ' config-id ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Select workflow' }));

    await waitFor(() => {
      expect(screen.getByText('Selected workflows: workflow-a')).toBeInTheDocument();
    });

    await expect(configureCallback()).resolves.toEqual({
      parameters: {
        apiKey: 'api-id',
        secretKey: 'secret-key',
        configUuid: 'config-id',
        orgUnitUuid: '',
        contactUuid: '',
        workflows: 'workflow-a',
      },
    });
  });
});
