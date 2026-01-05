'use client';

import React, { useEffect, useState } from 'react';
import { SidebarAppSDK } from '@contentful/app-sdk';
import { Note, Spinner, Text, Stack, Box, Flex } from '@contentful/f36-components';
import { useSDK, useCMA } from '@contentful/react-apps-toolkit';
import { LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE } from '../utils/constants';

interface FlagReference {
  flagKey: string;
  flagName: string;
  entryId: string;
  entryTitle: string;
  variationCount: number; // Number of variations this entry is mapped to
}

const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const cma = useCMA();
  const [flagReferences, setFlagReferences] = useState<FlagReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentEntryId = sdk.entry.getSys().id;
  
  // Debug logging
  console.log('[Sidebar] Component loaded for entry:', currentEntryId);
  console.log('[Sidebar] Entry content type:', sdk.entry.getSys().contentType.sys.id);

  useEffect(() => {
    const checkForFlagReferences = async () => {
      try {
        setLoading(true);
        setError(null);

        // Query for all LaunchDarkly flag entries
        const flagEntries = await cma.entry.getMany({
          'content_type': LAUNCHDARKLY_FEATURE_FLAG_CONTENT_TYPE,
          limit: 100, // Get all flag entries
        } as any);

        const references: FlagReference[] = [];
        const flagEntryMap = new Map<string, FlagReference>(); // Track unique flag entries

        // Process each flag entry to check if it references our current entry
        for (const flagEntry of flagEntries.items) {
          try {
            const flagName = flagEntry.fields.name?.[sdk.locales.default] || 'Unnamed Flag';
            const flagKey = flagEntry.fields.key?.[sdk.locales.default] || 'unknown';
            const contentMappings = flagEntry.fields.contentMapping?.[sdk.locales.default];

            // Check Reference Array for our current entry
            if (Array.isArray(contentMappings)) {
              let variationCount = 0;
              
              contentMappings.forEach((reference) => {
                if (reference && typeof reference === 'object' && 'sys' in reference) {
                  const entryId = (reference as { sys: { id: string } }).sys.id;
                  
                  if (entryId === currentEntryId) {
                    variationCount++;
                  }
                }
              });

              // If this flag entry references our current entry, add it to the map
              if (variationCount > 0) {
                const existingRef = flagEntryMap.get(flagEntry.sys.id);
                if (existingRef) {
                  // Update variation count if this flag entry already exists
                  existingRef.variationCount += variationCount;
                } else {
                  // Add new flag entry reference
                  flagEntryMap.set(flagEntry.sys.id, {
                    flagKey,
                    flagName,
                    entryId: flagEntry.sys.id,
                    entryTitle: flagName,
                    variationCount
                  });
                }
              }
            }
          } catch (entryError) {
            console.warn('Failed to process flag entry:', flagEntry.sys.id, entryError);
          }
        }

        // Convert map to array
        references.push(...Array.from(flagEntryMap.values()));

        setFlagReferences(references);
      } catch (err) {
        console.error('Failed to check flag references:', err);
        setError(err instanceof Error ? err.message : 'Failed to check flag references');
      } finally {
        setLoading(false);
      }
    };

    checkForFlagReferences();
  }, [sdk, cma, currentEntryId]);

  const openLaunchDarklyEntry = (entryId: string) => {
    sdk.navigator.openEntry(entryId, { slideIn: true });
  };

  if (loading) {
    return (
      <Box padding="spacingS">
        <Flex alignItems="center" gap="spacingXs">
          <Spinner size="small" />
          <Text fontSize="fontSizeS">Checking flags...</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding="spacingS">
        <Note variant="negative">
          <Text fontSize="fontSizeS">
            Error checking flags
          </Text>
        </Note>
      </Box>
    );
  }

  if (flagReferences.length === 0) {
    return (
      <Box padding="spacingS">
        <Note variant="positive">
          <Text fontSize="fontSizeS">
            ✅ No flag dependencies
          </Text>
        </Note>
      </Box>
    );
  }

  return (
    <Box padding="spacingS">
      <Box 
        style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '12px' 
        }}
      >
        <Flex alignItems="flex-start" gap="spacingS">
          <Box style={{ flexShrink: 0, marginTop: '2px' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path 
                d="M8 1L15 14H1L8 1Z" 
                fill="#f39c12" 
                stroke="#e67e22" 
                strokeWidth="1"
              />
              <path 
                d="M8 6V10M8 12V12.5" 
                stroke="white" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>
          </Box>
          <Stack spacing="spacing2Xs" flexDirection="column" alignItems="flex-start" style={{ flex: 1 }}>
            <Text fontSize="fontSizeM" fontWeight="fontWeightDemiBold" fontColor="gray900">
              LaunchDarkly Warning!
            </Text>
            <Text fontSize="fontSizeS" fontWeight="fontWeightMedium">
              This entry is associated with {flagReferences.length} flag{flagReferences.length > 1 ? 's' : ''}
            </Text>
            <Text fontSize="fontSizeS" fontColor="gray600">
              Changes may affect experiments or other experiences.
            </Text>
          </Stack>
        </Flex>
        <Stack spacing="spacing2Xs" marginTop="spacingXs" flexDirection="column" alignItems="flex-start">
          <Text fontSize="fontSizeS" fontWeight="fontWeightMedium">Flag Entry References:</Text>
          {flagReferences.map((ref, index) => (
            <Text 
              key={index} 
              fontSize="fontSizeS" 
              fontColor="blue600"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={() => openLaunchDarklyEntry(ref.entryId)}
            >
              {ref.flagName}{ref.variationCount > 1 ? ` (${ref.variationCount} variations)` : ''}
            </Text>
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default Sidebar; 