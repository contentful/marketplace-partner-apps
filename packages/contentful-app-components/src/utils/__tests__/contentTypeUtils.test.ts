import { describe, it, expect } from 'vitest';
import { groupFieldsByContentType } from '../contentTypeUtils';

interface TestField {
  contentTypeId: string;
  fieldId: string;
  name: string;
}

describe('groupFieldsByContentType', () => {
  it('should group fields by content type ID', () => {
    const fields: TestField[] = [
      { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
      { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
      { contentTypeId: 'product', fieldId: 'name', name: 'Name' },
      { contentTypeId: 'product', fieldId: 'price', name: 'Price' },
      { contentTypeId: 'author', fieldId: 'bio', name: 'Bio' },
    ];

    const result = groupFieldsByContentType(fields);

    expect(result).toEqual({
      'blog-post': [
        { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
        { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
      ],
      product: [
        { contentTypeId: 'product', fieldId: 'name', name: 'Name' },
        { contentTypeId: 'product', fieldId: 'price', name: 'Price' },
      ],
      author: [{ contentTypeId: 'author', fieldId: 'bio', name: 'Bio' }],
    });
  });

  it('should handle empty array', () => {
    const fields: TestField[] = [];
    const result = groupFieldsByContentType(fields);
    expect(result).toEqual({});
  });

  it('should handle single field', () => {
    const fields: TestField[] = [{ contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' }];

    const result = groupFieldsByContentType(fields);

    expect(result).toEqual({
      'blog-post': [{ contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' }],
    });
  });

  it('should handle fields with same content type ID', () => {
    const fields: TestField[] = [
      { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
      { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
      { contentTypeId: 'blog-post', fieldId: 'author', name: 'Author' },
    ];

    const result = groupFieldsByContentType(fields);

    expect(result).toEqual({
      'blog-post': [
        { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
        { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
        { contentTypeId: 'blog-post', fieldId: 'author', name: 'Author' },
      ],
    });
  });

  it('should work with different field types', () => {
    interface ComplexField {
      contentTypeId: string;
      fieldId: string;
      name: string;
      type: string;
      required: boolean;
    }

    const fields: ComplexField[] = [
      { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title', type: 'Text', required: true },
      { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content', type: 'Object', required: false },
      { contentTypeId: 'product', fieldId: 'name', name: 'Name', type: 'Text', required: true },
      { contentTypeId: 'product', fieldId: 'price', name: 'Price', type: 'Number', required: false },
    ];

    const result = groupFieldsByContentType(fields);

    expect(result).toEqual({
      'blog-post': [
        { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title', type: 'Text', required: true },
        { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content', type: 'Object', required: false },
      ],
      product: [
        { contentTypeId: 'product', fieldId: 'name', name: 'Name', type: 'Text', required: true },
        { contentTypeId: 'product', fieldId: 'price', name: 'Price', type: 'Number', required: false },
      ],
    });
  });

  it('should preserve field order within groups', () => {
    const fields: TestField[] = [
      { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
      { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
      { contentTypeId: 'blog-post', fieldId: 'author', name: 'Author' },
    ];

    const result = groupFieldsByContentType(fields);

    expect(result['blog-post']).toEqual([
      { contentTypeId: 'blog-post', fieldId: 'content', name: 'Content' },
      { contentTypeId: 'blog-post', fieldId: 'title', name: 'Title' },
      { contentTypeId: 'blog-post', fieldId: 'author', name: 'Author' },
    ]);
  });
});
