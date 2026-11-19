import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Define the SDK before mocking modules
const mockSdk = {
  field: {
    getValue: vi.fn(),
    setValue: vi.fn(),
    id: 'googleDocId'
  },
  contentType: {
    fields: [
      { id: 'title', name: 'Title', type: 'Symbol' },
      { id: 'description', name: 'Description', type: 'Text' },
      { id: 'publishDate', name: 'Publish Date', type: 'Date' },
      { id: 'isPublished', name: 'Is Published', type: 'Boolean' }
    ]
  },
  parameters: {
    installation: {
      googleDocsClientId: 'test-client-id'
    }
  }
};

// Mock functions for useGoogleDocs
const mockAuthenticate = vi.fn();
const mockCreateDocument = vi.fn().mockImplementation(() => Promise.resolve({}));
const mockFetchDocument = vi.fn().mockImplementation(() => Promise.resolve({}));
const mockParseFields = vi.fn().mockReturnValue({});
const mockUpdateDocument = vi.fn().mockImplementation(() => Promise.resolve({}));

// Create a base hook return value
const createBaseHookValue = (overrides = {}) => ({
  isAuthenticated: false,
  isLoading: false,
  error: null,
  currentDocument: null,
  documents: [],
  authenticate: mockAuthenticate,
  createDocumentFromContentModel: mockCreateDocument,
  fetchDocumentContent: mockFetchDocument,
  parseDocumentToFields: mockParseFields,
  updateDocumentWithFields: mockUpdateDocument,
  setIsAuthenticated: vi.fn(),
  setCurrentDocument: vi.fn(),
  logOut: vi.fn(),
  ...overrides
});

// Hook mock
const useGoogleDocsMock = vi.fn().mockImplementation(() => createBaseHookValue());

// Set up mocks before importing the components
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => ({}),
  SDKContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (sdk: any) => React.ReactNode }) => children({})
  }
}));

// Mock the useGoogleDocs hook
vi.mock('../hooks/useGoogleDocs', () => ({
  useGoogleDocs: () => useGoogleDocsMock()
}));

// Define GoogleDocument type
interface GoogleDocument {
  id: string;
  title: string;
  content: string;
  url: string;
}

// Import the component after mocking
import GoogleDocField from '../GoogleDocField';

describe('GoogleDocField component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSdk.field.getValue.mockReset();
    mockSdk.field.setValue.mockReset();
    useGoogleDocsMock.mockImplementation(() => createBaseHookValue());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should show loading state when isLoading is true', () => {
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ isLoading: true })
    );

    render(<GoogleDocField />);
    
    // Use getAllByText to get all loading elements
    const loadingElements = screen.getAllByText(/Loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should show error state when there is an error', () => {
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ error: new Error('Authentication failed') })
    );

    render(<GoogleDocField />);
    expect(screen.getByText(/Error/i)).toBeInTheDocument();
    expect(screen.getByText(/Authentication failed/i)).toBeInTheDocument();
  });

  it('should show authentication button when not authenticated', () => {
    render(<GoogleDocField />);
    
    const authButton = screen.getByRole('button', { name: /Authenticate/i });
    expect(authButton).toBeInTheDocument();
    
    fireEvent.click(authButton);
    expect(mockAuthenticate).toHaveBeenCalledTimes(1);
  });

  it('should show create document button when authenticated but no document exists', () => {
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ isAuthenticated: true })
    );

    render(<GoogleDocField />);
    
    const createButton = screen.getByRole('button', { name: /Create Document/i });
    expect(createButton).toBeInTheDocument();
    
    fireEvent.click(createButton);
    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
  });

  it('should show document interface when authenticated and document exists', () => {
    const mockDocument: GoogleDocument = {
      id: 'doc-123',
      title: 'Test Document',
      url: 'https://docs.google.com/document/d/doc-123',
      content: '<p>Title: Test Title</p><p>Description: Test Description</p>'
    };
    
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ 
        isAuthenticated: true,
        currentDocument: mockDocument
      })
    );

    render(<GoogleDocField />);
    
    expect(screen.getByText('Test Document')).toBeInTheDocument();
    expect(screen.getByText('Open in Google Docs').closest('a')).toHaveAttribute('href', mockDocument.url);
    
    const syncButton = screen.getByRole('button', { name: /Sync from Google Docs/i });
    expect(syncButton).toBeInTheDocument();
    
    fireEvent.click(syncButton);
    expect(mockParseFields).toHaveBeenCalledTimes(1);
  });

  it('should fetch document on mount if a document ID exists', async () => {
    mockSdk.field.getValue.mockReturnValue('doc-123');
    
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ isAuthenticated: true })
    );

    render(<GoogleDocField />);
    
    await waitFor(() => {
      expect(mockFetchDocument).toHaveBeenCalledTimes(1);
      expect(mockFetchDocument).toHaveBeenCalledWith('doc-123');
    });
  });

  it('should not fetch document on mount if not authenticated', () => {
    mockSdk.field.getValue.mockReturnValue('doc-123');
    
    render(<GoogleDocField />);
    
    expect(mockFetchDocument).not.toHaveBeenCalled();
  });

  it('should handle errors during sync operation', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const mockDocument = {
      id: 'doc-123',
      title: 'Test Document',
      url: 'https://docs.google.com/document/d/doc-123',
      content: '<p>Test content</p>'
    };
    
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ 
        isAuthenticated: true,
        currentDocument: mockDocument,
        parseDocumentToFields: vi.fn().mockImplementation(() => {
          throw new Error('Parsing error');
        })
      })
    );

    render(<GoogleDocField />);
    
    const syncButton = screen.getByRole('button', { name: /Sync from Google Docs/i });
    fireEvent.click(syncButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Error syncing from docs:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  it('should handle errors during document creation', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    useGoogleDocsMock.mockImplementation(() => 
      createBaseHookValue({ 
        isAuthenticated: true,
        createDocumentFromContentModel: vi.fn().mockRejectedValue(new Error('Creation error'))
      })
    );

    render(<GoogleDocField />);
    
    const createButton = screen.getByRole('button', { name: /Create Document/i });
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error creating document:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
}); 