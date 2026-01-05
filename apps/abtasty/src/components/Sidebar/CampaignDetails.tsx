import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { CustomButton } from '@/components/ui/CustomButton';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Campaign } from '@/types';

export const CampaignDetails = ({ campaignInfo, env }: { campaignInfo: Campaign; env: any }) => {
  const handleRedirectToFlagship = () => {
    const url = `https://app.flagship.io/env/${env.id}/report/${campaignInfo.type}/${campaignInfo.id}/details`;
    window.open(url, '_blank');
  };

  return (
    <Box>
      <Typography variant="body2" gutterBottom>
        Campaign Name: <strong>{campaignInfo.name}</strong>
      </Typography>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2">Campaign State:</Typography>
        <Chip
          size="small"
          label={String(campaignInfo.state || '').toUpperCase()}
          variant="outlined"
        />
      </Stack>
      <Divider sx={{ my: 1.5 }} />
      <CustomButton
        fullWidth
        variant="contained"
        size="small"
        onClick={handleRedirectToFlagship}
        endIcon={<OpenInNewIcon />}
      >
        View on AB Tasty
      </CustomButton>
    </Box>
  );
};
