import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeSelector } from '../ContentTypeSelector';
import { mockSdk } from '../../../../test/mocks/mockSdk';
import { mockContentTypes } from '../../../../test/mocks/mockContentTypes';

// Mock the hooks
vi.mock('../../../hooks/useContentTypes', () => ({
  useContentTypes: vi.fn(),
}));

vi.mock('../../../hooks/useContentTypeSelection', () => ({
  useContentTypeSelection: vi.fn(),
}));

const mockUseContentTypes = vi.mocked(await import('../../../hooks/useContentTypes')).useContentTypes;
const mockUseContentTypeSelection = vi.mocked(await import('../../../hooks/useContentTypeSelection')).useContentTypeSelection;

describe('ContentTypeSelector', () => {
  const defaultProps = {
    sdk: mockSdk,
    onSelectionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      isLoading: true,
      error: null,
      total: 0,
    });

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn(),
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render error state', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      isLoading: false,
      error: 'Failed to load content types',
      total: 0,
    });

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn(),
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    expect(screen.getByText(/failed to load content types/i)).toBeInTheDocument();
  });

  it('should render content types when loaded', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockToggleContentType = vi.fn();
    const mockIsContentTypeSelected = vi.fn().mockReturnValue(false);

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: mockToggleContentType,
      toggleField: vi.fn(),
      isContentTypeSelected: mockIsContentTypeSelected,
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();
  });

  it('should handle content type selection', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockToggleContentType = vi.fn();
    const mockIsContentTypeSelected = vi.fn().mockReturnValue(false);

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: mockToggleContentType,
      toggleField: vi.fn(),
      isContentTypeSelected: mockIsContentTypeSelected,
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    const blogPostCheckbox = screen.getByRole('checkbox', { name: /blog post/i });
    await userEvent.click(blogPostCheckbox);

    expect(mockToggleContentType).toHaveBeenCalledWith('blogPost');
  });

  it('should show selected content types', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockIsContentTypeSelected = vi
      .fn()
      .mockReturnValueOnce(true) // Blog Post selected
      .mockReturnValueOnce(false) // Product not selected
      .mockReturnValueOnce(false); // Article not selected

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: ['blogPost'],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: mockIsContentTypeSelected,
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    const blogPostCheckbox = screen.getByRole('checkbox', { name: /blog post/i });
    expect(blogPostCheckbox).toBeChecked();
  });

  it('should handle search functionality', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn().mockReturnValue(false),
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search content types/i);
    await userEvent.type(searchInput, 'blog');

    // The component should filter content types based on search
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('Product')).not.toBeInTheDocument();
    expect(screen.queryByText('Article')).not.toBeInTheDocument();
  });

  it('should show empty state when no content types', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: [],
      isLoading: false,
      error: null,
      total: 0,
    });

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn(),
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    expect(screen.getByText(/no content types found/i)).toBeInTheDocument();
  });

  it('should call onSelectionChange when selection changes', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: ['blogPost'],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn().mockReturnValue(true),
      isFieldSelected: vi.fn(),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn(),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelector {...defaultProps} />);

    // The onSelectionChange should be called when the component mounts with initial selection
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith({
      contentTypes: ['blogPost'],
      fields: [],
    });
  });
});
