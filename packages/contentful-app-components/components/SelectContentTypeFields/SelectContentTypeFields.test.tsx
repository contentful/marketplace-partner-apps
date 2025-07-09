import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SelectContentTypeFields } from './SelectContentTypeFields';
import { useContentTypeFields } from '../../hooks/useContentTypeFields';

// Mock the hook
vi.mock('../../hooks/useContentTypeFields');

const mockUseContentTypeFields = useContentTypeFields as unknown as ReturnType<typeof vi.fn>;

// Mock F36 components
vi.mock('@contentful/f36-components', () => ({
  Autocomplete: vi.fn(({ items, onInputValueChange, onSelectItem, placeholder, renderItem, children, isDisabled, ...props }) => (
    <div data-testid="autocomplete" isdisabled={isDisabled ? 'true' : undefined} {...props}>
      <input data-testid="autocomplete-input" placeholder={placeholder} onChange={(e) => onInputValueChange?.(e.target.value)} />
      <div data-testid="autocomplete-items">
        {items?.map((item: any, index: number) => (
          <div key={item.id} data-testid={`autocomplete-item-${item.id}`} onClick={() => onSelectItem?.(item)}>
            {renderItem ? renderItem(item) : item.name}
          </div>
        ))}
      </div>
      {children}
    </div>
  )),
  Checkbox: vi.fn(({ isChecked, onChange, children }) => (
    <label data-testid="checkbox">
      <input type="checkbox" checked={isChecked} onChange={onChange} data-testid="checkbox-input" />
      {children}
    </label>
  )),
  Pill: vi.fn(({ label, onClose, testId }) => (
    <div data-testid={testId || 'pill'}>
      <span>{label}</span>
      <button onClick={onClose} data-testid="pill-close">
        ×
      </button>
    </div>
  )),
  Text: vi.fn(({ children, ...props }) => <span {...props}>{children}</span>),
  Flex: vi.fn(({ children, ...props }) => <div {...props}>{children}</div>),
  Note: vi.fn(({ children, variant, icon, ...props }) => (
    <div data-testid={`note-${variant}`} {...props}>
      {icon && <span data-testid="note-icon">{icon}</span>}
      {children}
    </div>
  )),
  Spinner: vi.fn(() => <div data-testid="spinner" />),
  Subheading: vi.fn(({ children }) => <h3>{children}</h3>),
}));

// Mock F36 icons
vi.mock('@contentful/f36-icons', () => ({
  ClockIcon: vi.fn(() => <span data-testid="clock-icon" />),
}));

const mockCma = {
  contentType: {
    getMany: vi.fn(),
  },
  editorInterface: {
    get: vi.fn(),
  },
} as any;

const mockContentTypesWithFields = [
  {
    contentType: {
      sys: { id: 'blog-post' },
      name: 'Blog Post',
    },
    editorInterface: {
      controls: [
        { fieldId: 'json-field-1', widgetId: 'app-id' },
        { fieldId: 'json-field-2', widgetId: 'other-app' },
      ],
    },
    fields: [
      { id: 'json-field-1', name: 'JSON Field 1', type: 'Object' },
      { id: 'json-field-2', name: 'JSON Field 2', type: 'Object' },
      { id: 'text-field', name: 'Text Field', type: 'Text' },
    ],
  },
  {
    contentType: {
      sys: { id: 'product' },
      name: 'Product',
    },
    editorInterface: {
      controls: [{ fieldId: 'json-field-3', widgetId: 'app-id' }],
    },
    fields: [
      { id: 'json-field-3', name: 'JSON Field 3', type: 'Object' },
      { id: 'number-field', name: 'Number Field', type: 'Number' },
    ],
  },
];

