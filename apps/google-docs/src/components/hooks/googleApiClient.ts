/**
 * Google API client for interacting with the Google Docs API
 */

// This would typically use actual Google API libraries
// For this implementation, we'll create a simpler interface matching our needs

// Scope for accessing Google Docs
const SCOPES = ['https://www.googleapis.com/auth/documents', 'https://www.googleapis.com/auth/drive.file'];

// Storage key for the auth token
const TOKEN_STORAGE_KEY = 'google_docs_auth_token';

// Types for our API client
export interface GoogleDocument {
  id: string;
  title: string;
  url?: string;
  content?: string;
}

export interface CreateDocumentRequest {
  title: string;
  content: string;
}

export interface UpdateDocumentRequest {
  title?: string;
  content?: string;
}

let clientId: string | null = null;
let tokenClient: any = null;
let isInitialized = false;

/**
 * Initialize the Google API client with the provided client ID
 */
export const initGoogleApi = async (googleClientId: string): Promise<void> => {
  clientId = googleClientId;

  return new Promise((resolve, reject) => {
    // In a real implementation, this would use the Google API client library
    // We're simulating the behavior for this exercise

    // Load the Google API client libraries
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        // Initialize the token client for OAuth 2.0 flow
        tokenClient = (window as any).google?.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES.join(' '),
          callback: (tokenResponse: any) => {
            if (tokenResponse.error) {
              reject(new Error(`Authentication failed: ${tokenResponse.error}`));
              return;
            }

            // Store the access token
            localStorage.setItem(TOKEN_STORAGE_KEY, tokenResponse.access_token);
            isInitialized = true;
            resolve();
          },
        });

        // Check if we already have a token
        const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (existingToken) {
          isInitialized = true;
          resolve();
        }
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Google API client'));
    };

    document.head.appendChild(script);
  });
};

/**
 * Get the auth token, requesting one if needed
 */
export const getAuthToken = async (): Promise<string> => {
  if (!isInitialized) {
    throw new Error('Google API client not initialized');
  }

  const existingToken = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (existingToken) {
    return existingToken;
  }

  // Request a new token
  return new Promise((resolve, reject) => {
    try {
      tokenClient.requestAccessToken();

      // The callback in initTokenClient will handle storing the token
      // We would need to wait for that to complete
      const checkToken = () => {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          resolve(token);
        } else {
          setTimeout(checkToken, 100);
        }
      };

      checkToken();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Create a new Google Doc with the provided title and content
 */
export const createDocument = async (request: CreateDocumentRequest): Promise<GoogleDocument> => {
  const token = await getAuthToken();

  // In a real implementation, this would use the Google Docs API
  // We're simulating the response for this exercise
  const documentId = `doc_${Math.random().toString(36).substring(2, 11)}`;

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: documentId,
    title: request.title,
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    content: request.content,
  };
};

/**
 * Fetch a Google Doc by ID
 */
export const fetchDocument = async (documentId: string): Promise<GoogleDocument> => {
  const token = await getAuthToken();

  // In a real implementation, this would use the Google Docs API
  // We're simulating the response for this exercise

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: documentId,
    title: 'Fetched Document',
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    content: '<p>Fetched document content</p>',
  };
};

/**
 * Update an existing Google Doc
 */
export const updateDocument = async (documentId: string, request: UpdateDocumentRequest): Promise<GoogleDocument> => {
  const token = await getAuthToken();

  // In a real implementation, this would use the Google Docs API
  // We're simulating the response for this exercise

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    id: documentId,
    title: request.title || 'Updated Document',
    url: `https://docs.google.com/document/d/${documentId}/edit`,
    content: request.content || '<p>Updated document content</p>',
  };
};

/**
 * Log out and clear the auth token
 */
export const logout = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  isInitialized = false;
};
