import { vi } from 'vitest';

const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'master',
  },
  parameters: {
    installation: {
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
      msToRedirect: 5000,
    },
    instance: {},
  },
  entry: {
    getSys: vi.fn().mockReturnValue({ id: 'test-entry' }),
    fields: {},
  },
  contentType: {
    getSys: vi.fn().mockReturnValue({ id: 'test-content-type' }),
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
  },
};

export { mockSdk };
