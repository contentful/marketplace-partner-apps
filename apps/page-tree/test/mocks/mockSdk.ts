import { vi } from "vitest";

type MockAppSdk = {
  app: {
    onConfigure: () => void;
    getParameters: () => Promise<unknown>;
    setReady: () => void;
    getCurrentState: () => unknown;
  };
  ids: {
    app: string;
  };
};

export const mockSdk: MockAppSdk = {
  app: {
    onConfigure: vi.fn(),
    getParameters: vi.fn().mockResolvedValue({}),
    setReady: vi.fn(),
    getCurrentState: vi.fn(),
  },
  ids: {
    app: "test-app",
  },
};
