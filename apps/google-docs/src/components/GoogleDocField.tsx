import React, { useEffect, useState } from 'react'
import { useSDK } from '@contentful/react-apps-toolkit';
import CreateGoogleDocButton from './GoogleDocButton';
import { Button, Flex, Paragraph, TextLink } from '@contentful/f36-components';

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

  const redirectUri = window.location.origin; // Must match one in Google console

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
  });

  console.log("authUrl", authUrl);

  const connectGoogle = () => {
    // Open in a new window instead of redirecting
    const authWindow = window.open(authUrl, '_blank', 'width=800,height=600');
    
    // Check periodically if the auth window has closed
    const checkWindow = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkWindow);
        checkAuthentication();
      }
    }, 500);
  };

  const checkAuthentication = () => {
    const token = localStorage.getItem('google_access_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  };

  useEffect(() => {
    // Check for token in URL hash (after redirect from Google)
    const hash = window.location.hash;
  
    if (hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
  
      if (token) {
        localStorage.setItem('google_access_token', token);
        window.history.replaceState({}, '', window.location.pathname);
        checkAuthentication();
      }
    } else {
      // Check if we already have a token
      checkAuthentication();
    }
    
    // Set a timeout for loading state
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(timeout);
  }, []);
  
  if (isLoading) {
    return <div>Checking Google authentication status...</div>;
  }

  return (
    <Flex flexDirection="column" gap="spacingM">
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
        </div>
      ) : (
        <div data-testid="google-doc-connected">
          <Paragraph>Your Google account is connected.</Paragraph>
          <CreateGoogleDocButton sdk={sdk} />
        </div>
      )}
    </Flex>
  )
}
