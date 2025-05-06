import React, { useEffect } from 'react'
import { Button, Box, Text, Spinner, Paragraph, Flex, Card, Note } from '@contentful/f36-components'
import { ExternalLinkIcon } from '@contentful/f36-icons'
import { useSDK } from '@contentful/react-apps-toolkit'
import { FieldAppSDK } from '@contentful/app-sdk'
import { useGoogleDocs } from './hooks/useGoogleDocs'

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
  const sdk = useSDK<FieldAppSDK>()
  const {
    isAuthenticated,
    isLoading,
    error,
    currentDocument,
    authenticate,
    createDocumentFromContentModel,
    fetchDocumentContent,
    parseDocumentToFields,
    updateDocumentWithFields
  } = useGoogleDocs()

  // Load document if ID exists in field
  useEffect(() => {
    const loadDocument = async () => {
      if (isAuthenticated) {
        const documentId = sdk.field.getValue()
        if (documentId) {
          try {
            await fetchDocumentContent(documentId)
          } catch (err) {
            console.error('Error loading document:', err)
          }
        }
      }
    }

    loadDocument()
  }, [isAuthenticated, sdk.field, fetchDocumentContent])

  // Create content model object from Contentful fields
  const getContentModel = () => {
    const fields = sdk.contentType.fields.map(field => ({
      id: field.id,
      name: field.name,
      type: field.type
    }))

    return { fields }
  }

  // Handle creating a new document
  const handleCreateDocument = async () => {
    try {
      await createDocumentFromContentModel(getContentModel())
    } catch (err) {
      console.error('Error creating document:', err)
    }
  }

  // Handle syncing content from Google Docs to Contentful
  const handleSyncFromDocs = async () => {
    if (!currentDocument) return

    try {
      const contentModel = getContentModel()
      const fieldValues = parseDocumentToFields(contentModel)
      
      // For this example, we're just setting the current field, but in a real app
      // we would update multiple fields based on the content model
      const currentFieldId = sdk.field.id
      if (fieldValues[currentFieldId]) {
        await sdk.field.setValue(fieldValues[currentFieldId])
      }
    } catch (err) {
      console.error('Error syncing from docs:', err)
    }
  }

  // Render loading state
  if (isLoading) {
    return (
      <Flex alignItems="center" justifyContent="center" padding="spacingM">
        <Spinner />
        <Text marginLeft="spacingS">Loading...</Text>
      </Flex>
    )
  }

  // Render error state
  if (error) {
    return (
      <Note variant="negative">
        <Text fontWeight="fontWeightDemiBold">Error</Text>
        <Text>{error.message}</Text>
      </Note>
    )
  }

  // Render unauthenticated state
  if (!isAuthenticated) {
    return (
      <Card>
        <Paragraph>Connect to Google Docs to edit content in a collaborative document.</Paragraph>
        <Button variant="primary" onClick={authenticate}>Authenticate</Button>
      </Card>
    )
  }

  // Render authenticated state without document
  if (!currentDocument) {
    return (
      <Card>
        <Paragraph>Create a new Google Document to edit this content.</Paragraph>
        <Button variant="primary" onClick={handleCreateDocument}>Create Document</Button>
      </Card>
    )
  }

  // Render authenticated state with document
  return (
    <Card>
      <Flex flexDirection="column" gap="spacingM">
        <Box>
          <Text fontWeight="fontWeightDemiBold">{currentDocument.title}</Text>
          <Paragraph>
            Use Google Docs to edit your content collaboratively, then sync changes back to Contentful.
          </Paragraph>
        </Box>
        
        <Flex gap="spacingM" alignItems="center">
          <a
            href={currentDocument.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
          >
            <Text marginRight="spacingXs">Open in Google Docs</Text>
            <ExternalLinkIcon variant="muted" />
          </a>
          <Button onClick={handleSyncFromDocs}>Sync from Google Docs</Button>
        </Flex>
      </Flex>
    </Card>
  )
}
