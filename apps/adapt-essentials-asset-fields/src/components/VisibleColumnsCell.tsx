import { TableCell } from './TableCell';
import useColumns from './hooks/useColumns';

const VisibleColumnsCell = () => {
  const { columnDetails, visibleColumns } = useColumns();

  return visibleColumns.map((column) => (
    <TableCell key={column} width={column == 'status' ? '50px' : 'inherit'}>
      {columnDetails[column].label}
    </TableCell>
  ));
};

export default VisibleColumnsCell;
