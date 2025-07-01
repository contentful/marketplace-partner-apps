# @contentful/app-components

Reusable components for Contentful apps that provide common functionality for content type selection, field filtering, and app configuration.

## Installation

```bash
npm install @contentful/app-components
```

## Components

### ContentTypeSelector

A basic content type selector component for simple content type selection without field drilling.

```tsx
import { ContentTypeSelector } from '@contentful/app-components';

function MyConfigScreen() {
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

  return (
    <ContentTypeSelector
      selectedContentTypes={selectedContentTypes}
      onSelectionChange={setSelectedContentTypes}
      filters={[
        { type: 'fieldType', value: 'Object' }, // Only show content types with JSON fields
      ]}
      multiSelect={true}
      searchable={true}
    />
  );
}
```

### ContentTypeSelectorWithFields

A content type selector with field-level selection capabilities.

```tsx
import { ContentTypeSelectorWithFields } from '@contentful/app-components';

function MyConfigScreen() {
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedFields, setSelectedFields] = useState<Record<string, string[]>>({});

  return (
    <ContentTypeSelectorWithFields
      selectedContentTypes={selectedContentTypes}
      selectedFields={selectedFields}
      onSelectionChange={setSelectedContentTypes}
      onFieldSelectionChange={(contentTypeId, fieldIds) => {
        setSelectedFields((prev) => ({
          ...prev,
          [contentTypeId]: fieldIds,
        }));
      }}
      fieldFilters={[
        { type: 'fieldType', value: 'Object' }, // Only show JSON fields
      ]}
      multiSelect={true}
      searchable={true}
    />
  );
}
```

## Hooks

### useContentTypes

Hook for fetching and managing content types with filtering and pagination.

#### Pagination

The hook supports automatic pagination to handle large content models:

- **Automatic pagination** (default): Automatically fetches all content types in batches of 1000
- **Manual pagination**: Set `fetchAll: false` to manually control pagination with `loadMore()`

```tsx
// Automatic pagination (default behavior)
const { contentTypes, loading, error } = useContentTypes({
  limit: 1000, // Batch size for fetching
  fetchAll: true, // Default - automatically fetch all content types
});

// Manual pagination (for advanced use cases)
const { contentTypes, hasMore, loadMore, isLoadingMore } = useContentTypes({
  limit: 100,
  fetchAll: false, // Manual pagination
});
```

```tsx
import { useContentTypes } from '@contentful/app-components';

function MyComponent() {
  const { contentTypes, loading, error, total } = useContentTypes({
    filters: [{ type: 'fieldType', value: 'Object' }],
    limit: 1000, // Batch size for fetching
    fetchAll: true, // Default - automatically fetch all content types
    onProgress: (processed, total) => {
      console.log(`Processed ${processed} of ${total} content types`);
    },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {contentTypes.map((contentType) => (
        <div key={contentType.sys.id}>{contentType.name}</div>
      ))}
    </div>
  );
}
```

### useContentTypeSelection

Hook for managing content type and field selection state.

```tsx
import { useContentTypeSelection } from '@contentful/app-components';

function MyComponent() {
  const { selectedContentTypes, selectedFields, toggleContentType, toggleField, setSelection, clearSelection } = useContentTypeSelection({
    initialSelection: ['contentType1', 'contentType2'],
    multiSelect: true,
  });

  return (
    <div>
      <button onClick={() => toggleContentType('contentType1')}>Toggle Content Type 1</button>
      <button onClick={() => toggleField('contentType1', 'field1')}>Toggle Field 1</button>
      <button onClick={clearSelection}>Clear All</button>
    </div>
  );
}
```

## Filters

### Content Type Filters

```tsx
// Filter by field type
{ type: 'fieldType', value: 'Object' }

// Filter by name
{ type: 'name', value: 'Product', operator: 'contains' }

// Custom filter function
{
  type: 'custom',
  value: (contentType) => contentType.fields.length > 5
}
```

### Field Filters

```tsx
// Filter by field type
{ type: 'fieldType', value: 'RichText' }

// Filter by required fields
{ type: 'required', value: true }

// Filter by localized fields
{ type: 'localized', value: true }
```

## Pre-built Filters

```tsx
import { filters } from '@contentful/app-components';

// Common content type filters
filters.hasJsonFields;
filters.hasRichTextFields;
filters.hasAssetFields;
filters.hasReferenceFields;

// Common field filters
filters.requiredFields;
filters.localizedFields;
filters.jsonFields;
filters.richTextFields;
```

## API Utilities

```tsx
import { processContentTypesInBatches, withRetry, withProgress } from '@contentful/app-components';

// Process content types in batches
const results = await processContentTypesInBatches(
  cma,
  async (contentType) => {
    // Process each content type
    return await someAsyncOperation(contentType);
  },
  { batchSize: 10, delay: 1000 }
);

// Retry with exponential backoff
const result = await withRetry(() => apiCall(), { maxRetries: 3, baseDelay: 1000 });

// Process with progress tracking
const results = await withProgress(
  items,
  async (item, index) => {
    return await processItem(item);
  },
  (processed, total) => {
    console.log(`Processed ${processed} of ${total}`);
  }
);
```

## License

MIT
