import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import * as React from "react";
import { AuthProvider, useAuth, type AuthContextType } from "./AuthContext";
import * as userSettings from "../utils/userSettings";
import {
  createMockAppConfig,
  createLoadingAppConfigMock,
  createErrorAppConfigMock,
  createInvalidAppConfigMock,
} from "../../test/utils/authTestHelpers";

// Create mock Auth0 client instance that will be shared
const mockAuthMethods = {
  isAuthenticated: vi.fn(),
  getTokenSilently: vi.fn(),
  getTokenWithPopup: vi.fn(),
  getUser: vi.fn(),
  loginWithPopup: vi.fn(),
  logout: vi.fn(),
};

// Mock the Auth0Client class
vi.mock("@auth0/auth0-spa-js", () => {
  return {
    Auth0Client: class {
      isAuthenticated = mockAuthMethods.isAuthenticated;
      getTokenSilently = mockAuthMethods.getTokenSilently;
      getTokenWithPopup = mockAuthMethods.getTokenWithPopup;
      getUser = mockAuthMethods.getUser;
      loginWithPopup = mockAuthMethods.loginWithPopup;
      logout = mockAuthMethods.logout;
    },
  };
});

// Mock user settings
vi.mock("../utils/userSettings", () => ({
  setApiKey: vi.fn(),
  clearAllUserSettings: vi.fn(),
  getUserSettings: vi.fn().mockReturnValue({ apiKey: null }),
}));

// Mock useAppConfig hook
const mockUseAppConfig = vi.fn();
vi.mock("../hooks/useAppConfig", () => ({
  useAppConfig: () =>
    mockUseAppConfig() as ReturnType<typeof import("../hooks/useAppConfig").useAppConfig>,
}));

/** Build an unsigned JWT carrying the given claims (e.g. org_id / org_name). */
function makeJwt(payload: Record<string, unknown>): string {
  const b64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  return `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.`;
}

