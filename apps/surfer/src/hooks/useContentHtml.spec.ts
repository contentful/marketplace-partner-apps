import { renderHook } from '@testing-library/react';
import { useContentHtml } from './useContentHtml';
import { EntryFieldAPI } from '@contentful/app-sdk';

describe('useContentHtml', () => {
  const fakeFields: EntryFieldAPI[] = [
    { id: 'field1', onValueChanged: jest.fn() },
    { id: 'field2', onValueChanged: jest.fn() },
    { id: 'field3', onValueChanged: jest.fn() },
    { id: 'field4', onValueChanged: jest.fn() },
  ] as any;

  const fakeSelectedFields = fakeFields.slice(2).map(({ id }) => id);

  it('subscribes to all selected fields on change events only once', () => {
    const { rerender } = renderHook(() => useContentHtml(fakeFields, fakeSelectedFields));

    rerender();
    rerender();

    fakeFields.slice(2).forEach((field) => {
      expect(field.onValueChanged).toHaveBeenCalledTimes(1);
    });

    fakeFields.slice(0, 2).forEach((field) => {
      expect(field.onValueChanged).not.toHaveBeenCalled();
    });
  });

  it('returns the html of the selected fields', () => {
    const fieldsWithValues = fakeFields.map((field) => ({
      ...field,
      onValueChanged: jest.fn((cb) =>
        cb({
          content: [
            {
              content: [
                {
                  marks: [],
                  value: field.id,
                  nodeType: 'text',
                },
              ],
              nodeType: 'paragraph',
            },
          ],
          nodeType: 'document',
        })
      ),
    }));
    const { result } = renderHook(() => useContentHtml(fieldsWithValues, fakeSelectedFields));

    expect(result.current).toBe('<p>field3</p><p>field4</p>');
  });
});
