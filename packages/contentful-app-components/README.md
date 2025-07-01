# @contentful/app-components

Reusable components for Contentful apps, extracted from the Lottie Preview app.

## Usage

### In the current monorepo (development)

The package is currently located in `packages/contentful-app-components` and is linked to apps via file dependencies.

To build and use:

```bash
# Build the package first
cd packages/contentful-app-components
npm run build

# Install in the app
cd ../../apps/lottie-preview
npm install

# Build the app
npm run build
```

Or use the convenience script:

```bash
./build-packages-first.sh
```

### When moved to its own repository (future)

Once this package is moved to its own repository and published to npm, apps can use it like any other npm package:

```bash
npm install @contentful/app-components
```

## Components

### ContentTypeSelector

Simple content type selection without editor interface logic.

```tsx
import { ContentTypeSelector } from '@contentful/app-components';

<ContentTypeSelector contentTypes={contentTypes} selectedContentTypeIds={selectedIds} onSelectionChange={setSelectedIds} multiSelect={true} />;
```

### ContentTypeFieldSelector

Field-level selection with editor interface integration (used by Lottie Preview).

```tsx
import { ContentTypeFieldSelector } from '@contentful/app-components';

<ContentTypeFieldSelector
  contentTypes={contentTypes}
  selectedFieldIds={selectedFieldIds}
  contentTypesWithEditorInterfaces={contentTypesWithEditorInterfaces}
  appDefinitionId={sdk.ids.app}
  onSelectionChange={setSelectedFieldIds}
  multiSelect={true}
/>;
```

## Hooks

### useContentTypes

Basic content type fetching with filtering and pagination.

### useContentTypesWithEditorInterfaces

Content type fetching with editor interface integration for determining current app configuration.

## Utilities

### Filters

Pre-built filters for common use cases:

```tsx
import { filters } from '@contentful/app-components';

// Content type filters
filters.hasJsonFields;
filters.hasRichTextFields;
filters.hasAssetFields;

// Field filters
filters.jsonFields;
filters.requiredFields;
filters.localizedFields;
```

## Architecture Notes

This package is designed to be:

1. **Self-contained** - All dependencies are properly declared
2. **Type-safe** - Full TypeScript support with proper type exports
3. **Reusable** - Components can be used by multiple Contentful apps
4. **Extensible** - Easy to add new components and utilities

When moving to its own repository:

1. Update the package name if needed
2. Publish to npm
3. Update apps to use the published version instead of file dependencies
4. Remove the package from this monorepo
