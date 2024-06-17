import { useCallback, useMemo } from 'react';
import { useLocalStorage } from 'use-local-storage-extended';

const defaultColumns = [
  { name: 'title', label: 'Title', isVisible: true },
  { name: 'description', label: 'Description', isVisible: true },
  { name: 'filename', label: 'Filename', isVisible: false },
  { name: 'createdAt', label: 'Created', isVisible: false },
  { name: 'updatedAt', label: 'Updated', isVisible: false },
  { name: 'updatedBy', label: 'By', isVisible: false },
  { name: 'status', label: 'Status', isVisible: true },
] as const;

type UseColumnsProps = typeof defaultColumns;
export type AvailableColumns = UseColumnsProps[number]['name'];

const useColumns = (columnDescriptor = defaultColumns) => {
  const getDefaultVisibleColumns = (description) =>
    description.filter(({ isVisible }) => isVisible).map(({ name }) => name);

  const [visibleColumns, update] = useLocalStorage({
    key: 'visibleColumns',
    defaultValue: getDefaultVisibleColumns(columnDescriptor),
  });

  const columns = useMemo(
    () => columnDescriptor.map(({ name }) => name),
    [columnDescriptor]
  );
  const columnDetails = useMemo(
    () =>
      columnDescriptor.reduce(
        (acc, { name, ...rest }) => ({
          ...acc,
          [name]: {
            ...rest,
            isVisible: visibleColumns.includes(name),
          },
        }),
        {}
      ),
    [columnDescriptor, visibleColumns]
  );

  const changeColumnVisibility = useCallback(
    (columnName: string, isVisible: boolean) => {
      const newVisibleColumns = isVisible
        ? // Preserve column order
          columns.filter(
            (column) => visibleColumns.includes(column) || column === columnName
          )
        : visibleColumns.filter((name) => name !== columnName);
      update(newVisibleColumns);
    },
    [columns, update, visibleColumns]
  );

  return {
    columns,
    visibleColumns,
    columnDetails,
    changeColumnVisibility,
  };
};

export default useColumns;
