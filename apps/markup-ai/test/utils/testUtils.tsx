import React, { ReactElement } from "react";
import { render, RenderOptions, cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocalizationProvider } from "../../src/contexts/LocalizationContext";

// Mock the AuthContext
const mockUseAuth = vi.fn();
vi.mock("../../src/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: mockUseAuth,
}));

// Default mock implementation
mockUseAuth.mockReturnValue({
  isLoading: false,
  isAuthenticated: false,
  user: null,
  token: null,
  error: null,
  loginWithPopup: vi.fn().mockResolvedValue(null),
  getAccessToken: vi.fn().mockResolvedValue(null),
  logout: vi.fn().mockResolvedValue(undefined),
});

// Export mock for per-test customization
export { mockUseAuth };

interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider initializeSync>{children}</LocalizationProvider>
    </QueryClientProvider>
  );
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from "@testing-library/react";

// Override render method
export { customRender as render };

// Ensure React portals (e.g., react-modal) are cleaned up between tests
afterEach(() => {
  cleanup();
});
