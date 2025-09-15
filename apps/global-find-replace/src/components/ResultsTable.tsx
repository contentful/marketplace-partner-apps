import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Checkbox, Spinner, TextLink, Text } from '@contentful/f36-components';
import { css } from '@emotion/css';
import { ExternalLinkIcon } from '@contentful/f36-icons';
import { MatchField } from '../types';
import { DiffViewer } from './DiffViewer';

interface ResultsTableProps {
  entries: MatchField[];
  selectedEntries: Record<string, boolean>;
  allSelected: boolean;
  isLoading?: boolean;
  spaceId: string;
  selectedCount: number;
  processedCount: number;
  environment: string;
  onEntrySelectionChange: (entryId: string) => void;
  onSelectAllChange: (checked: boolean) => void;
}

export const ResultsTable: React.FC<ResultsTableProps> = ({
  entries,
  selectedEntries,
  allSelected,
  isLoading = false,
  spaceId,
  selectedCount,
  processedCount,
  environment,
  onEntrySelectionChange,
  onSelectAllChange,
}) => {
  if (isLoading) {
    return (
      <div className={css({ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', gap: '10px' })}>
        <Spinner size="large" />
        <Text>
          Applied {processedCount} of {selectedCount} changes
        </Text>
      </div>
    );
  }

  return (
    <Table className={css({ marginTop: '20px' })}>
      <TableHead
        isSticky={true}
        className={css({
          borderBottom: '2px solid #ccc',
          '& th': {
            fontWeight: 'bold',
            color: '#333',
            backgroundColor: '#e8edf2',
          },
        })}>
        <TableRow>
          <TableCell className={css({ backgroundColor: '#e8edf2' })}>
            <Checkbox
              isChecked={allSelected}
              isIndeterminate={!allSelected && Object.values(selectedEntries).some(Boolean)}
              onChange={(e) => onSelectAllChange(e.target.checked)}
            />
          </TableCell>
          <TableCell className={css({ backgroundColor: '#e8edf2' })}>Content Type</TableCell>
          <TableCell className={css({ backgroundColor: '#e8edf2' })}>Display Name</TableCell>
          <TableCell className={css({ backgroundColor: '#e8edf2' })}>Field</TableCell>
          <TableCell className={css({ backgroundColor: '#e8edf2' })}>Changes</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {entries.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell>
              <Checkbox isChecked={selectedEntries[entry.id]} onChange={() => onEntrySelectionChange(entry.id)} />
            </TableCell>
            <TableCell>{entry.contentType}</TableCell>
            <TableCell>
              <TextLink
                icon={<ExternalLinkIcon />}
                alignIcon="end"
                href={`https://app.contentful.com/spaces/${spaceId}/environments/${environment}/entries/${entry.entryId}`}
                target="_blank"
                rel="noopener noreferrer">
                {entry.name}
              </TextLink>
            </TableCell>
            <TableCell>{entry.field}</TableCell>
            <TableCell>
              <DiffViewer diffLines={entry.diffLines} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
