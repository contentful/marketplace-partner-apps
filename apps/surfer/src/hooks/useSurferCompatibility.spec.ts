import { renderHook } from '@testing-library/react';
import { ContentTypeProps } from 'contentful-management';
import { useSurferCompatibility } from './useSurferCompatibility';

describe('useSurferCompatibility', () => {
  const fakeContentTypes = [
    {
      sys: {
        id: 'compatible',
      },
      name: "I'm compatible",
      fields: [
        {
          id: 'number',
          type: 'number',
        },
        {
          id: 'richText',
          type: 'RichText',
        },
      ],
    },
    {
      sys: {
        id: 'incompatible',
      },
      name: 'I am not compatible :(',
      fields: [
        {
          id: 'test',
          type: 'text',
        },
      ],
    },
    {
      sys: {
        id: 'foo',
      },
      name: 'I am foo',
      fields: [
        {
          id: 'fooText',
          type: 'text',
        },
        {
          id: 'richFoo',
          type: 'RichText',
        },
      ],
    },
  ];

  it('should return a list of compatible content types (containting a RichText field)', () => {
    const { result } = renderHook(() => useSurferCompatibility(fakeContentTypes as ContentTypeProps[]));

    expect(result.current?.compatibleContentTypes).toHaveLength(2);
    expect(result.current?.compatibleContentTypes).toStrictEqual(['compatible', 'foo']);
  });

  it('should return compatible (RichText) fields in each compatible type', () => {
    const { result } = renderHook(() => useSurferCompatibility(fakeContentTypes as ContentTypeProps[]));

    expect(result.current?.compatibleFields).toStrictEqual({ compatible: ['richText'], foo: ['richFoo'] });
  });
});
