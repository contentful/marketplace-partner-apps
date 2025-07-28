// Mock fetchAllContentTypes and withTimeout before importing the component
vi.mock('../../utils/apiUtils', () => {
  return {
    ...vi.importActual('../../utils/apiUtils'),
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
import { fetchAllContentTypes, withTimeout } from '../../utils/apiUtils';

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
    (withTimeout as any).mockImplementation((promise) => promise);
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

    it('renders with default placeholder when none provided', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Select content types...')).toBeInTheDocument();
      });
    });

    it('renders content type options with descriptions', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Blog Post')).toBeInTheDocument();
        expect(screen.getByText('A blog post')).toBeInTheDocument();
        expect(screen.getByText('Product')).toBeInTheDocument();
        expect(screen.getByText('A product')).toBeInTheDocument();
      });
    });

    it('renders content type options without descriptions when not provided', async () => {
      const contentTypesWithoutDescriptions = [{ sys: { id: 'simple' }, name: 'Simple Type' }];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(contentTypesWithoutDescriptions));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Simple Type')).toBeInTheDocument();
        expect(screen.queryByText('A description')).not.toBeInTheDocument();
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

    it('maintains option order from API response', async () => {
      const orderedContentTypes = [
        { sys: { id: 'z-last' }, name: 'Z Last', description: 'Should be last' },
        { sys: { id: 'a-first' }, name: 'A First', description: 'Should be first' },
        { sys: { id: 'm-middle' }, name: 'M Middle', description: 'Should be middle' },
      ];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(orderedContentTypes));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        const items = screen.getAllByTestId(/autocomplete-item-/);
        expect(items[0]).toHaveAttribute('data-testid', 'autocomplete-item-z-last');
        expect(items[1]).toHaveAttribute('data-testid', 'autocomplete-item-a-first');
        expect(items[2]).toHaveAttribute('data-testid', 'autocomplete-item-m-middle');
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

    it('supports multiple selections', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const { rerender } = render(<SelectContentTypes {...defaultProps} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
        expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      });

      // Select first item
      await user.click(screen.getByTestId('autocomplete-item-product'));
      expect(onSelectionChange).toHaveBeenCalledWith(['product']);

      // Select second item
      onSelectionChange.mockClear();
      rerender(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['product']} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('autocomplete-item-blog-post'));
      expect(onSelectionChange).toHaveBeenCalledWith(['product', 'blog-post']);
    });

    it('handles selection when content type has no description', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      const contentTypesWithoutDesc = [{ sys: { id: 'no-desc' }, name: 'No Description' }];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(contentTypesWithoutDesc));

      render(<SelectContentTypes {...defaultProps} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-no-desc')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('autocomplete-item-no-desc'));
      expect(onSelectionChange).toHaveBeenCalledWith(['no-desc']);
    });

    it('preserves existing selections when adding new ones', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['author']} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('autocomplete-item-product'));
      expect(onSelectionChange).toHaveBeenCalledWith(['author', 'product']);
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

    it('removes only the clicked pill from multiple selections', async () => {
      const user = userEvent.setup();
      const onSelectionChange = vi.fn();
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['blog-post', 'product', 'author']} onSelectionChange={onSelectionChange} />);

      await waitFor(() => {
        expect(screen.getByTestId('pill-blog-post')).toBeInTheDocument();
        expect(screen.getByTestId('pill-product')).toBeInTheDocument();
        expect(screen.getByTestId('pill-author')).toBeInTheDocument();
      });

      // Find and click the close button for the 'product' pill
      const productPill = screen.getByTestId('pill-product');
      const closeButton = productPill.querySelector('[data-testid="pill-close"]');
      await user.click(closeButton!);

      expect(onSelectionChange).toHaveBeenCalledWith(['blog-post', 'author']);
    });

    it('shows correct pill labels', async () => {
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['blog-post', 'product']} />);

      await waitFor(() => {
        expect(screen.getByTestId('pill-blog-post')).toBeInTheDocument();
        expect(screen.getByTestId('pill-product')).toBeInTheDocument();
      });

      // Check that pill labels are correct
      const blogPill = screen.getByTestId('pill-blog-post');
      const productPill = screen.getByTestId('pill-product');
      expect(blogPill).toHaveTextContent('Blog Post');
      expect(productPill).toHaveTextContent('Product');
    });

    it('handles pills for content types not in current data', async () => {
      // This could happen if selectedContentTypeIds contains IDs that aren't in the current fetch
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['nonexistent-id']} />);

      await waitFor(() => {
        // Should not render pills for content types that don't exist in the data
        expect(screen.queryByTestId('pill-nonexistent-id')).not.toBeInTheDocument();
      });
    });

    it('does not render pills container when no selections', async () => {
      render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('pill-blog-post')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pill-product')).not.toBeInTheDocument();
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

    it('filters by description when typing', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'blog post'); // Should match "A blog post" description

      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product')).not.toBeInTheDocument();
    });

    it('is case insensitive when filtering', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'BLOG');

      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product')).not.toBeInTheDocument();
    });

    it('shows all options when search is cleared', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');

      // Type to filter
      await user.type(input, 'blog');
      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product')).not.toBeInTheDocument();

      // Clear the input
      await user.clear(input);

      // All options should be visible again
      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-product')).toBeInTheDocument();
      expect(screen.getByTestId('autocomplete-item-author')).toBeInTheDocument();
    });

    it('handles partial matches in names and descriptions', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.type(input, 'post'); // Should match both "Blog Post" name and "A blog post" description

      expect(screen.getByTestId('autocomplete-item-blog-post')).toBeInTheDocument();
      expect(screen.queryByTestId('autocomplete-item-product')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('shows loading spinner initially', () => {
      render(<SelectContentTypes {...defaultProps} />);
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading content types...')).toBeInTheDocument();
    });

    it('hides loading spinner after data loads', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });
    });

    it('shows loading state during refetch', async () => {
      const { rerender } = render(<SelectContentTypes {...defaultProps} />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      // Simulate a refetch by changing props
      (fetchAllContentTypes as any).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(mockContentTypes), 100)));

      rerender(<SelectContentTypes {...defaultProps} cma={{} as any} />);

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

    it('shows generic error message when error has no message', async () => {
      (fetchAllContentTypes as any).mockImplementation(() => Promise.reject(new Error()));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('note-negative')).toBeInTheDocument();
        expect(screen.getByText(/Failed to load content types/)).toBeInTheDocument();
      });
    });

    it('shows custom error message', async () => {
      (fetchAllContentTypes as any).mockImplementation(() => Promise.reject(new Error('Custom error message')));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Custom error message/)).toBeInTheDocument();
      });
    });

    it('does not show autocomplete when there is an error', async () => {
      (fetchAllContentTypes as any).mockImplementation(() => Promise.reject(new Error('Failed to load content types')));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('note-negative')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('autocomplete')).not.toBeInTheDocument();
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

    it('does not render empty state when loading', () => {
      const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">No content types found</div>);
      (fetchAllContentTypes as any).mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<SelectContentTypes {...defaultProps} renderEmptyState={renderEmptyState} />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();
      expect(screen.queryByTestId('custom-empty')).not.toBeInTheDocument();
    });

    it('does not render empty state when there are content types', async () => {
      const renderEmptyState = vi.fn(() => <div data-testid="custom-empty">No content types found</div>);

      render(<SelectContentTypes {...defaultProps} renderEmptyState={renderEmptyState} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('custom-empty')).not.toBeInTheDocument();
    });
  });

  describe('Progress Callback', () => {
    it('calls onProgress callback during fetch', async () => {
      const onProgress = vi.fn();
      (fetchAllContentTypes as any).mockImplementation((cma, progressCallback) => {
        progressCallback?.(5, 10);
        progressCallback?.(10, 10);
        return Promise.resolve(mockContentTypes);
      });

      render(<SelectContentTypes {...defaultProps} onProgress={onProgress} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(onProgress).toHaveBeenCalledWith(5, 10);
      expect(onProgress).toHaveBeenCalledWith(10, 10);
    });

    it('handles missing onProgress callback gracefully', async () => {
      (fetchAllContentTypes as any).mockImplementation((cma, progressCallback) => {
        progressCallback?.(5, 10); // Should not throw
        return Promise.resolve(mockContentTypes);
      });

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });
    });
  });

  describe('Timeout Handling', () => {
    it('uses withTimeout wrapper for API calls', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(withTimeout).toHaveBeenCalledWith(
        expect.any(Promise),
        120000 // 2 minute timeout
      );
    });

    it('handles timeout errors', async () => {
      (withTimeout as any).mockImplementation(() => Promise.reject(new Error('Request timed out')));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('note-negative')).toBeInTheDocument();
        expect(screen.getByText(/Request timed out/)).toBeInTheDocument();
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('refetches data when cma prop changes', async () => {
      const { rerender } = render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(fetchAllContentTypes).toHaveBeenCalledTimes(1);

      // Change the cma prop
      const newCma = { contentType: { getMany: vi.fn() } } as any;
      rerender(<SelectContentTypes {...defaultProps} cma={newCma} />);

      await waitFor(() => {
        expect(fetchAllContentTypes).toHaveBeenCalledTimes(2);
      });
    });

    it('refetches data when onProgress prop changes', async () => {
      const onProgress1 = vi.fn();
      const { rerender } = render(<SelectContentTypes {...defaultProps} onProgress={onProgress1} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      expect(fetchAllContentTypes).toHaveBeenCalledTimes(1);

      // Change the onProgress prop
      const onProgress2 = vi.fn();
      rerender(<SelectContentTypes {...defaultProps} onProgress={onProgress2} />);

      await waitFor(() => {
        expect(fetchAllContentTypes).toHaveBeenCalledTimes(2);
      });
    });

    it('cleans up state on unmount', () => {
      const { unmount } = render(<SelectContentTypes {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('sets correct autocomplete attributes', async () => {
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        const autocomplete = screen.getByTestId('autocomplete');
        // Check for attributes that are actually set by our mock
        expect(autocomplete).toHaveAttribute('textonafterselect', 'preserve');
        expect(autocomplete).toHaveAttribute('listwidth', 'full');
        // The component should render without crashing
        expect(autocomplete).toBeInTheDocument();
      });
    });

    it('maintains focus management', async () => {
      const user = userEvent.setup();
      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-input')).toBeInTheDocument();
      });

      const input = screen.getByTestId('autocomplete-input');
      await user.click(input);
      expect(input).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles content types with special characters in names', async () => {
      const specialContentTypes = [{ sys: { id: 'special-chars' }, name: 'Special & Chars <test>', description: 'Has special chars' }];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(specialContentTypes));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Special & Chars <test>')).toBeInTheDocument();
      });
    });

    it('handles very long content type names', async () => {
      const longName = 'A'.repeat(200);
      const longContentTypes = [{ sys: { id: 'long-name' }, name: longName, description: 'Long name test' }];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(longContentTypes));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('handles empty content type names', async () => {
      const emptyNameContentTypes = [{ sys: { id: 'empty-name' }, name: '', description: 'Empty name test' }];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(emptyNameContentTypes));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete-item-empty-name')).toBeInTheDocument();
      });
    });

    it('handles null/undefined descriptions gracefully', async () => {
      const nullDescContentTypes = [
        { sys: { id: 'null-desc' }, name: 'Null Description', description: null },
        { sys: { id: 'undefined-desc' }, name: 'Undefined Description' }, // no description property
      ];
      (fetchAllContentTypes as any).mockImplementation(() => Promise.resolve(nullDescContentTypes));

      render(<SelectContentTypes {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Null Description')).toBeInTheDocument();
        expect(screen.getByText('Undefined Description')).toBeInTheDocument();
      });
    });

    it('handles rapid prop changes', async () => {
      const { rerender } = render(<SelectContentTypes {...defaultProps} selectedContentTypeIds={[]} />);

      // Rapidly change selections
      rerender(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['blog-post']} />);
      rerender(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['blog-post', 'product']} />);
      rerender(<SelectContentTypes {...defaultProps} selectedContentTypeIds={['author']} />);

      await waitFor(() => {
        expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
      });

      // Should handle the rapid changes without errors
      expect(screen.getByTestId('pill-author')).toBeInTheDocument();
      expect(screen.queryByTestId('pill-blog-post')).not.toBeInTheDocument();
      expect(screen.queryByTestId('pill-product')).not.toBeInTheDocument();
    });
  });
});
