import { useState, useEffect, useCallback } from 'react';
import { useSDK, useAutoResizer } from '@contentful/react-apps-toolkit';
import { SidebarAppSDK } from '@contentful/app-sdk';
import {
  Button,
  Note,
  Stack,
  Text,
  Spinner,
  Flex,
} from '@contentful/f36-components';
import { CycleTrimmedIcon } from '@contentful/f36-icons';

/**
 * Sidebar component for refreshing Bynder assets
 * Allows users to refresh all Bynder assets in the current entry for all locales
 */
const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  useAutoResizer();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bynderFields, setBynderFields] = useState<string[]>([]);
  const [lastRefreshResult, setLastRefreshResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
  } | null>(null);

  // Detect Bynder fields in the current entry
  useEffect(() => {
    const detectBynderFields = () => {
      const fields: string[] = [];
      
      // Check all fields in the entry
      Object.keys(sdk.entry.fields).forEach((fieldId) => {
        const field = sdk.entry.fields[fieldId];
        const value = field.getValue();
        
        // Check if the field contains Bynder assets
        // Bynder assets have specific structure: id, name, dateCreated, etc.
        const hasBynderAsset = (val: any): boolean => {
          if (!val || typeof val !== 'object') return false;
          
          if (Array.isArray(val)) {
            return val.some((item) => 
              item?.id && 
              item?.name && 
              item?.dateCreated &&
              item?.type
            );
          }
          
          return !!(
            val.id &&
            val.name &&
            val.dateCreated &&
            val.type
          );
        };
        
        if (hasBynderAsset(value)) {
          fields.push(fieldId);
        }
      });
      
      setBynderFields(fields);
    };

    detectBynderFields();
    
    // Re-detect when entry changes
    const unsubscribe = sdk.entry.onSysChanged(() => {
      detectBynderFields();
    });
    
    return () => {
      unsubscribe();
    };
  }, [sdk.entry]);

  const refreshAssets = useCallback(async (fieldId: string) => {
    setIsRefreshing(true);
    setLastRefreshResult(null);

    try {
      const entryId = sdk.entry.getSys().id;
      const syncIsPublic = sdk.parameters.installation?.syncIsPublicAcrossLocales !== 'No';

      // Call the App Action via signed request
      // App Actions are invoked through Contentful's API with signed requests
      const appId = sdk.ids.app;
      const spaceId = sdk.ids.space;
      const environmentId = sdk.ids.environment;

      if (!appId) {
        throw new Error('App ID not found');
      }

      const appActions = await sdk.cma.appAction.getMany({
        appDefinitionId: appId,
      });

      const appAction = appActions.items.find((action) => action.name === 'refreshBynderAssets');

      const appActionCallResponse = await sdk.cma.appActionCall.createWithResponse({
        appDefinitionId: appId,
        appActionId: appAction?.sys.id,
      }, {
        parameters: {
          entryId,
          fieldId,
          syncIsPublicAcrossLocales: syncIsPublic,
        },
      });


      const body = JSON.parse(appActionCallResponse.response.body);
      if (body.success) {
        setLastRefreshResult({
          success: true,
          message: `Successfully refreshed ${body.refreshedCount || 0} asset(s)`,
        });
        sdk.notifier.success('Assets refreshed successfully');
        
        // Reload the entry to show updated values
        window.location.reload();
      } else {
        throw new Error(JSON.parse(appActionCallResponse.response.body).error || JSON.parse(appActionCallResponse.response.body).errors?.join(', ') || 'Failed to refresh assets');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh assets';
      setLastRefreshResult({
        success: false,
        error: errorMessage,
      });
      sdk.notifier.error(errorMessage);
      console.error('Error refreshing assets:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [sdk]);

  if (bynderFields.length === 0) {
    return (
      <Note variant="neutral">
        No Bynder asset fields found in this entry. Add Bynder assets to enable refresh functionality.
      </Note>
    );
  }

  return (
    <Stack flexDirection="column" spacing="spacingM">
      <Text fontWeight="fontWeightDemiBold" fontSize="fontSizeM">
        Refresh Bynder Assets
      </Text>
      <Text fontSize="fontSizeS" fontColor="gray600">
        Refresh asset metadata for all locales to ensure consistent data (e.g., isPublic flag).
      </Text>

      {bynderFields.map((fieldId) => {
        const field = sdk.entry.fields[fieldId];
        const fieldName = field?.id || fieldId;

        return (
          <Flex key={fieldId} flexDirection="column" gap="spacingXs">
            <Button
              onClick={() => refreshAssets(fieldId)}
              isDisabled={isRefreshing}
              startIcon={isRefreshing ? <Spinner size="small" /> : <CycleTrimmedIcon />}
              variant="secondary"
              size="small"
              isFullWidth
            >
              {isRefreshing ? 'Refreshing...' : `Refresh ${fieldName}`}
            </Button>
          </Flex>
        );
      })}

      {lastRefreshResult && (
        <Note variant={lastRefreshResult.success ? 'positive' : 'negative'}>
          {lastRefreshResult.success
            ? lastRefreshResult.message
            : lastRefreshResult.error}
        </Note>
      )}
    </Stack>
  );
};

export default Sidebar;
