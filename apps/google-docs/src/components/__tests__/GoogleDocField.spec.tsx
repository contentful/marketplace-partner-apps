import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockCma, mockSdk } from '../../../test/mocks';

// Define the mocks before importing the components
vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useCMA: () => mockCma,
  SDKContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children,
    Consumer: ({ children }: { children: (sdk: any) => React.ReactNode }) => children({})
  }
}));

// Create a mock for useGoogleDocs
const mockAuthenticate = vi.fn();
const mockCreateDocument = vi.fn();
const mockFetchDocument = vi.fn();
const mockParseFields = vi.fn();
const mockSetIsAuthenticated = vi.fn();
const mockSetCurrentDocument = vi.fn();

// Mock the useGoogleDocs hook
vi.mock('../hooks/useGoogleDocs', () => ({
  useGoogleDocs: vi.fn().mockImplementation(() => ({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    currentDocument: null,
    documents: [],
    authenticate: mockAuthenticate,
    createDocumentFromContentModel: mockCreateDocument,
    fetchDocumentContent: mockFetchDocument,
    parseDocumentToFields: mockParseFields,
    updateDocumentWithFields: vi.fn(),
    setIsAuthenticated: mockSetIsAuthenticated,
    setCurrentDocument: mockSetCurrentDocument,
    logOut: vi.fn()
  }))
}));

// Define GoogleDocument type
interface GoogleDocument {
  id: string;
  title: string;
  content: string;
  url: string;
}

// Now import the components
import GoogleDocField from '../GoogleDocField';
import { useGoogleDocs } from '../hooks/useGoogleDocs';
import Field from '../../locations/Field';

describe('Field component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock GoogleDocField for Field tests only
    vi.mock('../GoogleDocField', () => ({
      default: () => <div data-testid="google-doc-field">Google Doc Field Mock</div>
    }));
  });
  
  it('includes the app ID information', () => {
    render(<Field />);
    const appIdContainer = screen.getByText(/AppId:/);
    expect(appIdContainer).toBeInTheDocument();
    expect(appIdContainer.parentElement).toHaveTextContent(/test-app/);
  });
});

// Create a separate test file for GoogleDocField components 