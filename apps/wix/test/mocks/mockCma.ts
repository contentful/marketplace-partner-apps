import { vi } from 'vitest';
const mockCma: any = {
  space: {
    get: vi.fn(),
  },
  environment: {
    get: vi.fn(),
  },
  locale: {
    getMany: vi.fn(),
  },
};

export { mockCma };
