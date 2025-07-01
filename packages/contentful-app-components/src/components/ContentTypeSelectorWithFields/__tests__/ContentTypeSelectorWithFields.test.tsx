import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentTypeSelectorWithFields } from '../ContentTypeSelectorWithFields';
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

describe('ContentTypeSelectorWithFields', () => {
  const defaultProps = {
    sdk: mockSdk,
    onSelectionChange: vi.fn(),
    fieldType: 'Object' as const,
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render content types with fields when loaded', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockToggleContentType = vi.fn();
    const mockToggleField = vi.fn();
    const mockIsContentTypeSelected = vi.fn().mockReturnValue(false);
    const mockIsFieldSelected = vi.fn().mockReturnValue(false);
    const mockGetSelectedFieldsForContentType = vi.fn().mockReturnValue([]);

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: mockToggleContentType,
      toggleField: mockToggleField,
      isContentTypeSelected: mockIsContentTypeSelected,
      isFieldSelected: mockIsFieldSelected,
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: mockGetSelectedFieldsForContentType,
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    // Should show content types
    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Article')).toBeInTheDocument();

    // Should show JSON fields for each content type
    expect(screen.getByText('JSON Field')).toBeInTheDocument();
    expect(screen.getByText('Metadata')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('should handle field selection', async () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockToggleField = vi.fn();
    const mockIsFieldSelected = vi.fn().mockReturnValue(false);

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [],
      toggleContentType: vi.fn(),
      toggleField: mockToggleField,
      isContentTypeSelected: vi.fn().mockReturnValue(false),
      isFieldSelected: mockIsFieldSelected,
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn().mockReturnValue([]),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    const jsonFieldCheckbox = screen.getByRole('checkbox', { name: /json field/i });
    await userEvent.click(jsonFieldCheckbox);

    expect(mockToggleField).toHaveBeenCalledWith('blogPost', 'jsonField');
  });

  it('should show selected fields', () => {
    mockUseContentTypes.mockReturnValue({
      contentTypes: mockContentTypes,
      isLoading: false,
      error: null,
      total: mockContentTypes.length,
    });

    const mockIsFieldSelected = vi
      .fn()
      .mockReturnValueOnce(true) // JSON Field selected
      .mockReturnValueOnce(false) // Metadata not selected
      .mockReturnValueOnce(false); // Settings not selected

    mockUseContentTypeSelection.mockReturnValue({
      selectedContentTypes: [],
      selectedFields: [{ contentTypeId: 'blogPost', fieldId: 'jsonField' }],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn().mockReturnValue(false),
      isFieldSelected: mockIsFieldSelected,
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn().mockReturnValue(['jsonField']),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    const jsonFieldCheckbox = screen.getByRole('checkbox', { name: /json field/i });
    expect(jsonFieldCheckbox).toBeChecked();
  });

  it('should filter content types by search', async () => {
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
      isFieldSelected: vi.fn().mockReturnValue(false),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn().mockReturnValue([]),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText(/search content types/i);
    await userEvent.type(searchInput, 'blog');

    expect(screen.getByText('Blog Post')).toBeInTheDocument();
    expect(screen.queryByText('Product')).not.toBeInTheDocument();
    expect(screen.queryByText('Article')).not.toBeInTheDocument();
  });

  it('should show empty state when no content types with specified field type', () => {
    // Mock content types without Object fields
    const contentTypesWithoutObjectFields = mockContentTypes.map((ct) => ({
      ...ct,
      fields: ct.fields.filter((field) => field.type !== 'Object'),
    }));

    mockUseContentTypes.mockReturnValue({
      contentTypes: contentTypesWithoutObjectFields,
      isLoading: false,
      error: null,
      total: contentTypesWithoutObjectFields.length,
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

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    expect(screen.getByText(/no content types with object fields found/i)).toBeInTheDocument();
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
      selectedFields: [{ contentTypeId: 'blogPost', fieldId: 'jsonField' }],
      toggleContentType: vi.fn(),
      toggleField: vi.fn(),
      isContentTypeSelected: vi.fn().mockReturnValue(true),
      isFieldSelected: vi.fn().mockReturnValue(true),
      clearAll: vi.fn(),
      getSelectedFieldsForContentType: vi.fn().mockReturnValue(['jsonField']),
      selectAllFields: vi.fn(),
    });

    render(<ContentTypeSelectorWithFields {...defaultProps} />);

    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith({
      contentTypes: ['blogPost'],
      fields: [{ contentTypeId: 'blogPost', fieldId: 'jsonField' }],
    });
  });
});
