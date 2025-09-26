import Typography from '@mui/material/Typography';
import { Box, Divider, Skeleton } from '@mui/material';
import { CustomButton } from '@/components/ui/CustomButton';

export const LoadingState = () => {
  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>Campaign selected</Typography>
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
      <Divider sx={{ my: 1.5 }} />
      <CustomButton variant="contained" fullWidth disabled>
        Loading...
      </CustomButton>
    </Box>
  )
}