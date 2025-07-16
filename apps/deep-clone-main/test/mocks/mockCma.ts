import { vi } from 'vitest';

const mockCma = {
  contentType: {
    getMany: vi.fn().mockResolvedValue({ items: [] }),
  },
  entry: {
    create: vi.fn(),
    publish: vi.fn(),
  },
};

export { mockCma };
