import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFieldSubscriptions } from './useFieldSubscriptions';
import type { SidebarAppSDK } from '@contentful/app-sdk';
import type { Document } from '@contentful/rich-text-types';

type MockField<TValue> = {
  type: string;
  getValue: () => TValue;
  setValue: (v: unknown) => Promise<void> | void;
  onValueChanged: (cb: (v: TValue) => void) => () => void;
};

describe('useFieldSubscriptions', () => {
  let textChange: (v: string) => void;
  let richChange: (v: Document) => void;
  let textSetValue: string | undefined;
  let richSetValue: Document | undefined;

  const richDoc: Document = {
    nodeType: 'document',
    data: {},
    content: [
      {
        nodeType: 'paragraph',
        data: {},
        content: [{ nodeType: 'text', value: 'Hello', marks: [], data: {} } as unknown as Document['content'][number]],
      } as unknown as Document['content'][number],
    ],
  } as Document;

  const makeSdk = (): Pick<SidebarAppSDK, 'entry'> => {
    const textField: MockField<string> = {
      type: 'Text',
      getValue: () => 'initial',
      setValue: async (v: unknown) => {
        textSetValue = v as string;
      },
      onValueChanged: (cb) => {
        textChange = cb;
        return () => {};
      },
    };
    const richField: MockField<Document> = {
      type: 'RichText',
      getValue: () => richDoc,
      setValue: async (v: unknown) => {
        richSetValue = v as Document;
      },
      onValueChanged: (cb) => {
        richChange = cb;
        return () => {};
      },
    };
    const sdk = {
      entry: {
        fields: {
          text: textField,
          rich: richField,
        },
      },
    };
    return sdk as unknown as Pick<SidebarAppSDK, 'entry'>;
  };

  beforeEach(() => {
    textSetValue = undefined;
    richSetValue = undefined;
  });

  it('subscribes to fields, handles initial change suppression, and propagates subsequent changes', () => {
    const onFieldChange = () => {};
    const sdk = makeSdk();
    const { result } = renderHook(() => useFieldSubscriptions(sdk, onFieldChange));

    // First change should be treated as initial and ignored
    act(() => textChange('changed-1'));
    // Now not initial anymore
    expect(result.current.isInitialValue('text')).toBe(false);

    // Rich text change should convert to HTML string
    let received = '';
    const onFieldChangeSpy = (fieldId: string, value: string) => {
      received = `${fieldId}:${value}`;
    };
    const { result: result2 } = renderHook(() => useFieldSubscriptions(sdk, onFieldChangeSpy));
    // Trigger initial change (ignored)
    act(() => richChange(richDoc));
    // Trigger a subsequent change to propagate
    act(() => richChange(richDoc));
    expect(result2.current.isInitialValue('rich')).toBe(false);
    expect(received.startsWith('rich:')).toBe(true);
    expect(received).toContain('<p');
    expect(received).toContain('Hello');
  });

  it('setFieldValue sets values appropriately and prevents duplicate processing', async () => {
    const sdk = makeSdk();
    const { result } = renderHook(() => useFieldSubscriptions(sdk, () => {}));

    // RichText: update by targeting span id 0-0
    await act(async () => {
      await result.current.setFieldValue('rich', '<span id="node-0-0">World</span>');
    });
    expect(richSetValue).toBeTruthy();
    // find updated text in doc
    const updatedText = (richSetValue as Document).content[0] as {
      content: Array<{ nodeType: string; value: string }>;
    };
    expect(updatedText.content[0].value).toBe('World');

    // Calling again should be ignored due to processedFieldsRef
    await act(async () => {
      await result.current.setFieldValue('rich', '<span id="node-0-0">Again</span>');
    });
    // remains previous set
    const updatedText2 = (richSetValue as Document).content[0] as {
      content: Array<{ nodeType: string; value: string }>;
    };
    expect(updatedText2.content[0].value).toBe('World');

    // Text field: direct set
    await act(async () => {
      await result.current.setFieldValue('text', 'new text');
    });
    expect(textSetValue).toBe('new text');
  });
});
