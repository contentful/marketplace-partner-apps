import { vi } from 'vitest';

const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  parameters: {
    installation: {
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
      msToRedirect: 5000,
    },
  },
  ids: {
    app: 'test-app',
  },
};

export { mockSdk };
