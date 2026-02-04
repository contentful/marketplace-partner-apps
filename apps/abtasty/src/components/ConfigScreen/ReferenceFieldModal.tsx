import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  Divider,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { CustomButton, CustomButtonSecond } from '@/components/ui/CustomButton';

export type ReferenceField = {
  id: string;
  name: string;
  disabled?: boolean;
};

type ReferenceFieldModalParams = {
  open: boolean;
  onClose: () => void;
  contentTypeName: string;
  fields: ReferenceField[];
  value: string[]; // selected reference field ids
  onSave: (nextSelected: string[]) => void;
};

export const ReferenceFieldModal = ({ open, onClose, contentTypeName, fields, value, onSave }: ReferenceFieldModalParams) => {
  const allIds = useMemo(() => fields.map(f => f.id), [fields]);
  const [selected, setSelected] = useState<string[]>(value);
  const [initialValue, setInitialValue] = useState<string[]>(value);

  useEffect(() => {
    setSelected(value);
    setInitialValue(value);
  }, [open, value]);

  const isAllSelected = selected.length === allIds.length && allIds.length > 0;
  const isIndeterminate = selected.length > 0 && selected.length < allIds.length;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? [...allIds] : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => (checked ? [...prev, id] : prev.filter(x => x !== id)));
  };

  // Check if there are any changes compared to initial value
  const hasChanges = useMemo(() => {
    if (selected.length !== initialValue.length) return true;
    const sortedSelected = [...selected].sort();
    const sortedInitial = [...initialValue].sort();
    return !sortedSelected.every((id, idx) => id === sortedInitial[idx]);
  }, [selected, initialValue]);

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="rfm-title" aria-describedby="rfm-desc">
      <Card variant="outlined" sx={{ maxWidth: 640, m: 'auto', mt: 10 }}>
        <CardHeader
          title={
            <Typography fontWeight="bold" variant="h5">
              Edit Reference Fields - {contentTypeName}
            </Typography>
          }
        />
        <CardContent>
          <Typography id="rfm-desc" color="text.secondary" sx={{ mb: 2 }}>
            Select which reference fields you want to include for A/B testing in this content type.
          </Typography>

          <TableContainer sx={{ mb: 2, boxShadow: 0, borderRadius: 3, border: 0.5, borderColor: '#E5E5E5' }}>
            <Table size="medium">
              <TableHead sx={{ backgroundColor: '#F5F5F5' }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(_, checked) => toggleAll(checked)}
                      inputProps={{ 'aria-label': 'select all reference fields' }}
                      sx={{ color: '#3100BF', '&.Mui-checked': { color: '#3100BF' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Field Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fields.map((f) => {
                  const checked = selected.includes(f.id);
                  return (
                    <TableRow key={f.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={checked}
                          onChange={(_, c) => toggleOne(f.id, c)}
                          sx={{ color: '#3100BF', '&.Mui-checked': { color: '#3100BF' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'normal' }}>{f.name}</TableCell>
                      <TableCell>
                        <Chip
                          sx={{ color: checked ? '#40a272' : '#6e6e6e', fontWeight: 600 }}
                          size="small"
                          label={checked ? 'Enabled' : 'Disabled'}
                          color={checked ? 'success' : 'default'}
                          variant={checked ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
          <CustomButtonSecond onClick={onClose} variant="text" size="small" sx={{ mr: 1 }}>
            Cancel
          </CustomButtonSecond>
          <CustomButton onClick={handleSave} variant="contained" size="small" disabled={!hasChanges}>
            Save
          </CustomButton>
        </Box>
      </Card>
    </Modal>
  );
};
