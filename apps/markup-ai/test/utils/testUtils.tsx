import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { LocalizationProvider } from '../../src/contexts/LocalizationContext';
import { vi } from 'vitest';

// Mock the LocalizationService and other exports
vi.mock('@markupai/toolkit', () => ({
  LocalizationService: {
    getInstance: vi.fn().mockResolvedValue({
      t: vi.fn((key: string) => key), // Return the key as the translation
      getCurrentLanguage: vi.fn(() => 'en'),
      changeLanguage: vi.fn(),
    }),
  },
  Status: {
    Completed: 'completed',
    Failed: 'failed',
    InProgress: 'in_progress',
  },
  IssueCategory: {
    Grammar: 'grammar',
    Style: 'style',
    Terminology: 'terminology',
  },
}));

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <LocalizationProvider>{children}</LocalizationProvider>;
};

const customRender = (ui: ReactElement, options?: CustomRenderOptions) =>
  render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';

// Override render method
export { customRender as render };
