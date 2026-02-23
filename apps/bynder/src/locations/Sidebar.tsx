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
      const appId = sdk.ids.app;

      if (!appId) {
        throw new Error('App ID not found');
      }

      const appActions = await sdk.cma.appAction.getManyForEnvironment({});

      const appAction = appActions.items.find(
        (action) =>
          action.sys.appDefinition?.sys.id === appId &&
          action.name === 'Refresh Bynder Assets for All Locales'
      );

      if (!appAction?.sys?.id) {
        throw new Error(
          'Refresh Bynder Assets app action not found. Ensure the app is deployed with the latest bundle (including the refresh-assets function and actions in the manifest).'
        );
      }

      const appActionCallResponse = await sdk.cma.appActionCall.createWithResponse({
        appDefinitionId: appId,
        appActionId: appAction.sys.id,
      }, {
        parameters: {
          entryId,
          fieldId,
        },
      });


      const body = JSON.parse(appActionCallResponse.response.body);
      if (body.success) {
        const failedIds: string[] = body.failedIds ?? [];
        const message =
          failedIds.length > 0
            ? `Refreshed ${body.refreshedCount ?? 0} asset(s). ${failedIds.length} could not be refreshed (deleted or inaccessible): ${failedIds.join(', ')}`
            : `Successfully refreshed ${body.refreshedCount ?? 0} asset(s)`;
        setLastRefreshResult({
          success: true,
          message,
        });
        sdk.notifier.success(failedIds.length > 0 ? message : 'Assets refreshed successfully');
        window.location.reload();
      } else {
        const failedIds: string[] = body.failedIds ?? [];
        const errorMsg = body.error || body.errors?.join(', ') || 'Failed to refresh assets';
        throw new Error(
          failedIds.length > 0 ? `${errorMsg}. Failed asset IDs: ${failedIds.join(', ')}` : errorMsg
        );
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
        Fetch the latest metadata from Bynder and update all locales for this entry.
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
