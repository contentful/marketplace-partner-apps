import { vi } from 'vitest';

export const mockSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn().mockResolvedValue({}),
    onConfigurationCompleted: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  cma: {
    contentType: {
      getMany: vi.fn(),
    },
    editorInterface: {
      get: vi.fn(),
      update: vi.fn(),
    },
  },
  notifier: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
};

export type MockSdk = typeof mockSdk;
