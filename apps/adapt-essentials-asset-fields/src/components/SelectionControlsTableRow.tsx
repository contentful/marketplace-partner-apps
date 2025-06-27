import { useMemo, useState } from 'react';
import { Table, Box, ButtonGroup, Button, Text, Spinner, Flex } from '@contentful/f36-components';
import useEntriesSelection from './hooks/useEntriesSelection';
import useColumns from './hooks/useColumns';
import useAssetEntries from './hooks/useAssetEntries';
import { EntryStatus, getEntryStatus } from './utils/entries';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useCMA } from '@contentful/react-apps-toolkit';
import { AssetProps } from 'contentful-management';

const SelectionControlsTableRow = () => {
  const cma = useCMA();
  const sdk = useSDK();
  const [performingAction, setPerformingAction] = useState(null);
  const { selectedEntries, setSelectedEntries } = useEntriesSelection();
  const { visibleColumns } = useColumns();
  const { assetEntries, setAssetEntries, updateAssetEntries } = useAssetEntries();
  const selectedAssets = useMemo(
    () => selectedEntries?.map((id) => assetEntries.find((assetEntry) => assetEntry.sys.id === id)) || [],
    [assetEntries, selectedEntries],
  );

  const deletableAssets = useMemo(() => {
    return selectedAssets.filter(
      (assetEntry) => getEntryStatus(assetEntry.sys) === EntryStatus.ARCHIVED || getEntryStatus(assetEntry.sys) === EntryStatus.DRAFT,
    );
  }, [selectedAssets]);

  const unpublishableAssets = useMemo(() => {
    return selectedAssets.filter(
      (assetEntry) => getEntryStatus(assetEntry.sys) === EntryStatus.PUBLISHED || getEntryStatus(assetEntry.sys) === EntryStatus.CHANGED,
    );
  }, [selectedAssets]);

  const republishableAssets = useMemo(() => {
    return selectedAssets.filter(
      (assetEntry) =>
        getEntryStatus(assetEntry.sys) === EntryStatus.CHANGED || (getEntryStatus(assetEntry.sys) === EntryStatus.DRAFT && assetEntry.fields.file),
    );
  }, [selectedAssets]);

  const publishableAssets = useMemo(() => {
    return selectedAssets.filter((assetEntry) => getEntryStatus(assetEntry.sys) === EntryStatus.DRAFT && assetEntry.fields.file);
  }, [selectedAssets]);

  const archivableAssets = useMemo(() => {
    return selectedAssets.filter((assetEntry) => getEntryStatus(assetEntry.sys) === EntryStatus.DRAFT);
  }, [selectedAssets]);

  const unarchivableAssets = useMemo(() => {
    return selectedAssets.filter((assetEntry) => getEntryStatus(assetEntry.sys) === EntryStatus.ARCHIVED);
  }, [selectedAssets]);

  const clearSelection = () => setSelectedEntries([]);

  const actionMap = {
    publish: {
      actionLabel: 'Publishing...',
      cma: cma.asset.publish,
    },
    delete: {
      actionLabel: 'Deleting...',
      cma: cma.asset.delete,
    },
    archive: {
      actionLabel: 'Archiving...',
      cma: cma.asset.archive,
    },
    unpublish: {
      actionLabel: 'Unpublishing...',
      cma: cma.asset.unpublish,
    },
    republish: {
      actionLabel: 'Republishing...',
      cma: cma.asset.publish,
    },
    unarchive: {
      actionLabel: 'Unarchiving...',
      cma: cma.asset.unarchive,
    },
  } as const;

  const performSelectionAction =
    (actionKey: keyof typeof actionMap, collection: AssetProps[], confirmed = false) =>
    async () => {
      if (!confirmed && actionKey === 'delete') {
        const linksResult = await Promise.all(
          collection.map((assetEntry) => {
            return cma.entry.getMany({
              query: {
                links_to_asset: assetEntry.sys.id,
              },
            });
          }),
        );
        const links = Array.from(new Set(linksResult.flatMap((result) => result.items.map((item) => item.sys.id))));

        const usedInMessage = links.at(0) ? ` It is used in: ${links.join(', ')}` : '';

        const message = `Once you delete ${collection.at(1) ? 'these assets' : 'this asset'}, it's gone for good and cannot be retrieved.${usedInMessage}`;

        const confirmationClicked = await sdk.dialogs.openConfirm({
          title: `Are you sure you want to permanently delete ${collection.at(1) ? 'these assets' : 'this asset'}?`,
          message,
          intent: 'negative',
          confirmLabel: 'Permanently delete',
          cancelLabel: 'Cancel',
        });
        if (confirmationClicked) {
          performSelectionAction(actionKey, collection, true)();
        }
        return;
      }
      setPerformingAction(actionMap[actionKey].actionLabel);
      const updatedEntries = await Promise.all(collection.map((assetEntry) => actionMap[actionKey].cma({ assetId: assetEntry.sys.id }, assetEntry)));
      if (actionKey === 'delete') {
        setSelectedEntries([]);
        setAssetEntries(assetEntries.filter((assetEntry) => !collection.includes(assetEntry)));
        setPerformingAction(null);
        return;
      }
      updateAssetEntries(updatedEntries);
      setPerformingAction(null);
      clearSelection();
    };

  return (
    selectedEntries.at(0) && (
      <Table.Row>
        <Table.Cell colSpan={visibleColumns.length + 2}>
          <Box marginBottom="spacingS">
            <Text>
              {selectedEntries.length} asset
              {selectedEntries.at(1) ? 's' : ''} selected:
            </Text>
          </Box>
          {!performingAction && (
            <ButtonGroup variant="spaced" spacing="spacingM">
              {deletableAssets.at(0) && selectedAssets.length === deletableAssets.length && (
                <Button variant="negative" size="small" onClick={performSelectionAction('delete', selectedAssets)}>
                  Delete
                </Button>
              )}

              {archivableAssets.at(0) && selectedAssets.length === archivableAssets.length && (
                <Button variant="secondary" size="small" onClick={performSelectionAction('archive', selectedAssets)}>
                  Archive
                </Button>
              )}

              {unpublishableAssets.at(0) && selectedAssets.length === unpublishableAssets.length && (
                <Button variant="secondary" size="small" onClick={performSelectionAction('unpublish', selectedAssets)}>
                  Unpublish
                </Button>
              )}
              {republishableAssets.at(0) && selectedAssets.length === republishableAssets.length && publishableAssets.length !== republishableAssets.length && (
                <Button variant="positive" size="small" onClick={performSelectionAction('republish', selectedAssets)}>
                  Republish
                </Button>
              )}

              {publishableAssets.at(0) && selectedAssets.length === publishableAssets.length && (
                <Button variant="positive" size="small" onClick={performSelectionAction('publish', publishableAssets)}>
                  Publish
                </Button>
              )}
              {unarchivableAssets.at(0) && selectedAssets.length === unarchivableAssets.length && (
                <Button variant="secondary" size="small" onClick={performSelectionAction('unarchive', unarchivableAssets)}>
                  Unarchive
                </Button>
              )}
            </ButtonGroup>
          )}
          {performingAction && (
            <Flex gap="spacing2Xs" alignItems="baseline">
              <Text>{performingAction}</Text>
              <Spinner />
            </Flex>
          )}
        </Table.Cell>
      </Table.Row>
    )
  );
};
export default SelectionControlsTableRow;
