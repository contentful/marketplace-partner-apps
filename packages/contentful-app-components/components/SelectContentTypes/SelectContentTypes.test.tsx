// Mock fetchAllContentTypes and withTimeout before importing the component
vi.mock('../../utils/apiHelpers', () => {
  return {
    ...vi.importActual('../../utils/apiHelpers'),
    fetchAllContentTypes: vi.fn(),
    withTimeout: vi.fn((promise) => promise),
  };
});

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { SelectContentTypes } from './SelectContentTypes';
import { fetchAllContentTypes } from '../../utils/apiHelpers';

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

const mockCma = {
  contentType: {
    getMany: vi.fn(),
  },
} as any;

const mockContentTypes = [
  { sys: { id: 'blog-post' }, name: 'Blog Post', description: 'A blog post' },
  { sys: { id: 'product' }, name: 'Product', description: 'A product' },
  { sys: { id: 'author' }, name: 'Author', description: 'An author' },
];

describe('SelectContentTypes', () => {
  const defaultProps = {
    cma: mockCma,
    selectedContentTypeIds: [],
    onSelectionChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(mockContentTypes));
  });

  describe('Rendering', () => {
    it('renders the autocomplete component after loading', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      // Initially shows loading
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for loading to complete and autocomplete to appear
      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });
    });

    it('renders with custom placeholder', async () => {
      render(<SelectContentTypes {...defaultProps} placeholder="Custom placeholder" />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
      });
    });

    it('renders disabled state', async () => {
      render(<SelectContentTypes {...defaultProps} disabled={true} />);

      await waitFor(() => {
        const autocomplete = screen.getByTestId('autocomplete');
        expect(autocomplete).toHaveAttribute('isdisabled', 'true');
      });
    });
  });

  describe('Content Type Options', () => {
    it('shows all content types in dropdown', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
        expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
        expect(screen.getByTestId('autocomplete-item-author')).toBeInTheDocument();
      });
    });
  });

  describe('Selection', () => {
    it('calls onSelectionChange when item is selected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<SelectContentTypes {...defaultProps} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
      });

      const item = screen.getByTestId('autocomplete-item-product');
      await user.click(item);
      expect(onSelectionChange).toHaveBeenCalledWith(['product']);
    });

    it('calls onSelectionChange when item is deselected', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['product']} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
      });

      const item = screen.getByTestId('autocomplete-item-product');
      await user.click(item);
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Pills', () => {
    it('renders pills for selected content types', async () => {
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['blog-post', 'product']} />);

      await waitFor(() => {
        expect(screen.getByTestId('pill-blog-post')).toBeInTheDocument();
        expect(screen.getByTestId('pill-product')).toBeInTheDocument();
      });
    });

    it('calls onSelectionChange when pill is removed', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['product']} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('pill-close')).toBeInTheDocument();
      });

      const closeButton = screen.getByTestId('pill-close');
      await user.click(closeButton);
      expect(onSelectionChange).toHaveBeenCalledWith([]);
    });
  });

  describe('Search and Filtering', () => {
    it('filters options when typing', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'blog');

      // Should show only blog-post
      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner initially', () => {
      render(<SelectContentTypes {...defaultProps} />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('shows error message when there is an error', async () => {
      (fetchAllContentTypes as any).mockImplementation(() => Promise.reject(new Error('Failed to load content types')));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('note-negative')).toBeInTheDocument();
        expect(screen.getByText(/Error loading content types/)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('renders custom empty state when no content types', async () => {
      const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">No content types found</div>);
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve([]));

      render(<SelectContentTypes {...defaultProps} renderEmptyState={renderEmptyState} />);

      await waitFor(() => {
        expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      });
    });

    it('renders custom empty state for filtered results', async () => {
      const user = userEvent.setup();
      const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">No matching content types</div>);

      render(<SelectContentTypes {...defaultProps} renderEmptyState={renderEmptyState} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'nonexistent');

      await waitFor(() => {
        expect(screen.getByTestId('custom-empty')).toBeInTheDocument();
      });
    });
  });
});
