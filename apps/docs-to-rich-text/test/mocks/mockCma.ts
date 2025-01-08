import { vi } from 'vitest';
const mockCma: any = {
  space: {
    get: vi.fn(),
  },
  appDefinition: {
    get: vi.fn().mockReturnValue({ sys: { id: ""}}),
  },
  environment: {
    get: vi.fn(),
  },
  locale: {
    getMany: vi.fn(),
  },
  contentType:
  {
    getMany: vi.fn().mockReturnValue({items: []}),
  },
  editorInterface: {
    getMany: vi.fn().mockReturnValue({items: []}),
  }
};

export { mockCma };