// Test component that uses the auth context
const TestComponent = () => {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="loading">{auth.isLoading.toString()}</div>
      <div data-testid="authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="user-email">{(auth.user?.email as string) || "no-email"}</div>
      <div data-testid="token">{auth.token ? "has-token" : "no-token"}</div>
      <div data-testid="error">{auth.error || "no-error"}</div>
      <button onClick={() => auth.loginWithPopup()}>Login</button>
      <button onClick={() => auth.logout()}>Logout</button>
      <button onClick={() => auth.getAccessToken()}>Get Token</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default config
    mockUseAppConfig.mockReturnValue(createMockAppConfig());
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should throw error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      const Component = () => {
        useAuth();
        return null;
      };
      render(<Component />);
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleError.mockRestore();
  });

  it("should show loading state while config is loading", () => {
    mockUseAppConfig.mockReturnValue(createLoadingAppConfigMock());

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // The loading state should include config loading
    expect(screen.getByTestId("loading")).toHaveTextContent("true");
  });

  it("should handle configuration error from useAppConfig", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    mockUseAppConfig.mockReturnValue(createErrorAppConfigMock("Failed to load config"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("Failed to load config");
    expect(userSettings.setApiKey).toHaveBeenCalledWith(null);

    consoleError.mockRestore();
  });

  it("should handle missing auth0 config in appConfig", async () => {
    mockUseAppConfig.mockReturnValue(
      createMockAppConfig({
        config: {},
      }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent(
      "Failed to load authentication configuration",
    );
  });

  it("should handle invalid auth0 config (missing domain)", async () => {
    mockUseAppConfig.mockReturnValue(
      createMockAppConfig({
        config: {
          auth0: {
            domain: "",
            clientId: "test-client-id",
            audience: "test-audience",
          },
        },
      }),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("error")).toHaveTextContent("Invalid authentication configuration");
    expect(userSettings.setApiKey).toHaveBeenCalledWith(null);
  });

  it("should initialize with unauthenticated state", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-email")).toHaveTextContent("no-email");
    expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
    expect(userSettings.setApiKey).toHaveBeenCalledWith(null);
  });

  it("should restore authenticated session with token", async () => {
    const mockUser = { email: "test@example.com", sub: "user123" };
    const mockToken = "test-access-token";

    mockAuthMethods.isAuthenticated.mockResolvedValue(true);
    mockAuthMethods.getTokenSilently.mockResolvedValue(mockToken);
    mockAuthMethods.getUser.mockResolvedValue(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("token")).toHaveTextContent("has-token");
    expect(userSettings.setApiKey).toHaveBeenCalledWith(mockToken);
  });

  it("should clear session when token fetch fails (expired token)", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(true);
    mockAuthMethods.getTokenSilently.mockRejectedValue(new Error("Token expired"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // Should NOT be authenticated when token fetch fails (expired/invalid token)
    expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    expect(screen.getByTestId("user-email")).toHaveTextContent("no-email");
    expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    // Should clear localStorage when token is invalid
    expect(userSettings.clearAllUserSettings).toHaveBeenCalled();
  });

  it("should handle initialization error", async () => {
    mockAuthMethods.isAuthenticated.mockRejectedValue(new Error("Init error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("Init error");
  });

  it("should handle loginWithPopup successfully", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    const mockUser = { email: "test@example.com", sub: "user123" };
    const mockToken = "new-access-token";

    mockAuthMethods.loginWithPopup.mockResolvedValue(undefined);
    mockAuthMethods.getTokenSilently.mockResolvedValue(mockToken);
    mockAuthMethods.getUser.mockResolvedValue(mockUser);

    act(() => {
      fireEvent.click(screen.getByText("Login"));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId("user-email")).toHaveTextContent("test@example.com");
    expect(screen.getByTestId("token")).toHaveTextContent("has-token");
  });

  it("should handle loginWithPopup with getTokenSilently failure and fallback to getTokenWithPopup", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    const mockUser = { email: "test@example.com", sub: "user123" };
    const mockToken = "popup-token";

    mockAuthMethods.loginWithPopup.mockResolvedValue(undefined);
    mockAuthMethods.getTokenSilently.mockRejectedValue(new Error("Silent token error"));
    mockAuthMethods.getTokenWithPopup.mockResolvedValue(mockToken);
    mockAuthMethods.getUser.mockResolvedValue(mockUser);

    act(() => {
      fireEvent.click(screen.getByText("Login"));
    });

    await waitFor(
      () => {
        expect(mockAuthMethods.getTokenWithPopup).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
      },
      { timeout: 3000 },
    );
  });

  it("should handle loginWithPopup failure when both token methods fail", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <TestComponent />;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    mockAuthMethods.loginWithPopup.mockResolvedValue(undefined);
    mockAuthMethods.getTokenSilently.mockRejectedValue(new Error("Silent token error"));
    mockAuthMethods.getTokenWithPopup.mockRejectedValue(new Error("Popup token error"));

    // Assert that loginWithPopup rejects with the expected error
    await expect(authContext.loginWithPopup()).rejects.toThrow("Popup token error");

    // Verify the error is displayed in the UI
    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toHaveTextContent("Popup token error");
      },
      { timeout: 1000 },
    );
  });

  it("should handle loginWithPopup error", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <TestComponent />;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    mockAuthMethods.loginWithPopup.mockRejectedValue(new Error("Login failed"));

    // Assert that loginWithPopup rejects with the expected error
    await expect(authContext.loginWithPopup()).rejects.toThrow("Login failed");

    // Verify the error is displayed in the UI
    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toHaveTextContent("Login failed");
      },
      { timeout: 1000 },
    );
  });

  it("should handle loginWithPopup when auth0 client is not configured", async () => {
    mockUseAppConfig.mockReturnValue(createInvalidAppConfigMock());

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // The error is already set during initialization due to invalid config
    expect(screen.getByTestId("error")).toHaveTextContent("Invalid authentication configuration");
  });

  it("should throw error when loginWithPopup is called without auth0 client", async () => {
    // Use invalid config so auth0Ref stays null
    mockUseAppConfig.mockReturnValue(createInvalidAppConfigMock());

    let testError: unknown = null;
    let authContext!: AuthContextType;

    const TestComponentThatCapturesAuth = () => {
      authContext = useAuth();
      return <div>Test</div>;
    };

    render(
      <AuthProvider>
        <TestComponentThatCapturesAuth />
      </AuthProvider>,
    );

    // Wait for the error state to be set
    await waitFor(() => {
      expect(authContext.error).toBeTruthy();
    });

    // Try to call loginWithPopup and catch the error
    try {
      await authContext.loginWithPopup();
    } catch (e) {
      testError = e;
    }

    expect((testError as Error).message).toBe("Authentication is not configured");
  });

  it("should handle getAccessToken with auth0 client", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    const mockToken = "fresh-token";
    mockAuthMethods.getTokenSilently.mockResolvedValue(mockToken);

    act(() => {
      fireEvent.click(screen.getByText("Get Token"));
    });

    await waitFor(
      () => {
        expect(screen.getByTestId("token")).toHaveTextContent("has-token");
      },
      { timeout: 3000 },
    );

    expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
  });

  it("should handle getAccessToken failure and return stored key", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);
    vi.mocked(userSettings.getUserSettings).mockReturnValue({
      apiKey: "stored-token",
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    mockAuthMethods.getTokenSilently.mockRejectedValue(new Error("Token error"));

    act(() => {
      fireEvent.click(screen.getByText("Get Token"));
    });

    // Give it time to attempt token fetch and fall back to stored
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(userSettings.getUserSettings).toHaveBeenCalled();
  });

  it("should handle logout successfully", async () => {
    const mockUser = { email: "test@example.com", sub: "user123" };
    const mockToken = "test-access-token";

    mockAuthMethods.isAuthenticated.mockResolvedValue(true);
    mockAuthMethods.getTokenSilently.mockResolvedValue(mockToken);
    mockAuthMethods.getUser.mockResolvedValue(mockUser);
    mockAuthMethods.logout.mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("true");
    });

    act(() => {
      fireEvent.click(screen.getByText("Logout"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("user-email")).toHaveTextContent("no-email");
    expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    expect(userSettings.clearAllUserSettings).toHaveBeenCalled();
    expect(mockAuthMethods.logout).toHaveBeenCalledWith({ openUrl: false });
  });

  it("switchOrganization re-auths with the org param and updates the current org", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <div data-testid="org-name">{authContext.currentOrgName ?? "none"}</div>;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("org-name")).toHaveTextContent("none");
    });

    const orgToken = makeJwt({ org_id: "org_acme", org_name: "acme" });
    mockAuthMethods.loginWithPopup.mockResolvedValue(undefined);
    mockAuthMethods.getTokenSilently.mockResolvedValue(orgToken);
    mockAuthMethods.getUser.mockResolvedValue({ email: "test@example.com" });

    await act(async () => {
      await authContext.switchOrganization("org_acme");
    });

    expect(mockAuthMethods.loginWithPopup).toHaveBeenCalledWith({
      authorizationParams: { organization: "org_acme" },
    });
    expect(userSettings.setApiKey).toHaveBeenCalledWith(orgToken);

    await waitFor(() => {
      expect(screen.getByTestId("org-name")).toHaveTextContent("acme");
    });
  });

  it("switchOrganization surfaces an error and clears the switching flag on failure", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <div data-testid="switching">{authContext.isSwitchingOrg.toString()}</div>;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(authContext).toBeDefined();
    });

    mockAuthMethods.loginWithPopup.mockRejectedValue(new Error("Popup closed"));

    await expect(authContext.switchOrganization("org_acme")).rejects.toThrow("Popup closed");

    await waitFor(() => {
      expect(screen.getByTestId("switching")).toHaveTextContent("false");
    });
    expect(authContext.error).toBe("Popup closed");
  });

  it("switchOrganization throws and stays unauthenticated when no token is returned", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <TestComponent />;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // Popup "succeeds" but the silent token fetch yields nothing — the context
    // must not flip to isAuthenticated=true with a null token.
    mockAuthMethods.loginWithPopup.mockResolvedValue(undefined);
    mockAuthMethods.getTokenSilently.mockResolvedValue(null);
    mockAuthMethods.getUser.mockResolvedValue({ email: "test@example.com" });

    await expect(authContext.switchOrganization("org_acme")).rejects.toThrow(/no access token/i);

    await waitFor(() => {
      expect(screen.getByTestId("authenticated")).toHaveTextContent("false");
    });
    expect(screen.getByTestId("token")).toHaveTextContent("no-token");
    expect(authContext.isSwitchingOrg).toBe(false);
  });

  it("should handle non-Error exceptions during initialization", async () => {
    mockAuthMethods.isAuthenticated.mockRejectedValue("String error");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("String error");
  });

  it("should handle non-Error exceptions during login", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    let authContext!: AuthContextType;
    const TestComponentWithAuth = () => {
      authContext = useAuth();
      return <TestComponent />;
    };

    render(
      <AuthProvider>
        <TestComponentWithAuth />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    mockAuthMethods.loginWithPopup.mockRejectedValue("Login string error");

    // Assert that loginWithPopup rejects with the expected error
    await expect(authContext.loginWithPopup()).rejects.toBe("Login string error");

    // Verify the error is displayed in the UI
    await waitFor(
      () => {
        expect(screen.getByTestId("error")).toHaveTextContent("Login string error");
      },
      { timeout: 1000 },
    );
  });

  it("should cleanup on unmount", async () => {
    mockAuthMethods.isAuthenticated.mockResolvedValue(false);

    const { unmount } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    // Unmount should not cause any errors
    unmount();
  });
});
