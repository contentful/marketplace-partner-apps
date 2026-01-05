import React from 'react';
import { Stack, Typography, Box } from '@mui/material';
import { CustomButtonDanger, CustomButtonSuccess } from '@/components/ui/CustomButton';

export type LinkedEntryCardProps = {
  entryId: string;
  contentTypeName?: string;
  entryName?: string;
  contentTypeId?: string;
  title?: string;
  onView: () => void;
  onRemove: () => void;
};

export const LinkedEntryCard: React.FC<LinkedEntryCardProps> = ({
  entryId,
  entryName,
  contentTypeName,
  contentTypeId,
  title = 'Linked entry',
  onView,
  onRemove,
}) => {
  return (
    <Box
      sx={{
        mt: 2,
        border: '1px solid #E0E0E0',
        borderRadius: 1,
        p: 1.5,
        bgcolor: '#FAFAFA',
      }}
    >
      <Typography fontWeight="bold">{title}</Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" marginTop={1} >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={4}>
          <Typography variant="body2">Entry name: {entryName}</Typography>
          <Typography variant="body2">
            Content type: {contentTypeName || contentTypeId || 'Unknown'}
          </Typography>
          <Typography variant="body2">ID: {entryId}</Typography>
        </Stack>

        <Stack direction="row" spacing={1}>
          <CustomButtonSuccess
            size="small"
            variant="outlined"
            color="secondary"
            onClick={onView}
          >
            View
          </CustomButtonSuccess>
          <CustomButtonDanger
            size="small"
            variant="contained"
            color="error"
            onClick={onRemove}
          >
            Remove
          </CustomButtonDanger>
        </Stack>
      </Stack>
    </Box>
  );
};