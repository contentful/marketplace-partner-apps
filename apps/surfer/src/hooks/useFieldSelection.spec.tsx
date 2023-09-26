import { act,  renderHook } from '@testing-library/react';
import { useFieldSelection } from './useFieldSelection';
import { SurferCompatibility } from './useSurferCompatibility';

describe('useFieldSelection', () => {
  const fakeCompatibility: SurferCompatibility = {
    compatibleContentTypes: ['foo', 'bar', 'baz'],
    compatibleFields: {
      foo: ['foo1', 'foo2'],
      bar: ['bar1', 'bar2'],
      baz: ['baz1', 'baz2'],
    },
  };

  describe('selectAllCompatible', () => {
    it('should select all compatible content types and fields', () => {
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      act(() => {
        result.current.selectAllCompatible();
      });

      expect(result.current.selectedContentTypes).toEqual(fakeCompatibility.compatibleContentTypes);
      expect(result.current.selectedContentFields).toEqual(fakeCompatibility.compatibleFields);
    });
  });

  describe('selectMany', () => {
    it('should select many content types and fields', () => {
      const { baz: _, ...expectedFields } = fakeCompatibility.compatibleFields;
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      act(() => {
        result.current.selectMany(['foo', 'bar']);
      });

      expect(result.current.selectedContentTypes).toEqual(['foo', 'bar']);
      expect(result.current.selectedContentFields).toStrictEqual(expectedFields);
    });
  });

  describe('toggleContentType', () => {
    it('should toggle content type selection on and off', () => {
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      expect(result.current.selectedContentTypes).toEqual([]);

      act(() => {
        result.current.toggleContentType('foo');
      });

      expect(result.current.selectedContentTypes).toEqual(['foo']);

      act(() => {
        result.current.toggleContentType('foo');
      });

      expect(result.current.selectedContentTypes).toEqual([]);
    });

    it('should select and deselect all compatible fields for a content type by default', () => {
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      act(() => {
        result.current.toggleContentType('foo');
      });

      expect(result.current.selectedContentFields).toEqual({ foo: fakeCompatibility.compatibleFields.foo });

      act(() => {
        result.current.toggleContentType('foo');
      });

      expect(result.current.selectedContentFields).toEqual({});
    });
  });

  describe('toggleField', () => {
    it('should toggle field selection on and off', () => {
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      expect(result.current.selectedContentFields).toEqual({});

      act(() => {
        result.current.toggleField('foo', 'foo1');
      });

      expect(result.current.selectedContentFields).toEqual({ foo: ['foo1'] });

      act(() => {
        result.current.toggleField('foo', 'foo1');
      });

      expect(result.current.selectedContentFields).toEqual({});
    });

    it('should toggle content type selection on and off if the last field is deselected', () => {
      const { result } = renderHook(() => useFieldSelection(fakeCompatibility));

      expect(result.current.selectedContentTypes).toEqual([]);

      act(() => {
        result.current.toggleField('foo', 'foo1');
      });

      expect(result.current.selectedContentTypes).toEqual(['foo']);

      act(() => {
        result.current.toggleField('foo', 'foo1');
      });

      expect(result.current.selectedContentTypes).toEqual([]);
    });

  });
});
