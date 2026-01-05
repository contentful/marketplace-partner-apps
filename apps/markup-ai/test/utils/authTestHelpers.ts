import { vi } from "vitest";

type MockAuthReturn = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  token: string | null;
  error: string | null;
  loginWithPopup: ReturnType<typeof vi.fn>;
  getAccessToken: ReturnType<typeof vi.fn>;
  logout: ReturnType<typeof vi.fn>;
};

/**
 * Creates a mock auth return value for testing
 */
export const createMockAuthReturn = (overrides: Partial<MockAuthReturn> = {}): MockAuthReturn => ({
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
  loginWithPopup: vi.fn().mockResolvedValue(null),
  getAccessToken: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Creates an authenticated mock auth state
 */
export const createAuthenticatedMock = (overrides: Partial<MockAuthReturn> = {}): MockAuthReturn =>
  createMockAuthReturn({
    isAuthenticated: true,
    user: { email: "test@example.com", name: "Test User" },
    token: "test-token",
    loginWithPopup: vi.fn().mockResolvedValue("test-token"),
    getAccessToken: vi.fn().mockResolvedValue("test-token"),
    ...overrides,
  });

/**
 * Creates a loading mock auth state
 */
export const createLoadingAuthMock = (overrides: Partial<MockAuthReturn> = {}): MockAuthReturn =>
  createMockAuthReturn({
    isLoading: true,
    ...overrides,
  });

/**
 * Creates an error mock auth state
 */
export const createErrorAuthMock = (
  errorMessage: string,
  overrides: Partial<MockAuthReturn> = {},
): MockAuthReturn =>
  createMockAuthReturn({
    error: errorMessage,
    ...overrides,
  });

type MockAppConfig = {
  config: {
    auth0?: {
      domain: string;
      clientId: string;
      audience: string;
    };
  } | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * Creates a mock useAppConfig return value
 */
export const createMockAppConfig = (overrides?: Partial<MockAppConfig>): MockAppConfig => ({
  config: {
    auth0: {
      domain: "test-domain.auth0.com",
      clientId: "test-client-id",
      audience: "test-audience",
    },
  },
  isLoading: false,
  error: null,
  ...overrides,
});

/**
 * Creates a loading app config mock
 */
export const createLoadingAppConfigMock = (): MockAppConfig =>
  createMockAppConfig({
    config: null,
    isLoading: true,
  });

/**
 * Creates an error app config mock
 */
export const createErrorAppConfigMock = (error: string): MockAppConfig =>
  createMockAppConfig({
    config: null,
    error,
  });

/**
 * Creates an invalid (empty) auth0 config mock
 */
export const createInvalidAppConfigMock = (): MockAppConfig =>
  createMockAppConfig({
    config: {
      auth0: {
        domain: "",
        clientId: "",
        audience: "",
      },
    },
  });
