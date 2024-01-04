import { Table, TableCellProps } from '@contentful/f36-components';

export const TableCell = ({ children, style = {}, ...rest }: TableCellProps) => (
  <Table.Cell style={{ verticalAlign: 'middle', ...style }} {...rest}>
    {children}
  </Table.Cell>
);
