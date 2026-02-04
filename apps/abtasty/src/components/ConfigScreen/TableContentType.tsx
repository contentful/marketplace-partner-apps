import * as React from 'react';
import { useMemo, useEffect, useState } from 'react';
import { useContentfulContentTypes } from '@/hooks/useContentfulContentTypes';
import { CONTENT_TYPE_ID } from '@/constants';
import { ConfigAppSDK } from '@contentful/app-sdk';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import TuneIcon from '@mui/icons-material/Tune';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { ReferenceFieldModal, ReferenceField } from '@/components/ConfigScreen/ReferenceFieldModal';
import { CustomButton, CustomButtonSecond } from '@/components/ui/CustomButton';

interface Data {
  id: string;
  name: string;
  referenceFields: string;
  action?: string;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

type Order = 'asc' | 'desc';

function getComparator(
  order: Order,
  orderBy: keyof Data,
): (
  a: Data,
  b: Data,
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

interface HeadCell {
  disablePadding: boolean;
  id: keyof Data;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: true,
    label: 'Content type',
  },
  {
    id: 'referenceFields',
    numeric: false,
    disablePadding: false,
    label: 'Reference fields',
  },
  {
    id: 'action',
    numeric: false,
    disablePadding: false,
    label: '',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  numVisibleSelected: number;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
  visibleRowCount: number;
}

function EnhancedTableHead({ onSelectAllClick, order, orderBy, numSelected, numVisibleSelected, rowCount, visibleRowCount }: EnhancedTableProps) {

  return (
    <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numVisibleSelected > 0 && numVisibleSelected < visibleRowCount}
            checked={visibleRowCount > 0 && numVisibleSelected === visibleRowCount}
            onChange={onSelectAllClick}
            inputProps={{
              'aria-label': 'select all content types on this page',
            }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            sx={{ fontWeight: 'bold' }}
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              sx={{ fontWeight: 'bold' }}
              active={orderBy === headCell.id}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

type SelectedCt = { id: string; referenceField: string[] };

type TableContentTypeParams = {
  sdk: ConfigAppSDK;
  selectedContentTypes: SelectedCt[];
  onUpdateContentTypes: (updater: (prev: SelectedCt[]) => SelectedCt[]) => void;
};

export const TableContentType = ({ sdk, selectedContentTypes, onUpdateContentTypes }: TableContentTypeParams) => {
  const { contentTypes } = useContentfulContentTypes(sdk, CONTENT_TYPE_ID);

  const refFieldsByCt = useMemo(() => {
    const map: Record<string, ReferenceField[]> = {};
    for (const ct of contentTypes) {
      const fields = (ct.items || [])
        .filter((item: any) => item.type === 'Array' && item.items?.type === 'Link' && item.items?.linkType === 'Entry')
        .map((item: any) => ({ id: item.id, name: item.name, disabled: Boolean(item.disabled) }));
      map[ct.id] = fields;
    }
    return map;
  }, [contentTypes]);

  const rows: Data[] = useMemo(() => {
    return contentTypes.filter(ct => ct.items.length !== 0).map((ct) => {
      const selected = selectedContentTypes.find((s) => s.id === ct.id);
      const names = (selected?.referenceField || refFieldsByCt[ct.id]?.map((f) => f.id) || [])
        .map((fid) => refFieldsByCt[ct.id]?.find((f) => f.id === fid)?.name || fid)
        .filter(Boolean)
        .join(', ');
      return {
        id: ct.id,
        name: ct.name,
        referenceFields: names || 'None selected',
      };
    });
  }, [contentTypes, selectedContentTypes, refFieldsByCt]);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<keyof Data>('name');
  const selectedIds = useMemo(() => selectedContentTypes.map((s) => s.id), [selectedContentTypes]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [modalCtId, setModalCtId] = useState<string | null>(null);
  const handleOpen = (ctId: string) => setModalCtId(ctId);
  const handleClose = () => setModalCtId(null);

  const [showSelectAllBanner, setShowSelectAllBanner] = useState(false);

  // Calculate visible rows (needs to be before handlers that use it)
  const visibleRows = useMemo(
    () =>
      [...rows]
        .sort(getComparator(order, orderBy))
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [order, orderBy, page, rowsPerPage, rows],
  );

  // Default: select all content types on initial load (no save - just UI state)
  useEffect(() => {
    if (contentTypes.length > 0 && selectedContentTypes.length === 0) {
      onUpdateContentTypes(() =>
        contentTypes.map((ct: any) => ({
          id: ct.id,
          referenceField: (refFieldsByCt[ct.id] || []).map((f) => f.id),
        }))
      );
    }
  }, [contentTypes.length, refFieldsByCt]);

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // Select only visible rows on current page
      const visibleIds = visibleRows.map(r => r.id);

      onUpdateContentTypes((prev) => {
        const existing = prev.filter(p => !visibleIds.includes(p.id));
        const newSelections = visibleIds.map(id => ({
          id,
          referenceField: (refFieldsByCt[id] || []).map((f) => f.id)
        }));
        return [...existing, ...newSelections];
      });

      if (visibleRows.length < rows.length) {
        setShowSelectAllBanner(true);
      }
      return;
    }

    // Deselect only visible rows on current page
    const visibleIds = visibleRows.map(r => r.id);
    onUpdateContentTypes((prev) => prev.filter((p) => !visibleIds.includes(p.id)));
    setShowSelectAllBanner(false);
  };

  const handleSelectAllPages = () => {
    onUpdateContentTypes(() =>
      rows.map((row) => ({
        id: row.id,
        referenceField: (refFieldsByCt[row.id] || []).map((f) => f.id)
      }))
    );
    // Keep banner visible to show "Clear selection" button
  };

  const handleClearSelection = () => {
    onUpdateContentTypes(() => []);
    setShowSelectAllBanner(false);
  };

  const handleClick = (event: React.MouseEvent<unknown>, id: string) => {
    event.stopPropagation();
    const isSelected = selectedIds.includes(id);
    if (isSelected) {
      onUpdateContentTypes((prev) => prev.filter((p) => p.id !== id));
    } else {
      onUpdateContentTypes((prev) => [
        ...prev,
        { id, referenceField: (refFieldsByCt[id] || []).map((f) => f.id) },
      ]);
    }
    setShowSelectAllBanner(false);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
    setShowSelectAllBanner(false);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const numVisibleSelected = useMemo(() => {
    const visibleIds = visibleRows.map(r => r.id);
    return selectedIds.filter(id => visibleIds.includes(id)).length;
  }, [visibleRows, selectedIds]);

  const isAllRowsSelected = selectedIds.length === rows.length && rows.length > 0;

  return (
    <Box sx={{ width: '100%' }}>
      {showSelectAllBanner && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            isAllRowsSelected ? (
              <CustomButtonSecond color="inherit" size="small" onClick={handleClearSelection}>
                Clear selection
              </CustomButtonSecond>
            ) : (
              <CustomButtonSecond color="inherit" size="small" onClick={handleSelectAllPages}>
                Select all {rows.length} content types
              </CustomButtonSecond>
            )
          }
          onClose={() => setShowSelectAllBanner(false)}
        >
          {isAllRowsSelected ? (
            <>All {rows.length} content type{rows.length > 1 ? 's' : ''} selected.</>
          ) : (
            <>
              {numVisibleSelected} content type{numVisibleSelected > 1 ? 's' : ''} on this page{' '}
              {numVisibleSelected > 1 ? 'are' : 'is'} selected.
            </>
          )}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ boxShadow: 0, borderRadius: 3, border: 0.5, borderColor: '#E5E5E5' }}>
        <Table aria-labelledby="tableTitle" size={'medium'}>
          <EnhancedTableHead
            numSelected={selectedIds.length}
            numVisibleSelected={numVisibleSelected}
            order={order}
            orderBy={orderBy}
            onSelectAllClick={handleSelectAllClick}
            rowCount={rows.length}
            visibleRowCount={visibleRows.length}
          />
          <TableBody>
            {visibleRows.map((row, index) => {
              const isItemSelected = selectedIds.includes(row.id);
              const labelId = `enhanced-table-checkbox-${index}`;

              return (
                <TableRow
                  hover
                  aria-checked={isItemSelected}
                  tabIndex={-1}
                  key={row.id}
                  selected={isItemSelected}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'transparent',
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      checked={isItemSelected}
                      onClick={(event) => handleClick(event, row.id)}
                      inputProps={{
                        'aria-labelledby': labelId,
                      }}
                    />
                  </TableCell>
                  <TableCell component="th" id={labelId} scope="row" padding="none">
                    {row.name}
                  </TableCell>
                  <TableCell align="left">{row.referenceFields}</TableCell>
                  <TableCell align="left">
                    <Tooltip title="Edit reference fields">
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpen(row.id);
                        }}
                      >
                        <EditIcon fontSize={'small'} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
            {emptyRows > 0 && (
              <TableRow
                style={{
                  height: 45 * emptyRows,
                }}
              >
                <TableCell colSpan={headCells.length + 1} />
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <ReferenceFieldModal
        open={Boolean(modalCtId)}
        onClose={handleClose}
        contentTypeName={contentTypes.find((c) => c.id === modalCtId)?.name || ''}
        fields={(modalCtId ? refFieldsByCt[modalCtId] : []) || []}
        value={selectedContentTypes.find((s) => s.id === modalCtId)?.referenceField || []}
        onSave={(nextSelected) => {
          if (!modalCtId) return;
          onUpdateContentTypes((prev) => {
            const idx = prev.findIndex((p) => p.id === modalCtId);
            if (idx > -1) {
              const clone = [...prev];
              clone[idx] = { ...clone[idx], referenceField: nextSelected };
              return clone;
            }
            return [...prev, { id: modalCtId, referenceField: nextSelected }];
          });
        }}
      />
    </Box>
  );
};
