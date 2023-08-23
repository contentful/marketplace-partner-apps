import { render, renderHook } from '@testing-library/react';
import { useFieldSelection } from './useFieldSelection';
import { EntryFieldAPI } from '@contentful/app-sdk';

describe('useFieldSelection', () => {
  const fakeFields: EntryFieldAPI[] = [
    { type: 'RichText', id: 'test-id' },
    { type: 'RichText', id: 'test-id2' },
    { type: 'Text', id: 'test-id3' },
    { type: 'Integer', id: 'test-id3' },
  ] as any;

  describe('selectedFields', () => {
    it('by default is an empty array if there are no rich text fields', async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields.slice(2)));

      expect(result.current[0]).toEqual([]);
    });

    it('by default is an array of all rich text fields if there are multiple', async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields));

      expect(result.current[0]).toEqual(fakeFields.slice(0, 2));
    });
  });

  describe('SelectionComponent', () => {
    it('is an empty placeholder if there are no rich text componets', async () => {
      const { result } = renderHook(() => useFieldSelection([]));

      const SelectionComponent = result.current[1];

      expect(render(<SelectionComponent />).container).toBeEmptyDOMElement();
    });

    it("is an empty placeholder if there's only one rich text field", async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields.slice(0, 1)));

      const SelectionComponent = result.current[1];

      expect(SelectionComponent()).toBe(null);
    });

    it('renders a FieldSelection component if there are multiple rich text fields', async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields));

      const SelectionComponent = result.current[1];

      expect(SelectionComponent()).toMatchSnapshot();
    });
  });

  describe('richTextFields', () => {
    it('is an empty array if there are no rich text fields', async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields.slice(2)));

      expect(result.current[2]).toEqual([]);
    });

    it('is an array of all rich text fields if there are multiple', async () => {
      const { result } = renderHook(() => useFieldSelection(fakeFields));

      expect(result.current[2]).toEqual(fakeFields.slice(0, 2));
    });
  });
});
