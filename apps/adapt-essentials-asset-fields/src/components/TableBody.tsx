import { Asset, Box, Checkbox, Flex, SkeletonContainer, SkeletonImage, Table, TableCell } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';

import { BodyInputCellResolver } from './BodyInputCellResolver';
import useAssetEntries from './hooks/useAssetEntries';
import useColumns from './hooks/useColumns';
import useEntriesLoading from './hooks/useEntriesLoading';
import useEntriesSelection from './hooks/useEntriesSelection';
import useLocales from './hooks/useLocales';
import { mapMimeTypeToAssetType } from './utils/assetTypes';
import { getEntryStatus } from './utils/entries';
import styles from './styles.module.css';

const TableBody = () => {
  const THUMBNAIL_SIZE = 60;
  const { assetEntries, updateAssetEntry } = useAssetEntries();
  const { entriesLoading } = useEntriesLoading();
  const { selectedEntries, setSelected } = useEntriesSelection();
  const { visibleColumns } = useColumns();
  const { enabledLocales, defaultLocale } = useLocales();
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
      {assetEntries.map((asset) => {
        const localizedThumbnails = enabledLocales?.at(0) ? (
          enabledLocales
            .filter((locale) => asset.fields?.file?.[locale]?.url || locale === defaultLocale)
            .map((locale) => {
              if (locale === defaultLocale && !asset.fields?.file?.[locale]?.url) {
                return <Asset key={asset.sys.id} className={styles.assetThumbnailNoFile} status={getEntryStatus(asset.sys)} type="markup" />;
              }
              return (
                <Asset
                  key={asset.fields.file[locale].url}
                  className={styles.assetThumbnail}
                  src={`${asset.fields.file[locale].url}?w=${THUMBNAIL_SIZE}&h=${THUMBNAIL_SIZE}&fit=thumb`}
                  status={getEntryStatus(asset.sys)}
                  type={mapMimeTypeToAssetType(asset.fields.file[locale].contentType)}
                />
              );
            })
        ) : (
          <Asset key={asset.sys.id} className={styles.assetThumbnail} status={getEntryStatus(asset.sys)} type="archive" />
        );

        return (
          <Table.Row key={asset.sys.id}>
            <TableCell className={styles.assetCheckboxCell}>
              <Flex alignItems="center">
                <Checkbox isChecked={selectedEntries.includes(asset.sys.id)} onChange={(event) => setSelected(asset.sys.id, event?.target?.checked)} />
                <Box onClick={openAsset(asset.sys.id)} className={styles.assetThumbnailContainer}>
                  {entriesLoading && (
                    <SkeletonContainer className={styles.entrySkeletonContainer}>
                      <SkeletonImage height={`${THUMBNAIL_SIZE}px`} width={`${THUMBNAIL_SIZE}px`} />
                    </SkeletonContainer>
                  )}
                  {!entriesLoading && localizedThumbnails}
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
                className={styles.bodyInputCellResolver}
              />
            ))}
          </Table.Row>
        );
      })}
    </Table.Body>
  );
};

export default TableBody;
