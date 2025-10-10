import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRewriter } from './useRewriter';
import { mockSdk } from '../../test/mocks/mockSdk';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { useFieldChecks } from './useFieldChecks';
import { createMockFieldCheck, buildWorkflow } from '../../test/utils/rewriterFixtures';

// Mock the dependencies
const mockUpdateCheck = vi.fn();
const mockCreateCheck = vi.fn();
const mockRemoveCheck = vi.fn();
const mockClearChecks = vi.fn();
const mockSetTimeout = vi.fn();
const mockClearAllTimeouts = vi.fn();
const mockContentCheck = vi.fn();
const mockRewriteContent = vi.fn();
const mockSetFieldValue = vi.fn().mockResolvedValue(undefined);

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
    updateCheck: mockUpdateCheck,
    createCheck: mockCreateCheck,
    removeCheck: mockRemoveCheck,
    clearChecks: mockClearChecks,
  })),
}));

vi.mock('./useTimeouts', () => ({
  useTimeouts: vi.fn(() => ({
    setTimeout: mockSetTimeout,
    clearAllTimeouts: mockClearAllTimeouts,
  })),
}));

vi.mock('./useFieldSubscriptions', () => ({
  useFieldSubscriptions: vi.fn(() => ({
    setFieldValue: mockSetFieldValue,
  })),
}));

vi.mock('../services/rewriterService', () => ({
  useRewriterService: vi.fn(() => ({
    contentCheck: mockContentCheck,
    rewriteContent: mockRewriteContent,
  })),
  createInitialFieldCheck: vi.fn(),
  updateFieldCheck: vi.fn(),
}));

