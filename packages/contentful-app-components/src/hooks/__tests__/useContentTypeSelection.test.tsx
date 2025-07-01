import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useContentTypeSelection } from '../useContentTypeSelection';

describe('useContentTypeSelection', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    expect(result.current.selectedContentTypes).toEqual([]);
    expect(result.current.selectedFields).toEqual({});
  });

  it('should initialize with provided values', () => {
    const initialSelection = ['blogPost', 'product'];
    const initialFieldSelection = {
      blogPost: ['jsonField'],
      product: ['metadata'],
    };

    const { result } = renderHook(() =>
      useContentTypeSelection({
        initialSelection,
        initialFieldSelection,
      })
    );

    expect(result.current.selectedContentTypes).toEqual(initialSelection);
    expect(result.current.selectedFields).toEqual(initialFieldSelection);
  });

  it('should toggle content type selection', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
    });

    expect(result.current.selectedContentTypes).toEqual(['blogPost']);
    expect(result.current.isContentTypeSelected('blogPost')).toBe(true);

    act(() => {
      result.current.toggleContentType('blogPost');
    });

    expect(result.current.selectedContentTypes).toEqual([]);
    expect(result.current.isContentTypeSelected('blogPost')).toBe(false);
  });

  it('should toggle field selection', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleField('blogPost', 'jsonField');
    });

    expect(result.current.selectedFields).toEqual({
      blogPost: ['jsonField'],
    });
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(true);

    act(() => {
      result.current.toggleField('blogPost', 'jsonField');
    });

    expect(result.current.selectedFields).toEqual({});
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(false);
  });

  it('should clear all selections', () => {
    const { result } = renderHook(() =>
      useContentTypeSelection({
        initialSelection: ['blogPost'],
        initialFieldSelection: { blogPost: ['jsonField'] },
      })
    );

    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedContentTypes).toEqual([]);
    expect(result.current.selectedFields).toEqual({});
  });

  it('should get selected fields for a content type', () => {
    const initialFieldSelection = {
      blogPost: ['jsonField'],
      product: ['metadata'],
    };

    const { result } = renderHook(() =>
      useContentTypeSelection({
        initialFieldSelection,
      })
    );

    expect(result.current.selectedFields.blogPost).toEqual(['jsonField']);
    expect(result.current.selectedFields.product).toEqual(['metadata']);
    expect(result.current.selectedFields.nonexistent).toBeUndefined();
  });

  it('should handle multiple content types and fields', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleField('blogPost', 'jsonField');
      result.current.toggleContentType('product');
      result.current.toggleField('product', 'metadata');
    });

    expect(result.current.selectedContentTypes).toEqual(['blogPost', 'product']);
    expect(result.current.selectedFields).toEqual({
      blogPost: ['jsonField'],
      product: ['metadata'],
    });
  });

  it('should not duplicate selections', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('blogPost');
    });

    expect(result.current.selectedContentTypes).toEqual(['blogPost']); // Toggled odd number of times
    expect(result.current.selectedContentTypes).toHaveLength(1);
  });

  it('should handle single select mode', () => {
    const { result } = renderHook(() => useContentTypeSelection({ multiSelect: false }));

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('product');
    });

    expect(result.current.selectedContentTypes).toEqual(['product']); // Only the last one
  });

  it('should handle field single select mode', () => {
    const { result } = renderHook(() => useContentTypeSelection({ fieldMultiSelect: false }));

    act(() => {
      result.current.toggleField('blogPost', 'jsonField');
      result.current.toggleField('blogPost', 'metadata');
    });

    expect(result.current.selectedFields.blogPost).toEqual(['metadata']); // Only the last one
  });

  it('should clear field selections when content type is deselected', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleField('blogPost', 'jsonField');
      result.current.toggleField('blogPost', 'metadata');
    });

    expect(result.current.selectedFields.blogPost).toEqual(['jsonField', 'metadata']);

    act(() => {
      result.current.toggleContentType('blogPost'); // Deselect content type
    });

    expect(result.current.selectedFields.blogPost).toBeUndefined();
  });

  it('should set selection directly', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.setSelection(['blogPost', 'product'], {
        blogPost: ['jsonField'],
        product: ['metadata'],
      });
    });

    expect(result.current.selectedContentTypes).toEqual(['blogPost', 'product']);
    expect(result.current.selectedFields).toEqual({
      blogPost: ['jsonField'],
      product: ['metadata'],
    });
  });
});
