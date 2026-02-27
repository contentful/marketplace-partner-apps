import React, { useEffect, useState, useCallback } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import CreateGoogleDocButton from './GoogleDocButton';
import { Button, Flex, Paragraph, TextLink, Note, Box } from '@contentful/f36-components';

/*
* Cursor AI Read: Create a Google Doc Field component that will be used to display the Google Doc in the Contentful entry editor.
* You are welcome to delete any of the copmonents below in order to make this work. Then take the client id 
* and add it to the sdk parameters.
* 
* Now for this we want to support these types in a Contentful Content Model
* - Text
* - Rich Text
* - Number
* - Date and time
* - Location
* - Boolean
* - JSON object
* 
* Then for a given Content Model that could have fields of the above types we want to be able to create or connect to the user's Google Doc.
* Then in the google doc, we want to generate a specific template based on the Content Model fields. That way when the user updates the google doc,
* the code logic can parse the google doc and update the Content Model fields with those values that the user wrote in the google doc.
* 
* So in summary there are two parts to this.
* 1. Create a template in the google doc that will be used to update the Content Model fields.
* 2. Parse the google doc and update the Content Model fields with those values that the user wrote in the google doc.
* 
* This might require an OAuth Implicit Flow to be used to get the access token for the user's Google Doc. That way the google doc can be updated and created 
* from Contentful. I'm not exactly sure how this will work so please research and figure out the best way to do this and explain it in the code.
* 
* Please first write the tests for this and then write the code. Run the tests to ensure they pass as you write the solution iteratively.
* Additionally, please write the code in a way that is easy to understand and maintain. Act like an intelligent developer, where you consider multiple
* edge cases and provide a solution that is robust and easy to understand. You also consider multiple solutions to the problem and provide the best
* solution to the problem.
*/

