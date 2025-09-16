import React from 'react';
import { Flex, Heading, Paragraph, Table, TableBody, TableCell, TableHead, TableRow, Button } from '@contentful/f36-components';
import { MatchField } from '../types';

interface SummaryViewProps {
  appliedChanges: MatchField[];
  onBackToSearch: () => void;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ appliedChanges, onBackToSearch }) => {
  return (
    <Flex flexDirection="column" padding="spacingL">
      <Heading>Updates Complete!</Heading>
      <Paragraph>
        {appliedChanges.length} fields updated across {new Set(appliedChanges.map((c) => c.name)).size} content entries
      </Paragraph>
      <Button variant="secondary" onClick={onBackToSearch} style={{ marginBottom: '25px' }}>
        Back to Search
      </Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Content Type</TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Field</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {appliedChanges.map((change, i) => (
            <TableRow key={i}>
              <TableCell>{change.contentType}</TableCell>
              <TableCell>{change.name}</TableCell>
              <TableCell>{change.field}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Flex>
  );
};
