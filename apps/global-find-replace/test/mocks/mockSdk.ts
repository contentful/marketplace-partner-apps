import { vi } from 'vitest';

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: 'test-app',
  },
  locales: {
    names: {
      'en-US': 'English (United States)',
    },
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockResolvedValue({ items: [] }),
    },
  },
};

export { mockSdk };
