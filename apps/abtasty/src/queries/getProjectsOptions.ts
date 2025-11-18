import { INTEGRATION_API_URL } from '@/constants';

type Props = {
  token: string;
  environmentId: string;
  accountId: string;
};

export const getProjectOptions = ({ token, accountId, environmentId }: Props) => {
  return {
    queryKey: ['folder.flagship', environmentId, accountId],
    queryFn: async () => {
      const response = await fetch(
        `${INTEGRATION_API_URL}/api/contentful/accounts/${accountId}/environments/${environmentId}/projects`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return await response.json();
    },
    enabled: !!token && !!environmentId && !!accountId,
    staleTime: 5 * 60 * 1000,
  };
};