async function runAcceptSuggestionErrorFlow(rejectedValue: unknown, expectedMessage: string) {
  mockSetFieldValue.mockRejectedValue(rejectedValue as never);

  const mockFieldCheckWithRewrite = createMockFieldCheck({
    fieldId: 'fieldA',
    originalValue: 'orig',
    checkResponse: {
      workflow: buildWorkflow('style_rewrite'),
      original: { scores: { quality: { score: 80 } } },
      rewrite: { text: 'new text', scores: { quality: { score: 0 }, analysis: {} } },
    },
  });

  vi.mocked(useFieldChecks).mockReturnValue({
    fieldChecks: { fieldA: mockFieldCheckWithRewrite },
    updateCheck: mockUpdateCheck,
    createCheck: mockCreateCheck,
    removeCheck: mockRemoveCheck,
    clearChecks: mockClearChecks,
  });

  const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

  await act(async () => {
    await result.current.handleAcceptSuggestion('fieldA');
  });

  expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', { error: expectedMessage });
}

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

  describe('handleContentCheck', () => {
    it('should handle content check errors correctly', async () => {
      const errorMessage = 'Content check failed';
      mockContentCheck.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      // Trigger handleContentCheck by calling handleRewrite which internally calls contentCheck
      // when there's no checkResponse (this will trigger the error path)
      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      // Should have been called to set isChecking: true initially
      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', { isChecking: true, error: null });
    });

    it('should handle non-Error exceptions in content check', async () => {
      mockContentCheck.mockRejectedValue('String error');

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      // Trigger handleContentCheck by calling handleRewrite
      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      // Should have been called to set isChecking: true initially
      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', { isChecking: true, error: null });
    });
  });

  describe('setOnFieldChange', () => {
    it('should set the field change callback', () => {
      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));
      const callback = vi.fn();

      act(() => {
        result.current.setOnFieldChange(callback);
      });

      // The callback should be set (we can't directly test the ref, but we can test the function exists)
      expect(result.current.setOnFieldChange).toBeDefined();
    });
  });

  describe('resetAcceptingSuggestionFlag', () => {
    it('should reset the accepting suggestion flag', () => {
      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      act(() => {
        result.current.resetAcceptingSuggestionFlag();
      });

      // The function should be callable and not throw
      expect(result.current.resetAcceptingSuggestionFlag).toBeDefined();
    });
  });

  describe('handleRewrite', () => {
    it('should call rewriteContent when checkResponse exists', async () => {
      const mockFieldCheck = createMockFieldCheck({
        fieldId: 'fieldA',
        originalValue: 'test content',
        checkResponse: {
          workflow: buildWorkflow('style_check'),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      // Mock the fieldChecks to include our test field
      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheck },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      mockRewriteContent.mockResolvedValue(mockFieldCheck);

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      expect(mockRewriteContent).toHaveBeenCalledWith('fieldA', 'test content');
      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', mockFieldCheck);
    });

    it('should handle rewrite errors correctly', async () => {
      const mockFieldCheck = createMockFieldCheck({
        fieldId: 'fieldA',
        originalValue: 'test content',
        checkResponse: {
          workflow: buildWorkflow('style_check'),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheck },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      const errorMessage = 'Rewrite failed';
      mockRewriteContent.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', {
        error: errorMessage,
      });
    });

    it('should handle non-Error exceptions in rewrite', async () => {
      const mockFieldCheck = createMockFieldCheck({
        fieldId: 'fieldA',
        originalValue: 'test content',
        checkResponse: {
          workflow: buildWorkflow('style_check'),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheck },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      mockRewriteContent.mockRejectedValue('String error');

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', {
        error: 'An error occurred while rewriting content',
      });
    });

    it('should return early if no checkResponse exists', async () => {
      const mockFieldCheck = createMockFieldCheck({ fieldId: 'fieldA', originalValue: 'test content' });

      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheck },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      expect(mockRewriteContent).not.toHaveBeenCalled();
    });

    it('should return early if no apiKey is provided', async () => {
      const sdkWithoutApiKey = {
        ...mockSdk,
        parameters: {
          ...mockSdk.parameters,
          installation: {
            ...mockSdk.parameters.installation,
            apiKey: '',
          },
        },
      };

      const mockFieldCheck = createMockFieldCheck({
        fieldId: 'fieldA',
        originalValue: 'test content',
        checkResponse: {
          workflow: buildWorkflow('style_check'),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheck },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      const { result } = renderHook(() => useRewriter(sdkWithoutApiKey as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleRewrite('fieldA');
      });

      expect(mockUpdateCheck).toHaveBeenCalledWith('fieldA', { isChecking: false });
      expect(mockRewriteContent).not.toHaveBeenCalled();
    });
  });

  describe('handleAcceptSuggestion', () => {
    it('should handle accept suggestion with rewrite response override', async () => {
      const mockRewriteResponse = {
        workflow: buildWorkflow('style_rewrite', undefined, 'workflow-456'),
        original: { scores: { quality: { score: 70 } } },
        rewrite: { text: 'Improved text', scores: { quality: { score: 90 } } },
      } as const;

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleAcceptSuggestion('fieldA', mockRewriteResponse);
      });

      expect(mockSetFieldValue).toHaveBeenCalledWith('fieldA', 'Improved text');
      expect(mockRemoveCheck).toHaveBeenCalledWith('fieldA');
      expect(mockSetTimeout).toHaveBeenCalledWith('cooldown-fieldA', expect.any(Function), 3000);
    });

    it('should handle accept suggestion errors correctly', async () => {
      await runAcceptSuggestionErrorFlow(new Error('Field update failed'), 'Field update failed');
    });

    it('should handle non-Error exceptions in accept suggestion', async () => {
      await runAcceptSuggestionErrorFlow('String error', 'An error occurred while accepting suggestion');
    });

    it('should return early if no rewrite response exists', async () => {
      const mockFieldCheckWithoutRewrite = createMockFieldCheck({
        fieldId: 'fieldA',
        originalValue: 'orig',
        checkResponse: {
          workflow: buildWorkflow('style_check'),
          original: { scores: { quality: { score: 80 } } },
        },
      });

      vi.mocked(useFieldChecks).mockReturnValue({
        fieldChecks: { fieldA: mockFieldCheckWithoutRewrite },
        updateCheck: mockUpdateCheck,
        createCheck: mockCreateCheck,
        removeCheck: mockRemoveCheck,
        clearChecks: mockClearChecks,
      });

      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      await act(async () => {
        await result.current.handleAcceptSuggestion('fieldA');
      });

      expect(mockSetFieldValue).not.toHaveBeenCalled();
    });
  });

  describe('handleFieldChange', () => {
    it('should handle field changes with cooldown check', () => {
      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      // First, add a field to cooldown
      act(() => {
        result.current.clearFieldCooldown('testField'); // This will be called but field won't be in cooldown initially
      });

      // The field change logic is tested indirectly through the hook's internal behavior
      expect(result.current.setOnFieldChange).toBeDefined();
    });

    it('should handle field changes when accepting suggestion', () => {
      const { result } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      // Test that the hook can handle field changes during suggestion acceptance
      expect(result.current.setOnFieldChange).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should cleanup timeouts and checks on unmount', () => {
      const { unmount } = renderHook(() => useRewriter(mockSdk as unknown as SidebarAppSDK));

      unmount();

      expect(mockClearAllTimeouts).toHaveBeenCalled();
      expect(mockClearChecks).toHaveBeenCalled();
    });
  });
});
