import { vi } from "vitest";

const mockSdk: any = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockReturnValueOnce({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: "test-app",
  },
  parameters: {
    installation: {},
  },
  field: {
    getValue: vi.fn().mockReturnValue(undefined),
    setValue: vi.fn(),
  },
  window: {
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
  },
};

export { mockSdk };
