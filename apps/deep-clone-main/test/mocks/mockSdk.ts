import { vi } from 'vitest';
import { mockCma } from './mockCma';

const mockSdk = {
  cma: mockCma,
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
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
    error: vi.fn(),
  },
  navigator: {
    openEntry: vi.fn(),
  },
};

export { mockSdk };
