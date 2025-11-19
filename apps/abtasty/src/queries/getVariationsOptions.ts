import { INTEGRATION_API_URL } from '@/constants';
import { Variation } from '@/types';

type Props = {
  token: string;
  accountId: string;
  campaignId: string;
  variationGroupId: string;
};

export const getVariationsOptions = ({ token, accountId, campaignId, variationGroupId }: Props) => {
  return {
    queryKey: ['getVariations', accountId, campaignId, variationGroupId],
    queryFn: async () => {
      const response = await fetch(
        `${INTEGRATION_API_URL}/api/contentful/accounts/${accountId}/campaigns/${campaignId}/variation-group/${variationGroupId}/variations`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch variations');
      }

      return (await response.json()) as Variation[];
    },
    enabled: !!token && !!accountId && !!campaignId && !!variationGroupId,
    staleTime: 5 * 60 * 1000,
  };
};
