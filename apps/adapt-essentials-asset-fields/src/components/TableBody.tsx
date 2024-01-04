import { Asset, Box, Checkbox, Flex, SkeletonContainer, SkeletonImage, Table, TableCell } from '@contentful/f36-components';

import { BodyInputCellResolver } from './BodyInputCellResolver';
import useAssetEntries from './hooks/useAssetEntries';
import useColumns from './hooks/useColumns';
import useEntriesLoading from './hooks/useEntriesLoading';
import useEntriesSelection from './hooks/useEntriesSelection';
import useLocales from './hooks/useLocales';
import { mapMimeTypeToAssetType } from './utils/assetTypes';
import { getEntryStatus } from './utils/entries';
import { useSDK } from '@contentful/react-apps-toolkit';

const TableBody = () => {
  const { assetEntries, updateAssetEntry } = useAssetEntries();
  const { entriesLoading } = useEntriesLoading();
  const { selectedEntries, setSelected } = useEntriesSelection();
  const { visibleColumns } = useColumns();
  const { defaultLocale } = useLocales();
  const sdk = useSDK();
  const openAsset = (assetId: string) => () => {
    sdk.navigator
      .openAsset(assetId, {
        slideIn: {
          waitForClose: true,
        },
      })
      .then(({ entity }) => {
        if (!entity) return;
        updateAssetEntry(entity);
      });
  };

  return (
    <Table.Body>
      {assetEntries.map((asset) => (
        <Table.Row key={asset.sys.id}>
          <TableCell style={{ width: '120px', verticalAlign: 'middle' }}>
            <Flex alignItems="center">
              <Checkbox isChecked={selectedEntries.includes(asset.sys.id)} onChange={(event) => setSelected(asset.sys.id, event?.target?.checked)} />
              <Box onClick={openAsset(asset.sys.id)} style={{ cursor: 'pointer', margin: 'auto' }}>
                {entriesLoading && (
                  <SkeletonContainer style={{ height: '60px' }}>
                    <SkeletonImage height="60px" width="60px" />
                  </SkeletonContainer>
                )}
                {!entriesLoading && (
                  <Asset
                    style={{ height: '70px' }}
                    src={`${asset.fields.file?.[defaultLocale].url}?w=60&h=60&fit=thumb`}
                    status={getEntryStatus(asset.sys)}
                    type={mapMimeTypeToAssetType(asset.fields.file?.[defaultLocale].contentType)}
                  />
                )}
              </Box>
            </Flex>
          </TableCell>
          {visibleColumns.map((column, index) => (
            <BodyInputCellResolver
              key={`${asset.sys.id}-${column}`}
              column={column}
              asset={asset}
              loading={entriesLoading}
              colSpan={visibleColumns.length - index === 1 ? 2 : null}
              style={{ verticalAlign: 'middle' }}
            />
          ))}
        </Table.Row>
      ))}
    </Table.Body>
  );
};

export default TableBody;
