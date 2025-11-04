import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { CustomButton } from '@/locations/ConfigScreen';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getCampaignsOptions } from '@/queries/getCampaignsOptions';
import { useEffect, useState } from 'react';
import { getToken } from '@/utils/getToken';
<<<<<<< Updated upstream
import { Chip, Skeleton, Divider, Box } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
=======
import { LoadingState } from '@/components/Common/LoadingState';
import { useLocalStorageSync } from '@/hooks/useLocalStorageSync';
import { CampaignDetails } from '@/components/Sidebar/CampaignDetails';
import { EmptyStateSidebar } from '@/components/Common/EmptyStates';

>>>>>>> Stashed changes

const Sidebar = () => {
    const sdk = useSDK<SidebarAppSDK>();

    const [selectedCampaignId, setSelectedCampaign] = useState<string | null>(null);
    const [selectedProjectId, setSelectedProject] = useState<string | null>(null);

    const { flagship_account: account, flagship_env: env } =
        sdk.parameters.installation;
    const token = getToken() || '';

    if (!account?.account_id || !env || !token) {
        return <Typography>Parameters are not configured</Typography>;
    }

    useEffect(() => {
      const syncFromLocalStorage = () => {
        const projectId = localStorage.getItem('projectId');
        const campaignId = localStorage.getItem('campaignId');
        setSelectedProject(projectId || null);
        setSelectedCampaign(campaignId || null);
      };

      syncFromLocalStorage();

      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'projectId' || e.key === 'campaignId') {
          syncFromLocalStorage();
        }
      };

      const handleFocus = () => syncFromLocalStorage();

      window.addEventListener('storage', handleStorage);
      window.addEventListener('focus', handleFocus);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('focus', handleFocus);
      };
    }, []);

    const { data: campaigns, isLoading: campaignsLoading } = useQuery(getCampaignsOptions({
        token,
        accountId: account.account_id,
        projectId: selectedProjectId || '',
      }))

    const campaignInfo = campaigns?.find((c) => c.id === selectedCampaignId)

    const handleRedirectToFlagship = () => {
      const url = `https://app.flagship.io/env/${env.id}/report/${campaignInfo?.type}/${campaignInfo?.id}/details`;
      window.open(url, '_blank');
    };

    return (
      <Stack
        direction="column"
        spacing={2}
        sx={{
          width: '100%',
          height: '100%',
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        {campaignsLoading ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Campaign selected</Typography>
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
            <Divider sx={{ my: 1.5 }} />
            <CustomButton variant="contained" fullWidth disabled>
              Loading...
            </CustomButton>
          </Box>
        ) : !selectedCampaignId || !campaignInfo ? (
          <Box>
            <Typography variant="subtitle2" gutterBottom>No campaign selected</Typography>
            <Typography variant="body2" color="text.secondary">
              Select a campaign to see details here.
            </Typography>
            <Divider sx={{ my: 1.5 }} />
            <CustomButton fullWidth variant="contained" disabled>
              View on AB Tasty
            </CustomButton>
          </Box>
        ) : (
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
              disabled={!selectedCampaignId}
              endIcon={<OpenInNewIcon />}
            >
              View on AB Tasty
            </CustomButton>
          </Box>
        )}
      </Stack>
    );
};

export default Sidebar;