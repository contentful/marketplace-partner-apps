import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { describe, it, expect } from 'vitest';
import { useJsonFieldsState } from './useJsonFieldsState';

const mockFields = [
  {
    contentTypeId: 'blogPost',
    contentTypeName: 'Blog Post',
    fieldId: 'lottie',
    fieldName: 'Lottie',
    isEnabled: true,
    originalEnabled: true,
  },
];

describe('useJsonFieldsState', () => {
  it('initializes state and ref', async () => {
    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(mockFields);
    });

    expect(result.current.jsonFields).toEqual(mockFields);
    expect(result.current.jsonFieldsRef.current).toEqual(mockFields);
  });

  it('updates a field', async () => {
    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(mockFields);
      result.current.updateField('blogPost', 'lottie', { isEnabled: false });
    });

    const field = result.current.jsonFields[0];
    expect(field.isEnabled).toBe(false);
  });

  it('resets originalEnabled to match isEnabled', async () => {
    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(mockFields);
      result.current.updateField('blogPost', 'lottie', { isEnabled: false });
      result.current.resetOriginalState();
    });

    const field = result.current.jsonFields[0];
    expect(field.originalEnabled).toBe(false);
  });

  it('replaces previous state when initialize is called again', async () => {
    const initial = [mockFields[0]];
    const newFields = [
      {
        contentTypeId: 'newType',
        contentTypeName: 'New Type',
        fieldId: 'newField',
        fieldName: 'New Field',
        isEnabled: false,
        originalEnabled: false,
      },
    ];

    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(initial);
      result.current.initialize(newFields);
    });

    expect(result.current.jsonFields).toEqual(newFields);
    expect(result.current.jsonFieldsRef.current).toEqual(newFields);
  });

  it('leaves state unchanged when resetOriginalState is called without updates', async () => {
    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(mockFields);
      result.current.resetOriginalState();
    });

    expect(result.current.jsonFields).toEqual(mockFields);
  });

  it('does nothing when updating a non-existent field', async () => {
    const { result } = renderHook(() => useJsonFieldsState());

    await act(async () => {
      result.current.initialize(mockFields);
      result.current.updateField('doesNotExist', 'notReal', { isEnabled: true });
    });

    expect(result.current.jsonFields).toEqual(mockFields);
  });
});
