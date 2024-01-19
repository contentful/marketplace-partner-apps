import { Box, Table } from '@contentful/f36-components';
import { TableCell } from './TableCell';

import { SettingsPopover } from './SettingsPopover';
import SelectAllCheckbox from './SelectAllCheckbox';
import SelectionControlsTableRow from './SelectionControlsTableRow';
import TableBody from './TableBody';
import VisibleColumnsCell from './VisibleColumnsCell';
import Paginator from './Paginator';
import useUsers from './hooks/useUsers';

export default function Dashboard() {
  useUsers();
  return (
    <Box marginTop="spacingXl">
      <Box marginTop="spacingXl">
        <Table>
          <Table.Head>
            <Table.Row style={{ position: 'sticky', top: '-35px', zIndex: '1' }}>
              <Table.Cell style={{ verticalAlign: 'middle' }}>
                <SelectAllCheckbox />
              </Table.Cell>
              <VisibleColumnsCell />
              <TableCell align="right" width="50px">
                <SettingsPopover />
              </TableCell>
            </Table.Row>
            <SelectionControlsTableRow />
          </Table.Head>
          <TableBody />
        </Table>
        <Box marginTop="spacingXl" />
        <Paginator />
      </Box>
    </Box>
  );
}
