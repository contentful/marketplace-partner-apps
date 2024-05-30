import {
  TableCell,
  RelativeDateTime,
  Text,
  Flex,
  SkeletonContainer,
  SkeletonDisplayText,
  SkeletonBodyText,
  formatDateAndTime,
  BoxProps,
} from '@contentful/f36-components';
import { Image } from '@contentful/f36-image';
import { AssetProps } from 'contentful-management/dist/typings/entities/asset';
import { AssetInputFieldText } from './AssetInputFieldText';
import { EntryStatus } from './EntryStatus';
import useLocales from './hooks/useLocales';
import { AvailableColumns } from './hooks/useColumns';
import useUser from './hooks/useUser';
import styles from './styles.module.css';

interface BodyInputCellResolverProps {
  column: AvailableColumns;
  asset: AssetProps;
  colSpan?: number;
  loading?: boolean;
}

export const BodyInputCellResolver = ({ column, asset, loading = false, ...rest }: BodyInputCellResolverProps & BoxProps) => {
  const { enabledLocales } = useLocales();
  const user = useUser(asset.sys.updatedBy.sys.id);

  if (loading && column !== 'status')
    return (
      <TableCell key={column} {...rest} className={[styles.cellSkeleton, rest.className].filter(Boolean).join(' ')}>
        <SkeletonContainer className={styles.cellSkeletonContainer}>
          <SkeletonBodyText numberOfLines={2} />
        </SkeletonContainer>
      </TableCell>
    );

  switch (column) {
    case 'title':
      return (
        <TableCell key={column} {...rest}>
          <AssetInputFieldText asset={asset} locales={enabledLocales} field={'title'} />
        </TableCell>
      );
    case 'description':
      return (
        <TableCell key={column} {...rest}>
          <AssetInputFieldText as={'Textarea'} rows={1} asset={asset} locales={enabledLocales} field={'description'} />
        </TableCell>
      );
    case 'filename':
      return (
        <TableCell key={column} {...rest}>
          <AssetInputFieldText
            asset={asset}
            locales={enabledLocales.filter((locale) => asset.fields?.file?.[locale]?.fileName)}
            field={'fileName'}
            isDisabled={true}
          />
        </TableCell>
      );
    case 'createdAt':
      return (
        <TableCell key={column} {...rest}>
          {formatDateAndTime(asset.sys[column])}
        </TableCell>
      );
    case 'updatedAt':
      return (
        <TableCell key={column} {...rest}>
          <RelativeDateTime date={asset.sys[column]} />
        </TableCell>
      );
    case 'updatedBy':
      return (
        <TableCell key={column} {...rest}>
          <Flex gap="spacingXs" alignItems="center">
            {user?.avatarUrl && (
              <Image
                className={styles.avatar}
                src={user.avatarUrl}
                height="24px"
                width="24px"
                alt={`${user.firstName} ${user.lastName}`}
              />
            )}
            {user?.firstName && user?.lastName && (
              <Text fontColor="gray900">
                {user.firstName} {user.lastName}
              </Text>
            )}
          </Flex>
        </TableCell>
      );
    case 'status':
      return (
        <TableCell key={column} className={styles.statusCell} {...rest}>
          {!loading && <EntryStatus sys={asset.sys} />}
          {loading && (
            <SkeletonContainer className={styles.statusSkeleton}>
              <SkeletonDisplayText />
            </SkeletonContainer>
          )}
        </TableCell>
      );
    default:
      return null;
  }
};
