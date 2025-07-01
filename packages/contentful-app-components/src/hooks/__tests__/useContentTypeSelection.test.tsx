import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContentTypeSelection } from '../useContentTypeSelection';
import { mockContentTypes } from '../../../test/mocks/mockContentTypes';

describe('useContentTypeSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty selection', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    expect(result.current.selectedContentTypes).toEqual([]);
    expect(result.current.selectedFields).toEqual([]);
    expect(result.current.isContentTypeSelected('blogPost')).toBe(false);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(false);
  });

  it('should initialize with existing selection', () => {
    const initialSelection = {
      contentTypes: ['blogPost'],
      fields: [{ contentTypeId: 'blogPost', fieldId: 'jsonField' }],
    };

    const { result } = renderHook(() => useContentTypeSelection(initialSelection));

    expect(result.current.selectedContentTypes).toEqual(['blogPost']);
    expect(result.current.selectedFields).toEqual([{ contentTypeId: 'blogPost', fieldId: 'jsonField' }]);
    expect(result.current.isContentTypeSelected('blogPost')).toBe(true);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(true);
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

    expect(result.current.selectedFields).toEqual([{ contentTypeId: 'blogPost', fieldId: 'jsonField' }]);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(true);

    act(() => {
      result.current.toggleField('blogPost', 'jsonField');
    });

    expect(result.current.selectedFields).toEqual([]);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(false);
  });

  it('should select all fields of a content type', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.selectAllFields('blogPost', ['jsonField', 'title']);
    });

    expect(result.current.selectedFields).toEqual([
      { contentTypeId: 'blogPost', fieldId: 'jsonField' },
      { contentTypeId: 'blogPost', fieldId: 'title' },
    ]);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(true);
    expect(result.current.isFieldSelected('blogPost', 'title')).toBe(true);
  });

  it('should clear all selections', () => {
    const initialSelection = {
      contentTypes: ['blogPost', 'product'],
      fields: [
        { contentTypeId: 'blogPost', fieldId: 'jsonField' },
        { contentTypeId: 'product', fieldId: 'metadata' },
      ],
    };

    const { result } = renderHook(() => useContentTypeSelection(initialSelection));

    act(() => {
      result.current.clearAll();
    });

    expect(result.current.selectedContentTypes).toEqual([]);
    expect(result.current.selectedFields).toEqual([]);
    expect(result.current.isContentTypeSelected('blogPost')).toBe(false);
    expect(result.current.isContentTypeSelected('product')).toBe(false);
    expect(result.current.isFieldSelected('blogPost', 'jsonField')).toBe(false);
    expect(result.current.isFieldSelected('product', 'metadata')).toBe(false);
  });

  it('should get selected fields for a content type', () => {
    const initialSelection = {
      contentTypes: ['blogPost'],
      fields: [
        { contentTypeId: 'blogPost', fieldId: 'jsonField' },
        { contentTypeId: 'product', fieldId: 'metadata' },
      ],
    };

    const { result } = renderHook(() => useContentTypeSelection(initialSelection));

    expect(result.current.getSelectedFieldsForContentType('blogPost')).toEqual(['jsonField']);
    expect(result.current.getSelectedFieldsForContentType('product')).toEqual(['metadata']);
    expect(result.current.getSelectedFieldsForContentType('nonexistent')).toEqual([]);
  });

  it('should handle multiple content types and fields', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('product');
      result.current.toggleField('blogPost', 'jsonField');
      result.current.toggleField('product', 'metadata');
    });

    expect(result.current.selectedContentTypes).toEqual(['blogPost', 'product']);
    expect(result.current.selectedFields).toEqual([
      { contentTypeId: 'blogPost', fieldId: 'jsonField' },
      { contentTypeId: 'product', fieldId: 'metadata' },
    ]);
  });

  it('should not duplicate selections', () => {
    const { result } = renderHook(() => useContentTypeSelection());

    act(() => {
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('blogPost');
      result.current.toggleContentType('blogPost');
    });

    expect(result.current.selectedContentTypes).toEqual([]); // Toggled odd number of times
    expect(result.current.selectedContentTypes).toHaveLength(0);
  });
});
