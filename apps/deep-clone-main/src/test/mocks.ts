import { vi } from 'vitest';

export const mockSdk = {
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
    installation: {},
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

export const mockCma = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  entry: {
    create: vi.fn(),
    publish: vi.fn(),
  },
};
