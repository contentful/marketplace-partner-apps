import { Table, TableCellProps } from '@contentful/f36-components';
import styles from './styles.module.css';

export const TableCell = ({ children, className = '', ...rest }: TableCellProps) => (
  <Table.Cell className={[styles.tableCell, className].filter(Boolean).join(' ')} {...rest}>
    {children}
  </Table.Cell>
);
