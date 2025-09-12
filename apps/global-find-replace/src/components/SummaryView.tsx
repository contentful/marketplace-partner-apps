import React from 'react';
import { Flex, Heading, Paragraph, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@contentful/f36-components';
import { MatchField } from '../types';

interface SummaryViewProps {
  appliedChanges: MatchField[];
  publishAfterUpdate: boolean;
  onBackToSearch: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ appliedChanges, publishAfterUpdate, onBackToSearch }) => {
  const publishText = (change: MatchField) => {
    if (!publishAfterUpdate || !change.updateSuccess) {
      return 'Skipped';
    }
    return change.publishSuccess ? 'Success' : change.errorMessage;
  };

  const publishColor = (change: MatchField) => {
    if (!publishAfterUpdate || !change.updateSuccess) {
      return undefined;
    }
    return change.publishSuccess ? 'green' : 'red';
  };

  return (
    <Flex flexDirection="column" padding="spacingL">
      <Flex justifyContent="center" marginBottom="spacingL">
        <Heading>Updates Complete</Heading>
      </Flex>
      <Flex flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom="spacingL">
        <div>
          <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingXs">
            <Flex justifyContent="flex-end" style={{ width: '150px' }}>
              Entries Updated:
            </Flex>
            <Flex justifyContent="flex-start" flexGrow={1} marginLeft="spacing2Xs">
              {new Set(appliedChanges.filter((f) => f.updateSuccess).map((c) => c.entryTitle)).size}
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingXs">
            <Flex justifyContent="flex-end" style={{ width: '150px' }}>
              Fields Updated:
            </Flex>
            <Flex justifyContent="flex-start" flexGrow={1} marginLeft="spacing2Xs">
              {appliedChanges.filter((f) => f.updateSuccess).length}
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingXs">
            <Flex justifyContent="flex-end" style={{ width: '150px' }}>
              Update Errors:
            </Flex>
            <Flex justifyContent="flex-start" flexGrow={1} marginLeft="spacing2Xs">
              {appliedChanges.filter((f) => !f.updateSuccess).length}
            </Flex>
          </Flex>
          <Flex flexDirection="row" justifyContent="space-between" marginBottom="spacingXs">
            <Flex justifyContent="flex-end" style={{ width: '150px' }}>
              Publish Errors:
            </Flex>
            <Flex justifyContent="flex-start" flexGrow={1} marginLeft="spacing2Xs">
              {appliedChanges.filter((f) => !f.publishSuccess && publishAfterUpdate).length}
            </Flex>
          </Flex>
        </div>

        <Button variant="secondary" onClick={onBackToSearch} style={{ marginBottom: '25px' }}>
          Back to Search
        </Button>
      </Flex>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Content Type</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Field</TableCell>
            <TableCell>Update</TableCell>
            <TableCell>Publish</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appliedChanges.map((change, i) => (
            <TableRow key={i}>
              <TableCell>{change.entryContentTypeName}</TableCell>
              <TableCell>{change.entryTitle}</TableCell>
              <TableCell>{change.name}</TableCell>
              <TableCell style={{ color: change.updateSuccess ? 'green' : 'red' }}>{change.updateSuccess ? 'Success' : change.errorMessage}</TableCell>
              <TableCell style={{ color: publishColor(change) }}>{publishText(change)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Flex>
  );
};
