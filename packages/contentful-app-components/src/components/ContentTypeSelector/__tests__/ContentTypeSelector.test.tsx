import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeSelector } from '../ContentTypeSelector';
import { mockContentTypes } from '../../../../test/mocks/mockContentTypes';

// Mock the hooks
vi.mock('../../../hooks/useContentTypes', () => ({
  useContentTypes: vi.fn(),
}));

const mockUseContentTypes = vi.mocked(await import('../../../hooks/useContentTypes')).useContentTypes;

describe('ContentTypeSelector', () => {
  const defaultProps = {
    selectedContentTypes: [],
    onSelectionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      loading: true,
      error: null,
      total: 0,
      hasMore: false,
      refetch: vi.fn(),
      loadMore: vi.fn(),
      isLoadingMore: false,
    });

    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.getByText(/loading content types/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      loading: false,
      error: new Error('Failed to load content types'),
      total: 0,
      hasMore: false,
      refetch: vi.fn(),
      loadMore: vi.fn(),
      isLoadingMore: false,
    });

    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.getByText(/error loading content types: failed to load content types/i)).toBeInTheDocument();
  });

  it('should render content types when loaded', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      loading: false,
      error: null,
      total: mockContentTypes.length,
      hasMore: false,
      refetch: vi.fn(),
      loadMore: vi.fn(),
      isLoadingMore: false,
    });

    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();
  });

  it('should show empty state when no content types', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      loading: false,
      error: null,
      total: 0,
      hasMore: false,
      refetch: vi.fn(),
      loadMore: vi.fn(),
      isLoadingMore: false,
    });

    render(<ContentTypeSelector {...defaultProps} />);
    expect(screen.getByText(/no content types found/i)).toBeInTheDocument();
  });
});
