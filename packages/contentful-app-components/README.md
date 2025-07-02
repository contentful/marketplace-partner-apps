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