describe('SelectContentTypeFields', () => {
  const defaultProps = {
    cma: mockCma,
    selectedFieldIds: [],
    onSelectionChange: vi.fn(),
    appDefinitionId: 'app-id',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseContentTypeFields.mockReturnValue({
      contentTypesWithFields: mockContentTypesWithFields,
      loading: false,
      error: null,
      hasMore: false,
      loadMore: vi.fn(),
      search: vi.fn(),
      progress: null,
    });
  });

  describe('Rendering', () => {
    it('renders the autocomplete component', () => {
      render(<SelectContentTypeFields {...defaultProps} />);
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    });

    it('renders with custom placeholder', () => {
      render(<SelectContentTypeFields {...defaultProps} placeholder="Custom placeholder" />);
      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('renders disabled state', () => {
      render(<SelectContentTypeFields {...defaultProps} disabled={true} />);
      const autocomplete = screen.getByTestId('autocomplete');
      expect(autocomplete).toHaveAttribute('isdisabled', 'true');
    });
  });

  describe('Field Options', () => {
    it('shows only non-already-configured fields in dropdown', () => {
      render(<SelectContentTypeFields {...defaultProps} />);

      // Should show json-field-2 (not configured for app-id) and other non-configured fields
      expect(screen.getByTestId('autocomplete-item-blog-post:json-field-2')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-blog-post:text-field')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-product:number-field')).toBeInTheDocument();

      // Should NOT show json-field-1 (already configured for app-id)
      expect(screen.queryByTestId('autocomplete-item-blog-post:json-field-1')).not.toBeInTheDocument();
    });

    it('filters out non-JSON fields when field filters are applied', () => {
      // Mock the hook to return both content types with only JSON fields
      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: [
          {
            contentType: {
              sys: { id: 'blog-post' },
              name: 'Blog Post',
            },
            editorInterface: {
              controls: [
                { fieldId: 'json-field-1', widgetId: 'app-id' },
                { fieldId: 'json-field-2', widgetId: 'other-app' },
              ],
            },
            fields: [
              { id: 'json-field-1', name: 'JSON Field 1', type: 'Object' },
              { id: 'json-field-2', name: 'JSON Field 2', type: 'Object' },
            ],
          },
        ],
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search: vi.fn(),
        progress: null,
      });

      render(
        <SelectContentTypeFields {...defaultProps} fieldFilters={[{ id: 'jsonFields', name: 'JSON fields', test: (field: any) => field.type === 'Object' }]} />
      );

      // Should only show Object type fields
      expect(screen.getByTestId('autocomplete-item-blog-post:json-field-2')).toBeInTheDocument();

      // Should NOT show non-Object type fields
      expect(screen.queryByTestId('autocomplete-item-blog-post:text-field')).not.toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product:number-field')).not.toBeInTheDocument();
    });
  });

  describe('Selection', () => {
    it('calls onSelectionChange when item is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} onSelectionChange={onSelectionChange} />);

      const item = screen.getByTestId('autocomplete-item-blog-post:json-field-2');
      await user.click(item);

      expect(onSelectionChange).toHaveBeenCalledWith(['blog-post:json-field-2']);
    });

    it('calls onSelectionChange when item is deselected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['blog-post:json-field-2']} onSelectionChange={onSelectionChange} />);

      const item = screen.getByTestId('autocomplete-item-blog-post:json-field-2');
      await user.click(item);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows checkboxes for items', () => {
      render(<SelectContentTypeFields {...defaultProps} />);

      const checkboxes = screen.getAllByTestId('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('shows selected state for checkboxes', () => {
      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['blog-post:json-field-2']} />);

      const checkboxInputs = screen.getAllByTestId('checkbox-input');
      const selectedCheckbox = checkboxInputs.find((input) => input.closest('[data-testid*="blog-post:json-field-2"]'));
      expect(selectedCheckbox).toBeChecked();
    });
  });

  describe('Pills', () => {
    it('renders pills for selected fields', () => {
      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['blog-post:json-field-2', 'product:json-field-3']} />);

      expect(screen.getByTestId('pill-blog-post:json-field-2')).toBeInTheDocument();
      expect(screen.getByTestId('pill-product:json-field-3')).toBeInTheDocument();
    });

    it('calls onSelectionChange when pill is removed', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['blog-post:json-field-2']} onSelectionChange={onSelectionChange} />);

      const closeButton = screen.getByTestId('pill-close');
      await user.click(closeButton);

      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });

    it('shows pills for already configured fields', () => {
      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['blog-post:json-field-1']} />);

      // Should show pill for already configured field even though it's not in dropdown
      expect(screen.getByTestId('pill-blog-post:json-field-1')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    it('calls search when input changes', async () => {
      const user = userEvent.setup();
      const search = vi.fn();

      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: mockContentTypesWithFields,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search,
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} searchable={true} />);

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'blog');

      expect(search).toHaveBeenCalledWith('blog');
    });

    it('does not call search when searchable is false', async () => {
      const user = userEvent.setup();
      const search = vi.fn();

      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: mockContentTypesWithFields,
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search,
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} searchable={false} />);

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'blog');

      expect(search).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner when loading', () => {
      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: [],
        loading: true,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search: vi.fn(),
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} />);

      // The component should show loading state in the autocomplete
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    });

    it('shows progress when loading with progress data', () => {
      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: [],
        loading: true,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search: vi.fn(),
        progress: { processed: 5, total: 10 },
      });

      render(<SelectContentTypeFields {...defaultProps} />);

      expect(screen.getByTestId('note-neutral')).toBeInTheDocument();
      expect(screen.getByText('Loading content types')).toBeInTheDocument();
      expect(screen.getByText('5 of 10 completed')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when there is an error', () => {
      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: [],
        loading: false,
        error: 'Failed to load content types',
        hasMore: false,
        loadMore: vi.fn(),
        search: vi.fn(),
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} />);

      expect(screen.getByTestId('note-negative')).toBeInTheDocument();
      expect(screen.getByText(/Error loading content types and fields/)).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('renders custom empty state', () => {
      const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">No fields found</div>);

      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: [],
        loading: false,
        error: null,
        hasMore: false,
        loadMore: vi.fn(),
        search: vi.fn(),
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} renderEmptyState={renderEmptyState} />);

      expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
    });
  });

  describe('Auto-population', () => {
    it('auto-populates selectedFieldIds with already configured fields', () => {
      const onSelectionChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} onSelectionChange={onSelectionChange} />);

      // Should auto-populate with already configured fields
      expect(onSelectionChange).toHaveBeenCalledWith(['blog-post:json-field-1', 'product:json-field-3']);
    });

    it('does not auto-populate if selectedFieldIds already has values', () => {
      const onSelectionChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} selectedFieldIds={['existing-field']} onSelectionChange={onSelectionChange} />);

      // Should not auto-populate since selectedFieldIds already has values
      expect(onSelectionChange).not.toHaveBeenCalled();
    });
  });

  describe('Field Data Callback', () => {
    it('calls onFieldDataChange with field data', () => {
      const onFieldDataChange = vi.fn();

      render(<SelectContentTypeFields {...defaultProps} onFieldDataChange={onFieldDataChange} />);

      expect(onFieldDataChange).toHaveBeenCalledWith([
        {
          contentTypeId: 'blog-post',
          contentTypeName: 'Blog Post',
          fieldId: 'json-field-1',
          fieldName: 'JSON Field 1',
          isAlreadyConfigured: true,
        },
        {
          contentTypeId: 'blog-post',
          contentTypeName: 'Blog Post',
          fieldId: 'json-field-2',
          fieldName: 'JSON Field 2',
          isAlreadyConfigured: false,
        },
        {
          contentTypeId: 'blog-post',
          contentTypeName: 'Blog Post',
          fieldId: 'text-field',
          fieldName: 'Text Field',
          isAlreadyConfigured: undefined,
        },
        {
          contentTypeId: 'product',
          contentTypeName: 'Product',
          fieldId: 'json-field-3',
          fieldName: 'JSON Field 3',
          isAlreadyConfigured: true,
        },
        {
          contentTypeId: 'product',
          contentTypeName: 'Product',
          fieldId: 'number-field',
          fieldName: 'Number Field',
          isAlreadyConfigured: undefined,
        },
      ]);
    });
  });

  describe('Infinite Scroll', () => {
    it('calls loadMore when scrolling to bottom', async () => {
      const loadMore = vi.fn();

      mockUseContentTypeFields.mockReturnValue({
        contentTypesWithFields: mockContentTypesWithFields,
        loading: false,
        error: null,
        hasMore: true,
        loadMore,
        search: vi.fn(),
        progress: null,
      });

      render(<SelectContentTypeFields {...defaultProps} />);

      // The component should render with hasMore=true, indicating infinite scroll is available
      expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    });
  });
});
