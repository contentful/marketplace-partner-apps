import React, { useState } from 'react';
import { Button, Text } from '@contentful/f36-components';

export default function CreateGoogleDocButton({ sdk }: any) {
  const [isCreating, setIsCreating] = useState(false);

  const createDoc = async () => {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      sdk.notifier.error('Google account not connected. Please connect your account first.');
      return;
    }

    setIsCreating(true);

    try {
      // Get field values from the entry
      const fields = sdk.entry.fields;
      const title = fields.title?.getValue() || 'Untitled';
      const summary = fields.summary?.getValue() || '';
      const notes = fields.notes?.getValue() || '';

      // Test the token first
      const tokenTest = await fetch('https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + accessToken);
      
      if (!tokenTest.ok) {
        // Token is invalid or expired
        localStorage.removeItem('google_access_token');
        sdk.notifier.error('Your Google authentication has expired. Please reconnect your account.');
        setIsCreating(false);
        // Force page refresh to show the connect button
        window.location.reload();
        return;
      }

      // 1. Create a new Google Doc
      const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Contentful: ${title}`,
          mimeType: 'application/vnd.google-apps.document',
        }),
      });

      if (!driveRes.ok) {
        throw new Error(`Failed to create document: ${driveRes.status} ${driveRes.statusText}`);
      }

      const driveData = await driveRes.json();
      const docId = driveData.id;
      
      if (!docId) {
        throw new Error('Could not create document - no document ID returned');
      }

      console.log('Created document with ID:', docId);

      // 2. Populate the doc with content from Contentful fields
      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `Title: ${title}\n\nSummary: ${summary}\n\nNotes: ${notes}`,
              },
            },
          ],
        }),
      });

      if (!updateRes.ok) {
        throw new Error(`Failed to update document: ${updateRes.status} ${updateRes.statusText}`);
      }

      // 3. Open the doc in a new tab
      window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');

      sdk.notifier.success('Google Doc created successfully.');
    } catch (err) {
      console.error('Error creating Google Doc:', err);
      sdk.notifier.error(`Failed to create Google Doc: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button 
      variant="positive" 
      onClick={createDoc} 
      isLoading={isCreating}
      startIcon={<Text fontWeight="fontWeightDemiBold">📄</Text>}
      isDisabled={isCreating}
    >
      {isCreating ? 'Creating Doc...' : 'Create Google Doc'}
    </Button>
  );
}
