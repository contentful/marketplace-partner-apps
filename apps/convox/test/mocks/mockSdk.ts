import { vi } from 'vitest';
// eslint-disable-next-line
const mockSdk: any = {
 app: {
    onConfigure: vi.fn().mockImplementation((callback) => {
      mockSdk.configureCallback = callback;
    }),
    isInstalled: vi.fn().mockResolvedValue(false),
    getParameters: vi.fn().mockResolvedValue(null),
    getCurrentState: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
  },
  parameters: {
    installation: {
      convoxDeployKey: 'test-key',
      workflowConfigs: [
        {
          workflow: { id: 'workflow-1', name: 'Workflow 1' },
          displayName: 'First Workflow'
        },
        {
          workflow: { id: 'workflow-2', name: 'Workflow 2' },
          displayName: 'Second Workflow'
        }
      ]
    }
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  configureCallback: vi.fn(),
};

export { mockSdk };
