import React, { useState } from 'react';
import { SelectContentTypes, SelectContentTypeFields, hasJsonFields, jsonFields, hasRichTextFields, richTextFields } from './src/index';

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
          {
            sys: { id: 'page' },
            name: 'Page',
            description: 'A page content type',
            fields: [
              { id: 'title', name: 'Title', type: 'Symbol' },
              { id: 'body', name: 'Body', type: 'RichText' },
            ],
          },
        ],
        total: 3,
      }),
    },
    editorInterface: {
      get: async ({ contentTypeId }: any) => ({
        controls: contentTypeId === 'blogPost' ? [{ fieldId: 'metadata', widgetId: 'my-app', widgetNamespace: 'app' }] : [],
      }),
    },
  },
  ids: { app: 'my-app' },
};

const Example: React.FC = () => {
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<string[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);

  return (
    <div style={{ padding: '20px', maxWidth: '1000px' }}>
      <h1>Contentful App Components Examples</h1>

      <div style={{ marginBottom: '40px' }}>
        <h2>1. Simple Content Type Selection</h2>
        <p>Use this when you just need to select content types. Fetches all content types and provides client-side search.</p>

        <div style={{ marginBottom: '20px' }}>
          <h3>Select Content Types</h3>
          <SelectContentTypes
            cma={mockSdk.cma as any}
            selectedContentTypeIds={selectedContentTypeIds}
            onSelectionChange={setSelectedContentTypeIds}
            placeholder="Choose content types..."
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Selected Content Types:</h3>
          <pre>{JSON.stringify(selectedContentTypeIds, null, 2)}</pre>
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>2. Advanced Field Selection</h2>
        <p>Use this when you need to select specific fields within content types, with field type filtering.</p>

        <div style={{ marginBottom: '20px' }}>
          <h3>Select JSON Fields Only</h3>
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
                No JSON object field types found. Add JSON fields to your content types to use with this app.
              </div>
            )}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Selected Fields:</h3>
          <pre>{JSON.stringify(selectedFieldIds, null, 2)}</pre>
        </div>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>Component Comparison</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>Feature</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>SelectContentTypes</th>
              <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>SelectContentTypeFields</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Use Case</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Simple content type selection</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Field-level selection with filtering</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Field Filtering</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>❌ No</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Search</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>✅ Client-side (name & description)</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>✅ Server-side + client-side</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Editor Interface</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>❌ No</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Progress Tracking</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>❌ No</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>✅ Yes</td>
            </tr>
            <tr>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Performance</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Fast (content types only)</td>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>Slower (content types + editor interfaces)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Example;
