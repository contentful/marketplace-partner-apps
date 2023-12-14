import React from 'react';
import PropTypes from 'prop-types';
import {
  Table,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@contentful/forma-36-react-components';
import { Checkbox } from '@contentful/f36-components';

import EntryRow from './entry-row';

const EntryTable = ({
  entries,
  selected,
  areAllSelected,
  onChangeAll,
  onCheckboxChange,
  defaultLocale
}) => {
  return (
    <div className="table-container">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <Checkbox onChange={onChangeAll} isChecked={areAllSelected} />
            </TableCell>
            <TableCell>Title</TableCell>
            <TableCell>Target Locales</TableCell>
            <TableCell>Release Status</TableCell>
            <TableCell>Lilt Status</TableCell>
            <TableCell>Content Type</TableCell>
            <TableCell>Last Updated</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map(entry => {
            const { id } = entry.sys;
            const isSelected = selected.includes(id);
            return (
              <EntryRow
                key={id}
                entry={entry}
                isSelected={isSelected}
                onChange={onCheckboxChange}
                defaultLocale={defaultLocale}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

EntryTable.propTypes = {
  entries: PropTypes.arrayOf(PropTypes.object).isRequired,
  selected: PropTypes.arrayOf(PropTypes.string).isRequired,
  areAllSelected: PropTypes.bool.isRequired,
  onChangeAll: PropTypes.func.isRequired,
  onCheckboxChange: PropTypes.func.isRequired,
  defaultLocale: PropTypes.string.isRequired
};

export default EntryTable;
