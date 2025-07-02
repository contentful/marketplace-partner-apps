import React, { useState } from 'react';
import { SelectContentTypes, hasJsonFields, hasRichTextFields } from './src/index';

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
  },
};

const ExampleComponent: React.FC = () => {
  const [selectedContentTypeIds, setSelectedContentTypeIds] = useState<string[]>([]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>SelectContentTypes Example</h2>

      <div style={{ marginBottom: '20px' }}>
        <h3>Basic Usage</h3>
        <SelectContentTypes
          cma={mockSdk.cma as any}
          selectedContentTypeIds={selectedContentTypeIds}
          onSelectionChange={setSelectedContentTypeIds}
          placeholder="Select content types..."
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Filtered (JSON Fields Only)</h3>
        <SelectContentTypes
          cma={mockSdk.cma as any}
          selectedContentTypeIds={selectedContentTypeIds}
          onSelectionChange={setSelectedContentTypeIds}
          filters={[hasJsonFields]}
          placeholder="Select content types with JSON fields..."
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Multiple Filters</h3>
        <SelectContentTypes
          cma={mockSdk.cma as any}
          selectedContentTypeIds={selectedContentTypeIds}
          onSelectionChange={setSelectedContentTypeIds}
          filters={[hasJsonFields, hasRichTextFields]}
          placeholder="Select content types with JSON or Rich Text fields..."
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>Selected Content Types:</h3>
        <pre>{JSON.stringify(selectedContentTypeIds, null, 2)}</pre>
      </div>
    </div>
  );
};

export default ExampleComponent;
