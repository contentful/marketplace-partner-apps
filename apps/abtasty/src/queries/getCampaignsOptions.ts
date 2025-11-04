import { INTEGRATION_API_URL } from '@/constants';
import { Campaign } from '@/types';

type props = {
  token: string;
  projectId: string;
  accountId: string;
};

export const getCampaignsOptions = ({ token, accountId, projectId }: props) => ({
  queryKey: ['getCampaigns', accountId, projectId],
  queryFn: async () => {
    const response = await fetch(
      `${INTEGRATION_API_URL}/api/contentful/accounts/${accountId}/campaigns?projectId=${projectId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return (await response.json()) as Campaign[];
  },
  enabled: !!token && !!accountId && !!projectId,
  staleTime: 5 * 60 * 1000,
});
