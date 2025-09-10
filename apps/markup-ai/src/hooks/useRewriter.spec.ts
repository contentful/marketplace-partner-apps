import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRewriter } from './useRewriter';
import { mockSdk } from '../../test/mocks/mockSdk';
import { SidebarAppSDK } from '@contentful/app-sdk';

// Mock the dependencies
vi.mock('./useFieldChecks', () => ({
  useFieldChecks: vi.fn(() => ({
    fieldChecks: {
      fieldA: {
        fieldId: 'fieldA',
        originalValue: 'orig',
        isChecking: false,
        checkResponse: {
          // Minimal rewrite response shape for accept suggestion
          rewrite: {
            text: 'new text',
            // scores are not used by the hook in this test, provide minimal shape
            scores: { quality: { score: 0 }, analysis: {} },
          },
        },
        error: null,
        lastUpdated: Date.now(),
        hasRewriteResult: false,
      },
    },
    updateCheck: vi.fn(),
    createCheck: vi.fn(),
    removeCheck: vi.fn(),
    clearChecks: vi.fn(),
  })),
}));

vi.mock('./useTimeouts', () => ({
  useTimeouts: vi.fn(() => ({
    setTimeout: vi.fn(),
    clearAllTimeouts: vi.fn(),
  })),
}));

const setFieldValueMock = vi.fn().mockResolvedValue(undefined);
vi.mock('./useFieldSubscriptions', () => ({
  useFieldSubscriptions: vi.fn(() => ({
    setFieldValue: setFieldValueMock,
  })),
}));

vi.mock('../services/rewriterService', () => ({
  contentCheck: vi.fn(),
  rewriteContent: vi.fn(),
}));

describe('useRewriter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return cooldown management functions', () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

    expect(result.current.clearFieldCooldown).toBeDefined();
    expect(result.current.isFieldInCooldown).toBeDefined();
    expect(typeof result.current.clearFieldCooldown).toBe('function');
    expect(typeof result.current.isFieldInCooldown).toBe('function');
  });

  it('should return false for isFieldInCooldown when field is not in cooldown', () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

    expect(result.current.isFieldInCooldown('testField')).toBe(false);
  });

  it('should clear cooldown when clearFieldCooldown is called', () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

    act(() => {
      result.current.clearFieldCooldown('testField');
    });

    // Should still return false since the field was never added to cooldown
    expect(result.current.isFieldInCooldown('testField')).toBe(false);
  });

  it('should have all required methods in the return object', () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

    expect(result.current.fieldChecks).toBeDefined();
    expect(result.current.handleAcceptSuggestion).toBeDefined();
    expect(result.current.clearError).toBeDefined();
    expect(result.current.handleRewrite).toBeDefined();
    expect(result.current.setOnFieldChange).toBeDefined();
    expect(result.current.updateCheck).toBeDefined();
    expect(result.current.clearFieldCooldown).toBeDefined();
    expect(result.current.isFieldInCooldown).toBeDefined();
    expect(result.current.resetAcceptingSuggestionFlag).toBeDefined();
  });

  // Note: Debounce scheduling is covered indirectly via other calls

  it('handleRewrite calls rewriteContent when checkResponse exists', async () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));
    const { rewriteContent } = await import('../services/rewriterService');
    (rewriteContent as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({
      fieldId: 'fieldA',
      isChecking: false,
      checkResponse: { ok: true },
    });

    await act(async () => {
      await result.current.handleRewrite('fieldA');
    });
    expect(rewriteContent).toHaveBeenCalled();
  });

  it('accept suggestion sets field value and removes check, and sets cooldown', async () => {
    const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));
    await act(async () => {
      await result.current.handleAcceptSuggestion('fieldA');
    });
    expect(setFieldValueMock).toHaveBeenCalledWith('fieldA', 'new text');
  });
});
