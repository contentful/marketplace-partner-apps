import React, { useContext, useState } from 'react';
import { Stack, Button, Popover, Box, Modal, Paragraph } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { EditorAppSDK } from '@contentful/app-sdk';
import { ContentTypesContext } from '../contexts/ContentTypesContext';
import { EnhancedContentfulEntry } from '../types';
import { ContentTypeSelector } from './ContentTypeSelector';

interface VariationContentSelectorProps {
  variationName: string;
  variationIndex: number;
  onSelectContent: (index: number, entryLink: EnhancedContentfulEntry) => void;
}

export const VariationContentSelector: React.FC<VariationContentSelectorProps> = ({
  variationName,
  variationIndex,
  onSelectContent
}) => {
  const sdk = useSDK<EditorAppSDK>();
  const { getContentTypeById } = useContext(ContentTypesContext);
  const [isOpen, setIsOpen] = useState(false);
  const [isContentTypeModalOpen, setIsContentTypeModalOpen] = useState(false);

  const handleLinkExisting = async () => {
    try {
      // Use the optional preferred content types if provided
      const options: any = {
        locale: sdk.locales.default
      };
      
      // Use entry selection dialog
      const result = await sdk.dialogs.selectSingleEntry(options);
      
      if (!result) return;
      
      try {
        // Fetch entry details to get title and content type
        const entry = await sdk.cma.entry.get({ entryId: (result as any).sys.id });
        const contentTypeId = entry.sys.contentType.sys.id;
        const contentType = await getContentTypeById(contentTypeId);
        
        const entryLink: EnhancedContentfulEntry = {
          sys: {
            id: (result as any).sys.id,
            type: 'Link',
            linkType: 'Entry',
          },
          metadata: {
            entryTitle: contentType 
              ? entry.fields[contentType.displayField]?.[sdk.locales.default] 
              : 'Unknown',
            contentTypeName: contentType?.name || 'Unknown',
            contentTypeId: contentTypeId
          }
        };
        
        onSelectContent(variationIndex, entryLink);
      } catch (err) {
        console.error('Error fetching entry details:', err);
        // Still create the link even if metadata fetch fails
        const entryLink: EnhancedContentfulEntry = {
          sys: {
            id: (result as any).sys.id,
            type: 'Link',
            linkType: 'Entry',
          }
        };
        onSelectContent(variationIndex, entryLink);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to link content:', error);
      sdk.notifier.error('Failed to link content');
    }
  };

  // Function to create a new entry with the selected content type
  const createNewEntry = async (contentTypeId: string) => {
    try {
      const result = await sdk.navigator.openNewEntry(contentTypeId, {
        slideIn: { waitForClose: true }
      });
      
      if (
        result &&
        typeof result === 'object' &&
        'entity' in result &&
        result.entity &&
        typeof result.entity === 'object' &&
        'sys' in result.entity &&
        (result.entity as any).sys &&
        typeof (result.entity as any).sys.id === 'string'
      ) {
        const entity = result.entity as any;
        onSelectContent(variationIndex, {
          sys: {
            id: entity.sys.id,
            type: 'Link',
            linkType: 'Entry'
          }
        });
      }
    } catch (error) {
      console.error('Error creating new entry:', error);
      sdk.notifier.error('Failed to create new entry');
    }
  };

  // Handler for content type selection
  const handleContentTypeSelect = (contentType: any) => {
    setIsContentTypeModalOpen(false);
    if (contentType && contentType.sys && contentType.sys.id) {
      createNewEntry(contentType.sys.id);
    }
  };

  return (
    <>
      <Popover isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <Popover.Trigger>
          <Button onClick={() => setIsOpen(!isOpen)}>
            Select Content
          </Button>
        </Popover.Trigger>
        <Popover.Content>
          <Box padding="spacingL">
            <Paragraph>Select content for the <span style={{ fontWeight: 'bold' }}>{variationName}</span> variation</Paragraph>
            <Stack spacing="spacingM" marginTop="spacingM" justifyContent="center">
              <Button
                variant="primary"
                onClick={async () => {
                  // Otherwise open the content type selection modal
                  setIsContentTypeModalOpen(true);
                  setIsOpen(false);
                }}
              >
                Create new entry
              </Button>
              <Button
                variant="secondary"
                onClick={handleLinkExisting}
              >
                Link existing entry
              </Button>
            </Stack>
          </Box>
        </Popover.Content>
      </Popover>

      {/* Content Type Selection Modal */}
      <Modal isShown={isContentTypeModalOpen} onClose={() => setIsContentTypeModalOpen(false)}>
        <Modal.Header title="Select Content Type" onClose={() => setIsContentTypeModalOpen(false)} />
        <Modal.Content>
          <Paragraph marginBottom="spacingM">
            Please select a content type for your new entry:
          </Paragraph>
          <ContentTypeSelector
            onSelectContentType={handleContentTypeSelect}
            onLinkExisting={() => {
              setIsContentTypeModalOpen(false);
              handleLinkExisting();
            }}
          />
        </Modal.Content>
      </Modal>
    </>
  );
}; 