import React from 'react';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  SkeletonRow,
  Checkbox
} from '@contentful/forma-36-react-components';

const EntryTableLoading = () => {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            <Checkbox labelText="" checked={false} />
          </TableCell>
          <TableCell>Title</TableCell>
          <TableCell>Content Type</TableCell>
          <TableCell>Last Updated</TableCell>
          <TableCell>Release Status</TableCell>
          <TableCell>Lilt Status</TableCell>
          <TableCell>Target Locales</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <SkeletonRow rowCount={8} columnCount={7} />
      </TableBody>
    </Table>
  );
};

export default EntryTableLoading;
