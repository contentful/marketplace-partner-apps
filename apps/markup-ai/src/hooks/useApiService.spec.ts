import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useApiService, validateConfig } from './useApiService';
import type { PlatformConfig } from '../types/content';
import { Dialects, Tones } from '../api-client/types.gen';

// Mock the hooks from useStyleAndBrandAgent
vi.mock('./useStyleAndBrandAgent', () => ({
  useGetAdminConstants: vi.fn(),
  useListStyleGuides: vi.fn(),
  useCreateStyleCheck: vi.fn(),
  useGetStyleCheck: vi.fn(),
  useCreateStyleRewrite: vi.fn(),
  useGetStyleRewrite: vi.fn(),
}));

import {
  useGetAdminConstants,
  useListStyleGuides,
  useCreateStyleCheck,
  useGetStyleCheck,
  useCreateStyleRewrite,
  useGetStyleRewrite,
} from './useStyleAndBrandAgent';

describe('useApiService', () => {
  const mockConfig: PlatformConfig = {
    apiKey: 'test-api-key',
    dialect: 'american_english',
    tone: 'professional',
    styleGuide: 'test-style-guide',
  };

  const mockConstantsData = {
    dialects: ['american_english', 'british_english'],
    tones: ['professional', 'casual'],
    style_guides: { default: 'Default Style Guide' },
  };

  const mockStyleGuidesData = [
    { id: '1', name: 'Style Guide 1', created_at: '2023-01-01' },
    { id: '2', name: 'Style Guide 2', created_at: '2023-01-02' },
  ];

  let mockCreateStyleCheckMutation: ReturnType<typeof useCreateStyleCheck>;
  let mockCreateStyleRewriteMutation: ReturnType<typeof useCreateStyleRewrite>;
  let mockCheckQuery: ReturnType<typeof useGetStyleCheck>;
  let mockRewriteQuery: ReturnType<typeof useGetStyleRewrite>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock create mutations
    const mutateAsyncCheckMock = vi.fn();
    mockCreateStyleCheckMutation = { mutateAsync: mutateAsyncCheckMock } as unknown as ReturnType<
      typeof useCreateStyleCheck
    >;

    const mutateAsyncRewriteMock = vi.fn();
    mockCreateStyleRewriteMutation = { mutateAsync: mutateAsyncRewriteMock } as unknown as ReturnType<
      typeof useCreateStyleRewrite
    >;

    // Mock queries
    mockCheckQuery = { data: null, isLoading: false, error: null } as unknown as ReturnType<typeof useGetStyleCheck>;

    mockRewriteQuery = { data: null, isLoading: false, error: null } as unknown as ReturnType<
      typeof useGetStyleRewrite
    >;

    // Setup default mocks
    vi.mocked(useGetAdminConstants).mockReturnValue({
      data: mockConstantsData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetAdminConstants>);

    vi.mocked(useListStyleGuides).mockReturnValue({
      data: mockStyleGuidesData,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useListStyleGuides>);

    vi.mocked(useCreateStyleCheck).mockReturnValue(mockCreateStyleCheckMutation);
    vi.mocked(useCreateStyleRewrite).mockReturnValue(mockCreateStyleRewriteMutation);
    vi.mocked(useGetStyleCheck).mockReturnValue(mockCheckQuery);
    vi.mocked(useGetStyleRewrite).mockReturnValue(mockRewriteQuery);
  });

  describe('validateConfig', () => {
    it('should not throw for valid config', () => {
      expect(() => validateConfig(mockConfig)).not.toThrow();
    });

    it('should throw for undefined config', () => {
      expect(() => validateConfig(undefined)).toThrow('Configuration is missing. Please configure the app first.');
    });

    it('should throw for config without apiKey', () => {
      const invalidConfig = { ...mockConfig, apiKey: '' };
      expect(() => validateConfig(invalidConfig)).toThrow('Configuration is missing. Please configure the app first.');
    });
  });

  describe('hook initialization', () => {
    it('should return correct initial state', () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toEqual({
        dialects: ['american_english', 'british_english'],
        tones: ['professional', 'casual'],
        style_guides: { default: 'Default Style Guide' },
      });
      expect(result.current.styleGuides).toEqual(mockStyleGuidesData);
      expect(result.current.constantsLoading).toBe(false);
      expect(result.current.styleGuidesLoading).toBe(false);
      expect(result.current.constantsError).toBe(null);
      expect(result.current.styleGuidesError).toBe(null);
      expect(result.current.checkContent).toBeInstanceOf(Function);
      expect(result.current.contentRewrite).toBeInstanceOf(Function);
      expect(result.current.fetchAdminConstants).toBeInstanceOf(Function);
      expect(result.current.fetchStyleGuides).toBeInstanceOf(Function);
    });

    it('should handle loading states', () => {
      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      vi.mocked(useListStyleGuides).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useListStyleGuides>);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toBe(null);
      expect(result.current.styleGuides).toBe(null);
      expect(result.current.constantsLoading).toBe(true);
      expect(result.current.styleGuidesLoading).toBe(true);
    });

    it('should handle error states', () => {
      const constantsError = new Error('Constants error');
      const styleGuidesError = new Error('Style guides error');

      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: null,
        isLoading: false,
        error: constantsError,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      vi.mocked(useListStyleGuides).mockReturnValue({
        data: null,
        isLoading: false,
        error: styleGuidesError,
      } as unknown as ReturnType<typeof useListStyleGuides>);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toBe(null);
      expect(result.current.styleGuides).toBe(null);
      expect(result.current.constantsError).toBe(constantsError);
      expect(result.current.styleGuidesError).toBe(styleGuidesError);
    });
  });

  describe('checkContent', () => {
    it('should throw error for invalid config', async () => {
      const { result } = renderHook(() => useApiService({ ...mockConfig, apiKey: '' }));

      await expect(result.current.checkContent('test content')).rejects.toThrow(
        'Configuration is missing. Please configure the app first.',
      );
    });

    it('should throw error when mutation fails', async () => {
      const mutationError = new Error('Mutation failed');
      (mockCreateStyleCheckMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        mutationError,
      );

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.checkContent('test content')).rejects.toThrow('Mutation failed');
    });

    it('should call mutation with correct parameters', async () => {
      (mockCreateStyleCheckMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        workflow_id: 'check-workflow-123',
      });

      const { result } = renderHook(() => useApiService(mockConfig));

      // Start the check (this will timeout, but we can verify the mutation call)
      const checkPromise = result.current.checkContent('test content');

      // Verify the mutation was called with correct parameters
      expect(mockCreateStyleCheckMutation.mutateAsync).toHaveBeenCalledWith({
        body: {
          file_upload: expect.any(Blob),
          dialect: Dialects.AMERICAN_ENGLISH,
          tone: Tones.PROFESSIONAL,
          style_guide: 'test-style-guide',
        },
      });

      // Clean up the promise to avoid unhandled rejection
      checkPromise.catch(() => {});
    });

    it('should use default values when config values are missing', async () => {
      const configWithoutDefaults = {
        apiKey: 'test-api-key',
        dialect: undefined,
        tone: undefined,
        styleGuide: undefined,
      };

      (mockCreateStyleCheckMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        workflow_id: 'check-workflow-123',
      });

      const { result } = renderHook(() => useApiService(configWithoutDefaults));

      // Start the check (this will timeout, but we can verify the mutation call)
      const checkPromise = result.current.checkContent('test content');

      // Verify the mutation was called with default values
      expect(mockCreateStyleCheckMutation.mutateAsync).toHaveBeenCalledWith({
        body: {
          file_upload: expect.any(Blob),
          dialect: Dialects.AMERICAN_ENGLISH,
          tone: null,
          style_guide: '',
        },
      });

      // Clean up the promise to avoid unhandled rejection
      checkPromise.catch(() => {});
    });
  });

  describe('contentRewrite', () => {
    it('should throw error for invalid config', async () => {
      const { result } = renderHook(() => useApiService({ ...mockConfig, apiKey: '' }));

      await expect(result.current.contentRewrite('test content')).rejects.toThrow(
        'Configuration is missing. Please configure the app first.',
      );
    });

    it('should throw error when mutation fails', async () => {
      const mutationError = new Error('Mutation failed');
      (mockCreateStyleRewriteMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
        mutationError,
      );

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.contentRewrite('test content')).rejects.toThrow('Mutation failed');
    });

    it('should call mutation with correct parameters', async () => {
      (mockCreateStyleRewriteMutation.mutateAsync as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
        workflow_id: 'rewrite-workflow-456',
      });

      const { result } = renderHook(() => useApiService(mockConfig));

      // Start the rewrite (this will timeout, but we can verify the mutation call)
      const rewritePromise = result.current.contentRewrite('test content');

      // Verify the mutation was called with correct parameters
      expect(mockCreateStyleRewriteMutation.mutateAsync).toHaveBeenCalledWith({
        body: {
          file_upload: expect.any(Blob),
          dialect: Dialects.AMERICAN_ENGLISH,
          tone: Tones.PROFESSIONAL,
          style_guide: 'test-style-guide',
        },
      });

      // Clean up the promise to avoid unhandled rejection
      rewritePromise.catch(() => {});
    });
  });

  describe('fetchAdminConstants', () => {
    it('should return constants when loaded', async () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      const constants = await result.current.fetchAdminConstants();

      expect(constants).toEqual({
        dialects: ['american_english', 'british_english'],
        tones: ['professional', 'casual'],
        style_guides: { default: 'Default Style Guide' },
      });
    });

    it('should throw error for invalid config', async () => {
      const { result } = renderHook(() => useApiService({ ...mockConfig, apiKey: '' }));

      await expect(result.current.fetchAdminConstants()).rejects.toThrow(
        'Configuration is missing. Please configure the app first.',
      );
    });

    it('should throw error when constants are not loaded', async () => {
      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.fetchAdminConstants()).rejects.toThrow('Constants not loaded');
    });

    it('should throw error when constants query has error', async () => {
      const constantsError = new Error('Constants error');
      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: null,
        isLoading: false,
        error: constantsError,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.fetchAdminConstants()).rejects.toThrow('Constants error');
    });
  });

  describe('fetchStyleGuides', () => {
    it('should return style guides when loaded', async () => {
      const { result } = renderHook(() => useApiService(mockConfig));

      const styleGuides = await result.current.fetchStyleGuides();

      expect(styleGuides).toEqual(mockStyleGuidesData);
    });

    it('should throw error for invalid config', async () => {
      const { result } = renderHook(() => useApiService({ ...mockConfig, apiKey: '' }));

      await expect(result.current.fetchStyleGuides()).rejects.toThrow(
        'Configuration is missing. Please configure the app first.',
      );
    });

    it('should throw error when style guides are not loaded', async () => {
      vi.mocked(useListStyleGuides).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useListStyleGuides>);

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.fetchStyleGuides()).rejects.toThrow('Style guides not loaded');
    });

    it('should throw error when style guides query has error', async () => {
      const styleGuidesError = new Error('Style guides error');
      vi.mocked(useListStyleGuides).mockReturnValue({
        data: null,
        isLoading: false,
        error: styleGuidesError,
      } as unknown as ReturnType<typeof useListStyleGuides>);

      const { result } = renderHook(() => useApiService(mockConfig));

      await expect(result.current.fetchStyleGuides()).rejects.toThrow('Style guides error');
    });
  });

  describe('data transformation', () => {
    it('should handle missing data in constants response', () => {
      const incompleteConstantsData = {
        dialects: undefined,
        tones: undefined,
        style_guides: undefined,
      };

      vi.mocked(useGetAdminConstants).mockReturnValue({
        data: incompleteConstantsData,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useGetAdminConstants>);

      const { result } = renderHook(() => useApiService(mockConfig));

      expect(result.current.constants).toEqual({
        dialects: [],
        tones: [],
        style_guides: {},
      });
    });
  });
});
