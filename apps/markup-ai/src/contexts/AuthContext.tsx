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
import { queryClient } from "../hooks/useApiClient";
import { AGENT_SELECTION_STORAGE_KEY } from "../hooks/useAgentSelection";
import { AGENT_CONFIG_STORAGE_KEY } from "../hooks/useAgentConfig";
import { getOrgInfoFromToken } from "../utils/jwt";

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  token: string | null;
  error: string | null;
  /** True while a `switchOrganization` re-auth is in flight. */
  isSwitchingOrg: boolean;
};

export type AuthContextType = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: Record<string, unknown> | null;
  token: string | null;
  error: string | null;
  /** Auth0 organization id (e.g. `org_xxx`) from the current access token's `org_id` claim. */
  currentOrgId: string | null;
  /** Auth0 organization machine name from the current access token's `org_name` claim. */
  currentOrgName: string | null;
  /** True while a `switchOrganization` re-auth is in flight. */
  isSwitchingOrg: boolean;
  loginWithPopup: (options?: PopupLoginOptions) => Promise<string | null>;
  getAccessToken: () => Promise<string | null>;
  logout: () => Promise<void>;
  /**
   * Re-authenticate into a different Auth0 organization via popup, scoping the
   * new access token (and its `org_id` / `org_name` claims) to `organizationId`.
   * On success `currentOrgId` / `currentOrgName` update and org-scoped caches
   * are dropped so the next reads resolve against the new org.
   */
  switchOrganization: (organizationId: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Removed getAuthConfig function - now using useAppConfig hook

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const auth0Ref = useRef<Auth0Client | null>(null);
  const [{ isLoading, isAuthenticated, user, token, error, isSwitchingOrg }, setState] =
    useState<AuthState>(() => ({
      isLoading: true,
      isAuthenticated: false,
      user: null,
      token: null,
      error: null,
      isSwitchingOrg: false,
    }));

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
          isSwitchingOrg: false,
        });
      }
    };

    let accessToken: string | null;
    try {
      accessToken = await auth0Client.getTokenSilently();
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
        isSwitchingOrg: false,
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

  // Listen for storage events to detect auth changes from other locations (e.g., Dialog, Config)
  // This handles the case when user logs in/out from another Contentful location
  useEffect(() => {
    let checkingAuth = false;

    const checkAuthState = async () => {
      const auth0Client = auth0Ref.current;
      if (!auth0Client || checkingAuth) return;
      checkingAuth = true;

      try {
        const currentApiKey = getUserSettings().apiKey;
        const nowAuthenticated = await auth0Client.isAuthenticated();

        setState((prevState) => {
          const wasAuthenticated = prevState.isAuthenticated;

          if (nowAuthenticated && !wasAuthenticated) {
            // User logged in from another location - trigger session restore
            void restoreSession(auth0Client, true);
          } else if (!nowAuthenticated && wasAuthenticated) {
            // User logged out from another location - clear state
            return {
              isLoading: false,
              isAuthenticated: false,
              user: null,
              token: null,
              error: null,
              isSwitchingOrg: false,
            };
          } else if (nowAuthenticated && !currentApiKey) {
            // Session exists but API key was cleared - restore it
            void restoreSession(auth0Client, true);
          }
          return prevState;
        });
      } catch {
        // Ignore errors from auth check
      } finally {
        checkingAuth = false;
      }
    };

    // Wrap checkAuthState to use as event handler
    const handleStorageEvent = () => {
      void checkAuthState();
    };

    // Listen for storage events (triggered when localStorage changes from another tab/iframe)
    globalThis.addEventListener("storage", handleStorageEvent);

    // Also check on visibility change (when tab/iframe becomes visible again)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void checkAuthState();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Check on window focus (useful for embedded iframes)
    const handleFocus = () => {
      void checkAuthState();
    };
    globalThis.addEventListener("focus", handleFocus);

    // Fallback periodic check every 30 seconds as a safety net for edge cases
    // in Contentful's iframe-based architecture. Only check when document is visible
    // to minimize CPU/network overhead.
    const intervalId = globalThis.setInterval(() => {
      if (document.visibilityState === "visible") {
        void checkAuthState();
      }
    }, 30000);

    return () => {
      globalThis.removeEventListener("storage", handleStorageEvent);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      globalThis.removeEventListener("focus", handleFocus);
      globalThis.clearInterval(intervalId);
    };
  }, [restoreSession]);

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
        isSwitchingOrg: false,
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
      isSwitchingOrg: false,
    };
    setState(newState);
    if (auth0Ref.current) {
      // In an embedded app, avoid full-page redirect
      await auth0Ref.current.logout({ openUrl: false });
    }
  }, []);

  // Re-authenticate into a different Auth0 organization. Auth0's SDK has no
  // "switch org" primitive, so we re-run the popup login with the
  // `organization` parameter; on success the new access token carries the
  // target org's `org_id` / `org_name` claims.
  const switchOrganization = useCallback(async (organizationId: string) => {
    if (!auth0Ref.current) {
      throw new Error("Authentication is not configured");
    }
    if (!organizationId) {
      return;
    }
    setState((s) => ({ ...s, isSwitchingOrg: true, error: null }));
    try {
      await auth0Ref.current.loginWithPopup({
        authorizationParams: { organization: organizationId },
      });
      // Fetch explicitly scoped to the new org rather than a bare
      // getTokenSilently(), which could return a token for the previous org
      // from the SDK cache during this transition.
      const accessToken = await auth0Ref.current.getTokenSilently({
        authorizationParams: { organization: organizationId },
      });
      const userInfo = await auth0Ref.current.getUser();
      if (accessToken) setApiKey(accessToken);

      // The previous org's agent selection/config (sessionStorage) and cached
      // API responses (react-query) reference targets / style guides from the
      // old org. Token-fingerprinted query keys already prevent cross-org
      // bleed, but we clear both so nothing stale flashes before refetch.
      sessionStorage.removeItem(AGENT_SELECTION_STORAGE_KEY);
      sessionStorage.removeItem(AGENT_CONFIG_STORAGE_KEY);
      queryClient.clear();

      setState((s) => ({
        ...s,
        isAuthenticated: true,
        user: userInfo || null,
        token: accessToken,
        error: null,
        isSwitchingOrg: false,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        isSwitchingOrg: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      throw err instanceof Error ? err : new Error(String(err));
    }
  }, []);

  // Derive the active org from the access token's claims. Present only when the
  // user authenticated against a specific Auth0 organization.
  const { orgId: currentOrgId, orgName: currentOrgName } = useMemo(
    () => (token ? getOrgInfoFromToken(token) : { orgId: null, orgName: null }),
    [token],
  );

  const contextValue: AuthContextType = useMemo(
    () => ({
      isLoading: isLoading || configLoading, // Include configuration loading in overall loading state
      isAuthenticated,
      user,
      token,
      error: error || configError, // Include configuration errors
      currentOrgId,
      currentOrgName,
      isSwitchingOrg,
      loginWithPopup,
      getAccessToken,
      logout,
      switchOrganization,
    }),
    [
      isLoading,
      configLoading,
      isAuthenticated,
      user,
      token,
      error,
      configError,
      currentOrgId,
      currentOrgName,
      isSwitchingOrg,
      loginWithPopup,
      getAccessToken,
      logout,
      switchOrganization,
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
