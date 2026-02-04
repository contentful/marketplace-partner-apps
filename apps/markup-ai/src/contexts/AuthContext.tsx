import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Auth0Client, PopupLoginOptions } from "@auth0/auth0-spa-js";
import { getUserSettings, setApiKey, clearAllUserSettings } from "../utils/userSettings";
import { useAppConfig } from "../hooks/useAppConfig";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  token: string | null;
  error: string | null;
};

export type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  token: string | null;
  error: string | null;
  loginWithPopup: (options?: PopupLoginOptions) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Removed getAuthConfig function - now using useAppConfig hook

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const auth0Ref = useRef<Auth0Client | null>(null);
  const [{ isLoading, isAuthenticated, user, token, error }, setState] = useState<AuthState>(
    () => ({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    }),
  );

  // Fetch configuration from API instead of environment variables
  const { config: appConfig, isLoading: configLoading, error: configError } = useAppConfig();

  // Helper: Handle config errors and invalid config
  const handleConfigError = useCallback((mounted: boolean, error?: string | null) => {
    console.error("[Auth] Configuration error:", error);
    setApiKey(null);
    if (mounted) {
      setState((s) => ({
        ...s,
        isLoading: false,
        isAuthenticated: false,
        token: null,
        error: error || "Failed to load authentication configuration",
      }));
    }
  }, []);

  // Helper: Restore authenticated session
  const restoreSession = useCallback(async (auth0Client: Auth0Client, mounted: boolean) => {
    // Helper: Clear session when token is invalid/expired
    const clearSession = () => {
      clearAllUserSettings();
      if (mounted) {
        setState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          token: null,
          error: null,
        });
      }
    };

    let accessToken: string | null = null;
    try {
      const t = await auth0Client.getTokenSilently();
      accessToken = t;
    } catch (err) {
      // Token fetch failed - token is expired or invalid
      console.warn("[Auth] Failed to restore session, token may be expired:", err);
      clearSession();
      return;
    }

    // Only proceed if we successfully got a valid token
    if (!accessToken) {
      clearSession();
      return;
    }

    const userInfo = await auth0Client.getUser();
    setApiKey(accessToken);
    if (mounted) {
      setState({
        isLoading: false,
        isAuthenticated: true,
        user: userInfo || null,
        token: accessToken,
        error: null,
      });
    }
  }, []);

  // Helper: Clear authentication state
  const clearAuthState = useCallback((mounted: boolean) => {
    setApiKey(null);
    if (mounted) {
      setState((s) => ({ ...s, isLoading: false, isAuthenticated: false }));
    }
  }, []);

  // Helper: Set authentication error state
  const setAuthError = useCallback((mounted: boolean, error: unknown) => {
    if (mounted) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        // Wait for configuration to be loaded
        if (configLoading) {
          return; // Still loading configuration
        }

        // Handle configuration error
        if (configError || !appConfig?.auth0) {
          handleConfigError(mounted, configError);
          return;
        }

        const { domain, clientId, audience } = appConfig.auth0;

        if (!domain || !clientId || !audience) {
          handleConfigError(mounted, "Invalid authentication configuration");
          return;
        }

        auth0Ref.current = new Auth0Client({
          domain,
          clientId,
          authorizationParams: {
            audience,
            scope: "openid profile email offline_access",
          },
          cacheLocation: "localstorage",
          useRefreshTokens: true,
        });

        // Restore session if present
        const authed = await auth0Ref.current.isAuthenticated();
        if (authed) {
          await restoreSession(auth0Ref.current, mounted);
          return;
        }

        // Clear any old API key that might be stored and set not authenticated
        clearAuthState(mounted);
      } catch (e) {
        setAuthError(mounted, e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [
    appConfig,
    configLoading,
    configError,
    handleConfigError,
    restoreSession,
    clearAuthState,
    setAuthError,
  ]);

  const loginWithPopup = useCallback(async (options?: PopupLoginOptions) => {
    if (!auth0Ref.current) {
      throw new Error("Authentication is not configured");
    }

    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      await auth0Ref.current.loginWithPopup(options);
      let accessToken: string | null = null;
      try {
        const t = await auth0Ref.current.getTokenSilently();
        accessToken = t;
      } catch {
        try {
          // Fallback to explicit popup token fetch if silent fails
          const t2 = await auth0Ref.current.getTokenWithPopup(options);
          accessToken = t2 ?? null;
        } catch (err) {
          setState((s) => ({
            ...s,
            isLoading: false,
            error: err instanceof Error ? err.message : String(err),
          }));
          throw err;
        }
      }
      const userInfo = await auth0Ref.current.getUser();
      if (accessToken) setApiKey(accessToken);
      const newState = {
        isLoading: false,
        isAuthenticated: true,
        user: userInfo || null,
        token: accessToken,
        error: null,
      };
      setState(newState);
      return accessToken;
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      throw err;
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    if (auth0Ref.current) {
      const t = await auth0Ref.current.getTokenSilently().catch(() => null);
      if (t) {
        setApiKey(t);
        setState((s) => ({ ...s, token: t, isAuthenticated: true }));
        return t;
      }
    }
    const stored = getUserSettings().apiKey;
    return stored;
  }, []);

  const logout = useCallback(async () => {
    clearAllUserSettings();
    const newState = {
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
    };
    setState(newState);
    if (auth0Ref.current) {
      // In an embedded app, avoid full-page redirect
      await auth0Ref.current.logout({ openUrl: false });
    }
  }, []);

  const contextValue: AuthContextType = useMemo(
    () => ({
      isLoading: isLoading || configLoading, // Include configuration loading in overall loading state
      isAuthenticated,
      user,
      token,
      error: error || configError, // Include configuration errors
      loginWithPopup,
      getAccessToken,
      logout,
    }),
    [
      isLoading,
      configLoading,
      isAuthenticated,
      user,
      token,
      error,
      configError,
      loginWithPopup,
      getAccessToken,
      logout,
    ],
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
