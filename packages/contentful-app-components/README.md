# @contentful/app-components

Reusable components for Contentful apps that need to select content types and fields.

## Installation

```bash
npm install @contentful/app-components
```

## Components

### SelectContentTypes

A simple autocomplete component for selecting content types.

```tsx
import { SelectContentTypes, hasJsonFields } from '@contentful/app-components';

const MyConfigScreen = () => {
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<string[]>([]);

  return (
    <SelectContentTypes
      cma={sdk.cma}
      selectedContentTypeIds={selectedContentTypeIds}
      onSelectionChange={setSelectedContentTypeIds}
      filters={[hasJsonFields]} // Only show content types with JSON fields
      placeholder="Select content types..."
      searchable={true}
    />
  );
};
```

### SelectContentTypeFields

A more advanced component for selecting specific fields within content types. This component handles fetching editor interfaces and can show which fields are already configured for your app.

```tsx
import { SelectContentTypeFields, hasJsonFields, jsonFields } from '@contentful/app-components';

const MyConfigScreen = () => {
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  return (
    <SelectContentTypeFields
      cma={sdk.cma}
      selectedFieldIds={selectedFieldIds}
      onSelectionChange={setSelectedFieldIds}
      contentTypeFilters={[hasJsonFields]} // Only content types with JSON fields
      fieldFilters={[jsonFields]} // Only JSON fields
      appDefinitionId={sdk.ids.app} // For checking already configured fields
      placeholder="Select content types and JSON fields..."
      searchable={true}
    />
  );
};
```

## Hooks

### useContentTypes

A hook for fetching content types with pagination, search, and filtering support.

```tsx
import { useContentTypes, hasJsonFields } from '@contentful/app-components';

const MyComponent = () => {
  const { contentTypes, loading, error, hasMore, loadMore, search } = useContentTypes(sdk.cma, {
    filters: [hasJsonFields],
    onProgress: (processed, total) => {
      console.log(`Loaded ${processed} of ${total} content types`);
    },
  });

  // Use the hook data...
};
```

### useContentTypeFields

A hook for fetching content types with their fields and editor interfaces. This is useful for apps that need to know which fields are already configured.

```tsx
import { useContentTypeFields, hasJsonFields, jsonFields } from '@contentful/app-components';

const MyComponent = () => {
  const { contentTypesWithFields, loading, error, hasMore, loadMore, search, progress } = useContentTypeFields(sdk.cma, {
    contentTypeFilters: [hasJsonFields],
    fieldFilters: [jsonFields],
    appDefinitionId: sdk.ids.app,
    onProgress: (processed, total) => {
      console.log(`Loaded ${processed} of ${total} content types`);
    },
  });

  // Use the hook data...
};
```

## Utilities

### Content Type Filters

Pre-built filters for common content type filtering needs:

- `hasJsonFields` - Content types with JSON Object fields
- `hasRichTextFields` - Content types with Rich Text fields
- `hasAssetFields` - Content types with Asset fields
- `hasReferenceFields` - Content types with Reference fields
- `hasArrayFields` - Content types with Array fields

### Field Filters

Pre-built filters for field filtering:

- `jsonFields` - JSON Object fields
- `richTextFields` - Rich Text fields
- `assetFields` - Asset fields
- `referenceFields` - Reference fields
- `arrayFields` - Array fields

### API Helpers

Utility functions for API operations:

- `retryWithBackoff` - Retry API calls with exponential backoff
- `debounce` - Debounce function calls
- `withTimeout` - Add timeout to promises
- `processInBatches` - Process items in batches with delays

## Features

- **Pagination**: Load content types in batches with infinite scroll
- **Search**: Search content types after typing 2+ characters
- **Filtering**: Filter content types and fields by various criteria
- **Optimized Performance**: Batch processing with 10 items per batch to maximize throughput without hitting rate limits
- **Progress Tracking**: Track loading progress for large content models
- **Error Handling**: Robust error handling with retry logic
- **TypeScript**: Full TypeScript support with type definitions

## Usage Examples

### Basic Content Type Selection

```tsx
<SelectContentTypes cma={sdk.cma} selectedContentTypeIds={selectedIds} onSelectionChange={setSelectedIds} placeholder="Choose content types..." />
```

### Filtered Content Type Selection

```tsx
<SelectContentTypes
  cma={sdk.cma}
  selectedContentTypeIds={selectedIds}
  onSelectionChange={setSelectedIds}
  filters={[hasJsonFields, hasRichTextFields]}
  placeholder="Select content types with JSON or Rich Text fields..."
/>
```

### Custom Empty State

```tsx
<SelectContentTypes
  cma={sdk.cma}
  selectedContentTypeIds={selectedIds}
  onSelectionChange={setSelectedIds}
  renderEmptyState={() => <Note variant="neutral">No content types found matching your criteria.</Note>}
/>
```

## Development

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Watch for changes
npm run dev
```
