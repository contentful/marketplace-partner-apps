import React, { useState } from 'react';
import { SelectContentTypeFields, hasJsonFields, jsonFields } from './src/index';

// Mock SDK for example purposes
const mockSdk = {
  cma: {
    contentType: {
      getMany: async ({ query }: any) => ({
        items: [
          {
            sys: { id: 'blogPost' },
            name: 'Blog Post',
            description: 'A blog post content type',
            fields: [
              { id: 'title', name: 'Title', type: 'Symbol' },
              { id: 'content', name: 'Content', type: 'RichText' },
              { id: 'metadata', name: 'Metadata', type: 'Object' },
            ],
          },
          {
            sys: { id: 'product' },
            name: 'Product',
            description: 'A product content type',
            fields: [
              { id: 'name', name: 'Name', type: 'Symbol' },
              { id: 'description', name: 'Description', type: 'RichText' },
              { id: 'specifications', name: 'Specifications', type: 'Object' },
            ],
          },
        ],
        total: 2,
      }),
    },
    editorInterface: {
      get: async ({ contentTypeId }: any) => ({
        controls: contentTypeId === 'blogPost' ? [{ fieldId: 'metadata', widgetId: 'lottie-preview-app', widgetNamespace: 'app' }] : [],
      }),
    },
  },
  ids: { app: 'lottie-preview-app' },
};

const LottiePreviewExample: React.FC = () => {
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Lottie Preview ConfigScreen Example</h2>
      <p>This shows how the SelectContentTypeFields component would be used in the Lottie Preview app.</p>

      <div style={{ marginBottom: '20px' }}>
        <h3>Select JSON Fields for Lottie Preview</h3>
        <SelectContentTypeFields
          cma={mockSdk.cma as any}
          selectedFieldIds={selectedFieldIds}
          onSelectionChange={setSelectedFieldIds}
          contentTypeFilters={[hasJsonFields]} // Only content types with JSON fields
          fieldFilters={[jsonFields]} // Only JSON fields
          appDefinitionId={mockSdk.ids.app} // For checking already configured fields
          placeholder="Select content types and JSON fields..."
          searchable={true}
          renderEmptyState={() => (
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
              No JSON object field types found. Add JSON fields to your content types to use with Lottie Preview.
            </div>
          )}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Selected Fields:</h3>
        <pre>{JSON.stringify(selectedFieldIds, null, 2)}</pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>How it works:</h3>
        <ul>
          <li>
            <strong>Content Type Filtering:</strong> Only shows content types that have JSON Object fields
          </li>
          <li>
            <strong>Field Filtering:</strong> Only shows JSON Object fields within those content types
          </li>
          <li>
            <strong>Editor Interface Checking:</strong> Shows "(Already configured)" for fields that already use the Lottie Preview app
          </li>
          <li>
            <strong>Progress Tracking:</strong> Shows loading progress when fetching many content types
          </li>
          <li>
            <strong>Pagination:</strong> Handles large content models by fetching all content types and editor interfaces
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LottiePreviewExample;
