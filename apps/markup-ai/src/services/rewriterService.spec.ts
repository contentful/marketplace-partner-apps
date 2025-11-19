import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createInitialFieldCheck, updateFieldCheck, useRewriterService } from './rewriterService';
import type { FieldCheckMap } from '../types/content';
import { WorkflowStatus } from '../api-client/types.gen';

// Mock the useApiService hook
vi.mock('../hooks/useApiService', () => ({
  useApiService: vi.fn(),
}));

import { useApiService } from '../hooks/useApiService';

describe('rewriterService', () => {
  describe('createInitialFieldCheck', () => {
    it('returns correct structure', () => {
      const fc = createInitialFieldCheck('f1', 'text', 1);
      expect(fc.fieldId).toBe('f1');
      expect(fc.originalValue).toBe('text');
      expect(fc.isChecking).toBe(false);
      expect(fc.checkResponse).toBe(null);
      expect(fc.error).toBe(null);
      expect(fc.lastUpdated).toBe(1);
      expect(fc.hasRewriteResult).toBe(false);
    });

    it('uses current timestamp when not provided', () => {
      const before = Date.now();
      const fc = createInitialFieldCheck('f1', 'text');
      const after = Date.now();
      expect(fc.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(fc.lastUpdated).toBeLessThanOrEqual(after);
    });
  });

  describe('updateFieldCheck', () => {
    it('sets and updates values', () => {
      const initial: FieldCheckMap = {};
      const updated = updateFieldCheck(initial, 'f1', { isChecking: true });
      expect(updated.f1.isChecking).toBe(true);
      const updated2 = updateFieldCheck(updated, 'f1', { isChecking: false });
      expect(updated2.f1.isChecking).toBe(false);
    });

    it('preserves existing values when updating', () => {
      const initial: FieldCheckMap = {
        f1: {
          fieldId: 'f1',
          originalValue: 'original',
          isChecking: false,
          checkResponse: null,
          error: null,
          lastUpdated: 1000,
          hasRewriteResult: false,
        },
      };
      const updated = updateFieldCheck(initial, 'f1', { isChecking: true });
      expect(updated.f1.fieldId).toBe('f1');
      expect(updated.f1.originalValue).toBe('original');
      expect(updated.f1.isChecking).toBe(true);
      expect(updated.f1.lastUpdated).toBeGreaterThan(1000);
    });

    it('removes oldest field when max field checks reached', () => {
      const initial: FieldCheckMap = {};
      // Create MAX_FIELD_CHECKS + 1 fields
      let checks = initial;
      for (let i = 0; i < 4; i++) {
        // MAX_FIELD_CHECKS is 3
        checks = updateFieldCheck(checks, `field${i}`, { isChecking: false });
      }

      // Add one more field - should remove the oldest
      const updated = updateFieldCheck(checks, 'field4', { isChecking: true });
      expect(Object.keys(updated)).toHaveLength(3);
      expect(updated.field0).toBeUndefined(); // Oldest should be removed
      expect(updated.field4).toBeDefined(); // Newest should be added
    });
  });

  describe('useRewriterService', () => {
    const mockConfig = {
      apiKey: 'test-api-key',
      dialect: 'american_english',
      tone: 'professional',
      styleGuide: 'default',
    };

    const mockCheckResponse = {
      workflow_id: 'workflow-123',
      status: WorkflowStatus.COMPLETED,
      original: {
        scores: {
          quality: { score: 75 },
          analysis: { clarity: { score: 70 } },
        },
      },
      workflow: {
        id: 'workflow-123',
        status: 'completed',
      },
      config: {
        dialect: 'american_english',
        tone: 'professional',
        style_guide: 'default',
      },
    };

    const mockRewriteResponse = {
      workflow_id: 'workflow-456',
      status: WorkflowStatus.COMPLETED,
      original: {
        scores: {
          quality: { score: 75 },
          analysis: { clarity: { score: 70 } },
        },
      },
      rewrite: {
        text: 'Improved text',
        scores: {
          quality: { score: 85 },
          analysis: { clarity: { score: 80 } },
        },
      },
      workflow: {
        id: 'workflow-456',
        status: 'completed',
      },
      config: {
        dialect: 'american_english',
        tone: 'professional',
        style_guide: 'default',
      },
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('returns contentCheck and rewriteContent functions', () => {
      const mockCheckContent = vi.fn();
      const mockContentRewrite = vi.fn();
      vi.mocked(useApiService).mockReturnValue({
        checkContent: mockCheckContent,
        contentRewrite: mockContentRewrite,
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      expect(result.current.contentCheck).toBeDefined();
      expect(result.current.rewriteContent).toBeDefined();
      expect(typeof result.current.contentCheck).toBe('function');
      expect(typeof result.current.rewriteContent).toBe('function');
    });

    it('contentCheck returns correct FieldCheck on success', async () => {
      const mockCheckContent = vi.fn().mockResolvedValue(mockCheckResponse);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: mockCheckContent,
        contentRewrite: vi.fn(),
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.contentCheck('field1', 'test content');

      expect(mockCheckContent).toHaveBeenCalledWith('test content');
      expect(fieldCheck.fieldId).toBe('field1');
      expect(fieldCheck.originalValue).toBe('test content');
      expect(fieldCheck.isChecking).toBe(false);
      expect(fieldCheck.checkResponse).toEqual({
        ...mockCheckResponse,
        original: {
          scores: mockCheckResponse.original.scores,
        },
      });
      expect(fieldCheck.error).toBe(null);
      expect(fieldCheck.hasRewriteResult).toBe(false);
      expect(fieldCheck.checkConfig).toEqual(mockConfig);
    });

    it('contentCheck handles errors correctly', async () => {
      const error = new Error('Check failed');
      const mockCheckContent = vi.fn().mockRejectedValue(error);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: mockCheckContent,
        contentRewrite: vi.fn(),
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.contentCheck('field1', 'test content');

      expect(fieldCheck.fieldId).toBe('field1');
      expect(fieldCheck.originalValue).toBe('test content');
      expect(fieldCheck.isChecking).toBe(false);
      expect(fieldCheck.checkResponse).toBe(null);
      expect(fieldCheck.error).toBe('Check failed');
      expect(fieldCheck.hasRewriteResult).toBe(false);
      expect(fieldCheck.checkConfig).toEqual(mockConfig);
    });

    it('contentCheck handles non-Error exceptions', async () => {
      const mockCheckContent = vi.fn().mockRejectedValue('String error');
      vi.mocked(useApiService).mockReturnValue({
        checkContent: mockCheckContent,
        contentRewrite: vi.fn(),
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.contentCheck('field1', 'test content');

      expect(fieldCheck.error).toBe('An error occurred while checking content');
    });

    it('rewriteContent returns correct FieldCheck on success', async () => {
      const mockContentRewrite = vi.fn().mockResolvedValue(mockRewriteResponse);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: vi.fn(),
        contentRewrite: mockContentRewrite,
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.rewriteContent('field1', 'test content');

      expect(mockContentRewrite).toHaveBeenCalledWith('test content');
      expect(fieldCheck.fieldId).toBe('field1');
      expect(fieldCheck.originalValue).toBe('test content');
      expect(fieldCheck.isChecking).toBe(false);
      expect(fieldCheck.checkResponse).toEqual({
        ...mockRewriteResponse,
        original: {
          scores: mockRewriteResponse.original.scores,
        },
        rewrite: {
          text: mockRewriteResponse.rewrite.text,
          scores: mockRewriteResponse.rewrite.scores,
        },
      });
      expect(fieldCheck.error).toBe(null);
      expect(fieldCheck.hasRewriteResult).toBe(true);
      expect(fieldCheck.checkConfig).toEqual(mockConfig);
    });

    it('rewriteContent handles errors correctly', async () => {
      const error = new Error('Rewrite failed');
      const mockContentRewrite = vi.fn().mockRejectedValue(error);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: vi.fn(),
        contentRewrite: mockContentRewrite,
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.rewriteContent('field1', 'test content');

      expect(fieldCheck.fieldId).toBe('field1');
      expect(fieldCheck.originalValue).toBe('test content');
      expect(fieldCheck.isChecking).toBe(false);
      expect(fieldCheck.checkResponse).toBe(null);
      expect(fieldCheck.error).toBe('Rewrite failed');
      expect(fieldCheck.hasRewriteResult).toBe(false);
      expect(fieldCheck.checkConfig).toEqual(mockConfig);
    });

    it('rewriteContent handles non-Error exceptions', async () => {
      const mockContentRewrite = vi.fn().mockRejectedValue('String error');
      vi.mocked(useApiService).mockReturnValue({
        checkContent: vi.fn(),
        contentRewrite: mockContentRewrite,
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.rewriteContent('field1', 'test content');

      expect(fieldCheck.error).toBe('An error occurred while rewriting content');
    });

    it('handles missing original scores in check response', async () => {
      const responseWithoutOriginal = {
        ...mockCheckResponse,
        original: undefined,
      };
      const mockCheckContent = vi.fn().mockResolvedValue(responseWithoutOriginal);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: mockCheckContent,
        contentRewrite: vi.fn(),
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.contentCheck('field1', 'test content');

      expect(fieldCheck.checkResponse?.original).toBeUndefined();
    });

    it('handles missing rewrite data in rewrite response', async () => {
      const responseWithoutRewrite = {
        ...mockRewriteResponse,
        rewrite: undefined,
      };
      const mockContentRewrite = vi.fn().mockResolvedValue(responseWithoutRewrite);
      vi.mocked(useApiService).mockReturnValue({
        checkContent: vi.fn(),
        contentRewrite: mockContentRewrite,
        constants: null,
        styleGuides: null,
        constantsLoading: false,
        styleGuidesLoading: false,
        constantsError: null,
        styleGuidesError: null,
        fetchAdminConstants: vi.fn(),
        fetchStyleGuides: vi.fn(),
      });

      const { result } = renderHook(() => useRewriterService(mockConfig));

      const fieldCheck = await result.current.rewriteContent('field1', 'test content');

      expect((fieldCheck.checkResponse as { rewrite?: unknown })?.rewrite).toBeUndefined();
    });
  });
});
