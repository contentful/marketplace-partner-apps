import { SidebarAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import Typography from '@mui/material/Typography';
import { Stack } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getCampaignsOptions } from '@/queries/getCampaignsOptions';
import { getToken } from '@/utils/getToken';
import { LoadingState } from '@/components/Common/LoadingState';
import { useLocalStorageSync } from '@/hook/useLocalStorageSync';
import { CampaignDetails } from '@/components/Sidebar/CampaignDetails';
import { EmptyStateSidebar } from '@/components/Common/EmptyStates';


const Sidebar = () => {
  const sdk = useSDK<SidebarAppSDK>();
  const { selectedCampaignId, selectedProjectId } = useLocalStorageSync();

  const { flagship_account: account, flagship_env: env } = sdk.parameters.installation;
  const token = getToken() || '';

  if (!account?.account_id || !env || !token) {
    return <Typography>Parameters are not configured</Typography>;
  }

  const { data: campaigns, isLoading: campaignsLoading } = useQuery(
    getCampaignsOptions({
      token,
      accountId: account.account_id,
      projectId: selectedProjectId || '',
    })
  );

  const campaignInfo = campaigns?.find((c) => c.id === selectedCampaignId);

  const renderContent = (() => {
    if (campaignsLoading) return <LoadingState />;
    if (!selectedCampaignId || !campaignInfo) return <EmptyStateSidebar />;
    return <CampaignDetails campaignInfo={campaignInfo} env={env} />;
  })()
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
      {renderContent}
    </Stack>
  );
};

export default Sidebar;