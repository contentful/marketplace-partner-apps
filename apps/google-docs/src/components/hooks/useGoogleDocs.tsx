import { useState, useCallback, useEffect } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import { ConfigAppSDK, FieldAppSDK } from '@contentful/app-sdk';
import { 
  initGoogleApi, 
  createDocument,
  fetchDocument,
  updateDocument,
  GoogleDocument,
  logout
} from './googleApiClient';

/*
* Cursor AI Read: In tandem with the GoogleDocField.tsx file, please create the necessary hooks to handle the logic.
* Please also create the necessary tests to ensure the logic works as expected.
* Please also create the necessary side effects to handle the logic.
* Please also create the necessary functions to handle the logic.
* Please also create the necessary components to integrate with the Google Doc Fields.
* 
* Please read the description of the GoogleDocField.tsx file for more information on the logic and requirements.
* The GoogleDocField.tsx file is the main component that will be used to display the Google Doc in the Contentful entry editor.
* Therefore this file will be used to define and implement the necessary logic for the Contentful Fields and Content Model to interact with the Google Docs.
*/

// Types for our hook
export interface ContentModel {
  fields: ContentModelField[];
}

export interface ContentModelField {
  id: string;
  name: string;
  type: string;
  value?: any;
}

export interface DocumentFieldValues {
  [key: string]: any;
}

/**
 * Custom hook for Google Docs integration with Contentful
 */
export const useGoogleDocs = () => {
  const sdk = useSDK<FieldAppSDK | ConfigAppSDK>();
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [documents, setDocuments] = useState<GoogleDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<GoogleDocument | null>(null);
  
  // Get the client ID from app parameters
  const clientId = sdk.parameters?.installation?.googleDocsClientId || '';
  
  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      if (!clientId) {
        setError(new Error('Google Docs client ID not configured'));
        return;
      }
      
      try {
        setIsLoading(true);
        await initGoogleApi(clientId);
        setIsAuthenticated(true);
        setError(null);
      } catch (err) {
        console.error('Error initializing Google API:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [clientId]);
  
  /**
   * Authenticate with Google
   */
  const authenticate = useCallback(async () => {
    if (!clientId) {
      setError(new Error('Google Docs client ID not configured'));
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      await initGoogleApi(clientId);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [clientId]);
  
  /**
   * Log out from Google
   */
  const logOut = useCallback(() => {
    logout();
    setIsAuthenticated(false);
    setCurrentDocument(null);
  }, []);
  
  /**
   * Create a Google Doc template from a Contentful content model
   */
  const createDocumentFromContentModel = useCallback(async (contentModel: ContentModel) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with Google');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate a title based on the entry or content type
      let title = 'Contentful Content';
      if ('field' in sdk && sdk.entry) {
        const entryId = sdk.entry.getSys().id;
        title = `Contentful - ${entryId}`;
      }
      
      // Generate document content with a template for each field
      let content = '<h1>Contentful Content</h1>\n\n';
      
      contentModel.fields.forEach(field => {
        content += `<h2>${field.name}</h2>\n`;
        content += `<p>${field.name}: ${getFieldPlaceholder(field)}</p>\n\n`;
      });
      
      const document = await createDocument({
        title,
        content
      });
      
      setCurrentDocument(document);
      setDocuments(prev => [...prev, document]);
      
      // If we're in a field editor, store the document ID in the field
      if ('field' in sdk) {
        await sdk.field.setValue(document.id);
      }
      
      return document;
    } catch (err) {
      console.error('Error creating document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, sdk]);
  
  /**
   * Fetch a Google Doc's content by ID
   */
  const fetchDocumentContent = useCallback(async (documentId: string) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated with Google');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const document = await fetchDocument(documentId);
      setCurrentDocument(document);
      
      return document;
    } catch (err) {
      console.error('Error fetching document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  /**
   * Parse a Google Doc's content to extract field values
   */
  const parseDocumentToFields = useCallback((contentModel: ContentModel): DocumentFieldValues => {
    if (!currentDocument?.content) {
      return {};
    }
    
    const fieldValues: DocumentFieldValues = {};
    
    // Simple parsing logic - in a real app this would be more robust
    // We extract content that appears after field names
    contentModel.fields.forEach(field => {
      const regex = new RegExp(`${field.name}:\\s*([^<\\n]*)`, 'i');
      const match = currentDocument.content?.match(regex);
      
      if (match && match[1]) {
        fieldValues[field.id] = convertValueToType(match[1].trim(), field.type);
      }
    });
    
    return fieldValues;
  }, [currentDocument]);
  
  /**
   * Update a Google Doc with field values from Contentful
   */
  const updateDocumentWithFields = useCallback(async (
    fieldValues: DocumentFieldValues,
    contentModel: ContentModel
  ) => {
    if (!isAuthenticated || !currentDocument) {
      throw new Error('Not authenticated or no current document');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Generate content with field values
      let content = '<h1>Contentful Content</h1>\n\n';
      
      contentModel.fields.forEach(field => {
        const value = fieldValues[field.id] || getFieldPlaceholder(field);
        content += `<h2>${field.name}</h2>\n`;
        content += `<p>${field.name}: ${value}</p>\n\n`;
      });
      
      const updatedDoc = await updateDocument(currentDocument.id, {
        content
      });
      
      setCurrentDocument(updatedDoc);
      return updatedDoc;
    } catch (err) {
      console.error('Error updating document:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentDocument]);
  
  // Helper to get appropriate placeholder text based on field type
  const getFieldPlaceholder = (field: ContentModelField): string => {
    switch (field.type) {
      case 'Symbol':
      case 'Text':
        return '[Enter text here]';
      case 'Number':
        return '0';
      case 'Boolean':
        return 'true/false';
      case 'Date':
        return new Date().toISOString().split('T')[0];
      case 'Location':
        return 'Latitude, Longitude';
      case 'Object':
      case 'RichText':
        return '{}';
      default:
        return '[Enter content here]';
    }
  };
  
  // Helper to convert string values to the appropriate type
  const convertValueToType = (value: string, type: string): any => {
    switch (type) {
      case 'Number':
        return parseFloat(value);
      case 'Boolean':
        return value.toLowerCase() === 'true';
      case 'Date':
        return value; // Return as string, Contentful will handle conversion
      case 'Location':
        try {
          const [lat, lng] = value.split(',').map(v => parseFloat(v.trim()));
          return { lat, lng };
        } catch (e) {
          return null;
        }
      case 'Object':
      case 'RichText':
        try {
          return JSON.parse(value);
        } catch (e) {
          return {};
        }
      default:
        return value;
    }
  };
  
  return {
    isAuthenticated,
    isLoading,
    error,
    documents,
    currentDocument,
    authenticate,
    logOut,
    createDocumentFromContentModel,
    fetchDocumentContent,
    parseDocumentToFields,
    updateDocumentWithFields,
    setIsAuthenticated, // Exposed for testing
    setCurrentDocument, // Exposed for testing
  };
};
