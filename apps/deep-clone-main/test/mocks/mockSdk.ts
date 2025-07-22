import { vi } from 'vitest';

const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
  },
  ids: {
    entry: 'test-entry',
  },
  parameters: {
    installation: {
      cloneText: 'Copy',
      cloneTextBefore: true,
      automaticRedirect: true,
    },
  },
  entry: {
    save: vi.fn(),
  },
  notifier: {
    success: vi.fn(),
  },
  navigator: {
    openEntry: vi.fn(),
  },
};

export { mockSdk };