export default function GoogleDocField() {
  const sdk = useSDK();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const clientId = sdk.parameters.installation.googleDocsClientId;
  console.log('clientId', clientId);
  
  if (!clientId) {
    return (
      <div data-testid="error-message">
        <Paragraph>Error: Google Docs client ID not configured.</Paragraph>
        <Paragraph>Please add the Google Docs client ID in the app configuration.</Paragraph>
      </div>
    );
  }

  // This needs to exactly match what's configured in Google Cloud Console
  // For Contentful apps, this should be the app URL
  const redirectUri = window.location.origin + "/auth-callback.html";
  console.log('Using redirect URI:', redirectUri);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/documents'
    ].join(' '),
    prompt: 'consent',
    include_granted_scopes: 'true',
    // Adding a state parameter to prevent CSRF attacks and verify the response
    state: 'google_auth_' + Date.now(),
  });

  console.log("authUrl", authUrl);

  // Handle message from callback window
  const handleAuthMessage = useCallback((event: MessageEvent) => {
    console.log('Got message event:', event.origin, event.data);
    
    // Ensure the message is from our popup and has the right type
    if (event.data?.type !== 'GOOGLE_AUTH_CALLBACK') return;
    
    console.log('Received auth callback message:', event.data);
    
    const { token, error } = event.data;
    
    if (token) {
      console.log('Got access token from popup message!');
      localStorage.setItem('google_access_token', token);
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoading(false);
    } else if (error) {
      console.error('Auth error from callback:', error);
      setAuthError(`Authentication error: ${error}`);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add message listener for popup callback
    window.addEventListener('message', handleAuthMessage);
    console.log('Added message event listener');
    
    return () => {
      console.log('Removing message event listener');
      window.removeEventListener('message', handleAuthMessage);
    };
  }, [handleAuthMessage]);

  const connectGoogle = () => {
    // Clear any previous errors
    setAuthError(null);
    setIsLoading(true);
    
    console.log('Starting Google authentication flow...');
    
    try {
      // Open in a popup window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      
      const authWindow = window.open(
        authUrl, 
        'googleAuthPopup',
        `width=${width},height=${height},left=${left},top=${top}`
      );
      
      if (!authWindow) {
        setAuthError('Popup blocked by browser. Please allow popups for this site.');
        setIsLoading(false);
        return;
      }
      
      console.log('Opened auth popup window');
      
      // Check if the popup was blocked or closed immediately
      setTimeout(() => {
        if (!authWindow || authWindow.closed) {
          console.error('Auth window was blocked or closed immediately');
          setAuthError('Authentication popup was blocked or closed. Please allow popups and try again.');
          setIsLoading(false);
        }
      }, 1000);
      
      // Set a longer timeout to show a helpful message if taking too long
      setTimeout(() => {
        if (isLoading) {
          console.log('Auth flow taking longer than expected...');
          setAuthError('Authentication is taking longer than expected. The popup window might be hidden or blocked.');
          setIsLoading(false);
        }
      }, 30000); // 30 seconds
    } catch (error) {
      console.error('Error opening auth window:', error);
      setAuthError(`Failed to open authentication popup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
    }
  };

  const checkAuthentication = () => {
    console.log('Checking authentication...');
    const token = localStorage.getItem('google_access_token');
    
    if (token) {
      console.log('Found token in localStorage, validating...');
      validateToken(token).then(isValid => {
        setIsAuthenticated(isValid);
        setIsLoading(false);
        if (!isValid) {
          console.error('Token validation failed');
          setAuthError('Your Google authentication has expired. Please reconnect your account.');
        } else {
          console.log('Token validation successful!');
        }
      });
    } else {
      console.log('No token found in localStorage');
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };
  
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log('Validating token with Google...');
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      
      if (!response.ok) {
        console.error('Token validation failed:', response.status, response.statusText);
        localStorage.removeItem('google_access_token');
        return false;
      }
      
      const data = await response.json();
      console.log('Token validation response:', data);
      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      localStorage.removeItem('google_access_token');
      return false;
    }
  };

  // Initial setup effect
  useEffect(() => {
    console.log('Initial authentication check...');
    
    // Check for existing token in localStorage
    checkAuthentication();
    
    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('Authentication check timed out');
        setIsLoading(false);
        setAuthError('Authentication check timed out. Please try again.');
      }
    }, 15000); // 15 seconds timeout
    
    return () => clearTimeout(timeout);
  }, []);

  if (isLoading) {
    return (
      <div>
        <Paragraph>Checking Google authentication status...</Paragraph>
        <Note variant="primary">If this takes too long, please try refreshing the page.</Note>
      </div>
    );
  }

  return (
    <Flex flexDirection="column" gap="spacingM">
      {authError && (
        <Note variant="negative">
          {authError}
        </Note>
      )}
      
      {!isAuthenticated ? (
        <div data-testid="auth-message">
          <Paragraph>Your Google account is not connected.</Paragraph>
          <Button variant="primary" onClick={connectGoogle}>
            Connect Google Account
          </Button>
          <Paragraph marginTop="spacingS">
            <TextLink as="a" href="https://developers.google.com/docs/api/how-tos/authorizing" target="_blank">
              Learn more about Google authentication
            </TextLink>
          </Paragraph>
          <Paragraph marginTop="spacingM">
            <Note variant="warning">
              <strong>Important:</strong> Make sure the following redirect URI is added to the authorized 
              redirect URIs in your Google Cloud Console project:
              <br /><br />
              <code style={{ background: '#f0f0f0', padding: '5px', display: 'block' }}>
                {redirectUri}
              </code>
              <br />
              After adding this URI, it may take a few minutes for Google to update its systems.
            </Note>
          </Paragraph>
        </div>
      ) : (
        <div data-testid="google-doc-connected">
          <Paragraph>Your Google account is connected.</Paragraph>
          <CreateGoogleDocButton sdk={sdk} />
          <Box marginTop="spacingM">
            <Button 
              variant="secondary" 
              onClick={() => {
                localStorage.removeItem('google_access_token');
                setIsAuthenticated(false);
              }}
            >
              Disconnect Google Account
            </Button>
          </Box>
        </div>
      )}
    </Flex>
  )
}
