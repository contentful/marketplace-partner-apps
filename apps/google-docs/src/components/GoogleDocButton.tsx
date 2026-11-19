import React, { useState } from 'react';
import { Button, Text, Tooltip } from '@contentful/f36-components';

interface GoogleDocButtonProps {
  sdk: any;
}

export default function CreateGoogleDocButton({ sdk }: GoogleDocButtonProps) {
  const [isCreating, setIsCreating] = useState(false);

  const createDoc = async () => {
    const accessToken = localStorage.getItem('google_access_token');
    if (!accessToken) {
      sdk.notifier.error('Google account not connected. Please connect your account first.');
      // Force reload to show connect button
      window.location.reload();
      return;
    }

    setIsCreating(true);

    try {
      // Get field values from the entry
      const fields = sdk.entry.fields;
      const title = fields.title?.getValue() || 'Untitled';
      
      // Get other fields that might be available
      const summary = fields.summary?.getValue() || '';
      const notes = fields.notes?.getValue() || '';
      const description = fields.description?.getValue() || '';
      const content = fields.content?.getValue() || '';
      
      // Combine available content
      const docContent = [
        title ? `Title: ${title}` : '',
        description ? `\n\nDescription: ${description}` : '',
        summary ? `\n\nSummary: ${summary}` : '',
        content ? `\n\nContent: ${content}` : '',
        notes ? `\n\nNotes: ${notes}` : '',
      ].join('');

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

      console.log('Token validation successful, creating document...');

      // 1. Create a new Google Doc
      const driveRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `Contentful: ${title || 'Untitled Document'}`,
          mimeType: 'application/vnd.google-apps.document',
        }),
      });

      if (!driveRes.ok) {
        console.error('Drive API response:', await driveRes.text());
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
                text: docContent || 'Contentful document content',
              },
            },
          ],
        }),
      });

      if (!updateRes.ok) {
        console.error('Docs API response:', await updateRes.text());
        throw new Error(`Failed to update document: ${updateRes.status} ${updateRes.statusText}`);
      }

      // 3. Open the doc in a new tab
      window.open(`https://docs.google.com/document/d/${docId}/edit`, '_blank');

      sdk.notifier.success('Google Doc created successfully.');
      
      // Save the doc ID in a field if it exists
      if (fields.googleDocId) {
        try {
          fields.googleDocId.setValue(docId);
          console.log('Saved Google Doc ID to entry field');
        } catch (error) {
          console.warn('Could not save Google Doc ID to entry field:', error);
        }
      }
      
    } catch (err) {
      console.error('Error creating Google Doc:', err);
      sdk.notifier.error(`Failed to create Google Doc: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Tooltip content="Creates a Google Doc with content from this entry" placement="top">
      <Button 
        variant="positive" 
        onClick={createDoc} 
        isLoading={isCreating}
        startIcon={<Text fontWeight="fontWeightDemiBold">📄</Text>}
        isDisabled={isCreating}
      >
        {isCreating ? 'Creating Doc...' : 'Create Google Doc'}
      </Button>
    </Tooltip>
  );
}
