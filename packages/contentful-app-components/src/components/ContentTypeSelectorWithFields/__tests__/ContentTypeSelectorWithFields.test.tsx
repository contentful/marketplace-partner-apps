import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeSelectorWithFields } from '../../ContentTypeSelector/ContentTypeSelectorWithFields';
import { mockContentTypes } from '../../../../test/mocks/mockContentTypes';

// Mock the hooks
vi.mock('../../../hooks/useContentTypes', () => ({
  useContentTypes: vi.fn(),
}));

const mockUseContentTypes = vi.mocked(await import('../../../hooks/useContentTypes')).useContentTypes;

describe('ContentTypeSelectorWithFields', () => {
  const defaultProps = {
    selectedContentTypes: [],
    selectedFields: {},
    onSelectionChange: vi.fn(),
    onFieldSelectionChange: vi.fn(),
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);
    expect(screen.getByText(/loading content types/i)).toBeInTheDocument();
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);
    expect(screen.getByText(/no content types found/i)).toBeInTheDocument();
  });

  it('should handle content type selection', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn();

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

    render(<ContentTypeSelectorWithFields {...defaultProps} onSelectionChange={onSelectionChange} />);

    // Find and click on a content type checkbox by ID
    const checkbox = screen.getByDisplayValue('blogPost');
    await user.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith(['blogPost']);
  });

  it('should handle field selection when content type is selected', async () => {
    const user = userEvent.setup();
    const onFieldSelectionChange = vi.fn();

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

    render(<ContentTypeSelectorWithFields {...defaultProps} selectedContentTypes={['blogPost']} onFieldSelectionChange={onFieldSelectionChange} />);

    // Find and click on a field checkbox by ID
    const fieldCheckbox = screen.getByDisplayValue('jsonField');
    await user.click(fieldCheckbox);

    expect(onFieldSelectionChange).toHaveBeenCalledWith('blogPost', ['jsonField']);
  });

  it('should show error state', () => {
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);
    expect(screen.getByText(/error loading content types/i)).toBeInTheDocument();
  });
});
