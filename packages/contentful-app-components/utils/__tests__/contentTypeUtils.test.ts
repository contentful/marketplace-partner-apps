import { describe, it, expect } from 'vitest';
import {
  hasJsonFields,
  hasRichTextFields,
  hasAssetFields,
  hasReferenceFields,
  hasArrayFields,
  jsonFields,
  richTextFields,
  assetFields,
  referenceFields,
  arrayFields,
  createFieldTypeFilter,
  applyContentTypeFilters,
  applyFieldFilters,
} from '../contentTypeUtils';
import type { ContentTypeProps, ContentFields } from 'contentful-management';

// Mock content types for testing
const mockContentTypeWithJson: ContentTypeProps = {
  sys: { id: 'blog-post', type: 'ContentType' },
  name: 'Blog Post',
  description: 'A blog post',
  fields: [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'content', name: 'Content', type: 'Object', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithRichText: ContentTypeProps = {
  sys: { id: 'article', type: 'ContentType' },
  name: 'Article',
  description: 'An article',
  fields: [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithAsset: ContentTypeProps = {
  sys: { id: 'product', type: 'ContentType' },
  name: 'Product',
  description: 'A product',
  fields: [
    { id: 'name', name: 'Name', type: 'Text', required: true, localized: false },
    { id: 'image', name: 'Image', type: 'Asset', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithReference: ContentTypeProps = {
  sys: { id: 'author', type: 'ContentType' },
  name: 'Author',
  description: 'An author',
  fields: [
    { id: 'name', name: 'Name', type: 'Text', required: true, localized: false },
    { id: 'posts', name: 'Posts', type: 'Link', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithArray: ContentTypeProps = {
  sys: { id: 'gallery', type: 'ContentType' },
  name: 'Gallery',
  description: 'A gallery',
  fields: [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'images', name: 'Images', type: 'Array', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithMixed: ContentTypeProps = {
  sys: { id: 'mixed', type: 'ContentType' },
  name: 'Mixed',
  description: 'Mixed content type',
  fields: [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'content', name: 'Content', type: 'Object', required: false, localized: false },
    { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
    { id: 'image', name: 'Image', type: 'Asset', required: false, localized: false },
    { id: 'related', name: 'Related', type: 'Link', required: false, localized: false },
    { id: 'tags', name: 'Tags', type: 'Array', required: false, localized: false },
  ],
} as ContentTypeProps;

const mockContentTypeWithNone: ContentTypeProps = {
  sys: { id: 'simple', type: 'ContentType' },
  name: 'Simple',
  description: 'Simple content type',
  fields: [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'description', name: 'Description', type: 'Text', required: false, localized: false },
  ],
} as ContentTypeProps;

describe('Content Type Filters', () => {
  describe('hasJsonFields', () => {
    it('should return true for content type with JSON fields', () => {
      expect(hasJsonFields.test(mockContentTypeWithJson)).toBe(true);
      expect(hasJsonFields.test(mockContentTypeWithMixed)).toBe(true);
    });

    it('should return false for content type without JSON fields', () => {
      expect(hasJsonFields.test(mockContentTypeWithRichText)).toBe(false);
      expect(hasJsonFields.test(mockContentTypeWithNone)).toBe(false);
    });
  });

  describe('hasRichTextFields', () => {
    it('should return true for content type with Rich Text fields', () => {
      expect(hasRichTextFields.test(mockContentTypeWithRichText)).toBe(true);
      expect(hasRichTextFields.test(mockContentTypeWithMixed)).toBe(true);
    });

    it('should return false for content type without Rich Text fields', () => {
      expect(hasRichTextFields.test(mockContentTypeWithJson)).toBe(false);
      expect(hasRichTextFields.test(mockContentTypeWithNone)).toBe(false);
    });
  });

  describe('hasAssetFields', () => {
    it('should return true for content type with Asset fields', () => {
      expect(hasAssetFields.test(mockContentTypeWithAsset)).toBe(true);
      expect(hasAssetFields.test(mockContentTypeWithMixed)).toBe(true);
    });

    it('should return false for content type without Asset fields', () => {
      expect(hasAssetFields.test(mockContentTypeWithJson)).toBe(false);
      expect(hasAssetFields.test(mockContentTypeWithNone)).toBe(false);
    });
  });

  describe('hasReferenceFields', () => {
    it('should return true for content type with Reference fields', () => {
      expect(hasReferenceFields.test(mockContentTypeWithReference)).toBe(true);
      expect(hasReferenceFields.test(mockContentTypeWithMixed)).toBe(true);
    });

    it('should return false for content type without Reference fields', () => {
      expect(hasReferenceFields.test(mockContentTypeWithJson)).toBe(false);
      expect(hasReferenceFields.test(mockContentTypeWithNone)).toBe(false);
    });
  });

  describe('hasArrayFields', () => {
    it('should return true for content type with Array fields', () => {
      expect(hasArrayFields.test(mockContentTypeWithArray)).toBe(true);
      expect(hasArrayFields.test(mockContentTypeWithMixed)).toBe(true);
    });

    it('should return false for content type without Array fields', () => {
      expect(hasArrayFields.test(mockContentTypeWithJson)).toBe(false);
      expect(hasArrayFields.test(mockContentTypeWithNone)).toBe(false);
    });
  });
});

describe('Field Filters', () => {
  const mockJsonField: ContentFields = { id: 'content', name: 'Content', type: 'Object', required: false, localized: false } as ContentFields;
  const mockRichTextField: ContentFields = { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false } as ContentFields;
  const mockAssetField: ContentFields = { id: 'image', name: 'Image', type: 'Asset', required: false, localized: false } as ContentFields;
  const mockReferenceField: ContentFields = { id: 'related', name: 'Related', type: 'Link', required: false, localized: false } as ContentFields;
  const mockArrayField: ContentFields = { id: 'tags', name: 'Tags', type: 'Array', required: false, localized: false } as ContentFields;
  const mockTextField: ContentFields = { id: 'title', name: 'Title', type: 'Text', required: true, localized: false } as ContentFields;

  describe('jsonFields', () => {
    it('should return true for JSON fields', () => {
      expect(jsonFields.test(mockJsonField)).toBe(true);
    });

    it('should return false for non-JSON fields', () => {
      expect(jsonFields.test(mockTextField)).toBe(false);
      expect(jsonFields.test(mockRichTextField)).toBe(false);
    });
  });

  describe('richTextFields', () => {
    it('should return true for Rich Text fields', () => {
      expect(richTextFields.test(mockRichTextField)).toBe(true);
    });

    it('should return false for non-Rich Text fields', () => {
      expect(richTextFields.test(mockTextField)).toBe(false);
      expect(richTextFields.test(mockJsonField)).toBe(false);
    });
  });

  describe('assetFields', () => {
    it('should return true for Asset fields', () => {
      expect(assetFields.test(mockAssetField)).toBe(true);
    });

    it('should return false for non-Asset fields', () => {
      expect(assetFields.test(mockTextField)).toBe(false);
      expect(assetFields.test(mockJsonField)).toBe(false);
    });
  });

  describe('referenceFields', () => {
    it('should return true for Reference fields', () => {
      expect(referenceFields.test(mockReferenceField)).toBe(true);
    });

    it('should return false for non-Reference fields', () => {
      expect(referenceFields.test(mockTextField)).toBe(false);
      expect(referenceFields.test(mockJsonField)).toBe(false);
    });
  });

  describe('arrayFields', () => {
    it('should return true for Array fields', () => {
      expect(arrayFields.test(mockArrayField)).toBe(true);
    });

    it('should return false for non-Array fields', () => {
      expect(arrayFields.test(mockTextField)).toBe(false);
      expect(arrayFields.test(mockJsonField)).toBe(false);
    });
  });
});

describe('createFieldTypeFilter', () => {
  it('should create a filter for a specific field type', () => {
    const textFilter = createFieldTypeFilter('Text');
    const mockTextField: ContentFields = { id: 'title', name: 'Title', type: 'Text', required: true, localized: false } as ContentFields;
    const mockJsonField: ContentFields = { id: 'content', name: 'Content', type: 'Object', required: false, localized: false } as ContentFields;

    expect(textFilter.id).toBe('hasTextFields');
    expect(textFilter.name).toBe('Has Text fields');
    expect(textFilter.test(mockTextField)).toBe(true);
    expect(textFilter.test(mockJsonField)).toBe(false);
  });
});

describe('applyContentTypeFilters', () => {
  const contentTypes = [
    mockContentTypeWithJson,
    mockContentTypeWithRichText,
    mockContentTypeWithAsset,
    mockContentTypeWithReference,
    mockContentTypeWithArray,
    mockContentTypeWithMixed,
    mockContentTypeWithNone,
  ];

  it('should return all content types when no filters are provided', () => {
    const result = applyContentTypeFilters(contentTypes, []);
    expect(result).toEqual(contentTypes);
  });

  it('should filter content types with JSON fields', () => {
    const result = applyContentTypeFilters(contentTypes, [hasJsonFields]);
    expect(result).toHaveLength(2);
    expect(result).toContain(mockContentTypeWithJson);
    expect(result).toContain(mockContentTypeWithMixed);
    expect(result).not.toContain(mockContentTypeWithRichText);
  });

  it('should filter content types with Rich Text fields', () => {
    const result = applyContentTypeFilters(contentTypes, [hasRichTextFields]);
    expect(result).toHaveLength(2);
    expect(result).toContain(mockContentTypeWithRichText);
    expect(result).toContain(mockContentTypeWithMixed);
    expect(result).not.toContain(mockContentTypeWithJson);
  });

  it('should apply multiple filters (AND logic)', () => {
    const result = applyContentTypeFilters(contentTypes, [hasJsonFields, hasRichTextFields]);
    expect(result).toHaveLength(1);
    expect(result).toContain(mockContentTypeWithMixed);
    expect(result).not.toContain(mockContentTypeWithJson);
    expect(result).not.toContain(mockContentTypeWithRichText);
  });

  it('should return empty array when no content types match filters', () => {
    const result = applyContentTypeFilters(contentTypes, [hasJsonFields, hasAssetFields, hasReferenceFields, hasArrayFields]);
    expect(result).toHaveLength(1);
    expect(result).toContain(mockContentTypeWithMixed);
  });
});

describe('applyFieldFilters', () => {
  const fields = [
    { id: 'title', name: 'Title', type: 'Text', required: true, localized: false },
    { id: 'content', name: 'Content', type: 'Object', required: false, localized: false },
    { id: 'body', name: 'Body', type: 'RichText', required: false, localized: false },
    { id: 'image', name: 'Image', type: 'Asset', required: false, localized: false },
    { id: 'related', name: 'Related', type: 'Link', required: false, localized: false },
    { id: 'tags', name: 'Tags', type: 'Array', required: false, localized: false },
  ] as ContentFields[];

  it('should return all fields when no filters are provided', () => {
    const result = applyFieldFilters(fields, []);
    expect(result).toEqual(fields);
  });

  it('should filter JSON fields', () => {
    const result = applyFieldFilters(fields, [jsonFields]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('content');
  });

  it('should filter Rich Text fields', () => {
    const result = applyFieldFilters(fields, [richTextFields]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('body');
  });

  it('should apply multiple filters (AND logic)', () => {
    const result = applyFieldFilters(fields, [jsonFields, richTextFields]);
    expect(result).toHaveLength(0); // No field is both JSON and Rich Text
  });

  it('should filter by custom field type', () => {
    const textFilter = createFieldTypeFilter('Text');
    const result = applyFieldFilters(fields, [textFilter]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('title');
  });
});
