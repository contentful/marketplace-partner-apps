import { INTEGRATION_API_URL } from '@/constants';
import { FlagshipAccount } from '@/types';

export const getAccountByUserOptions = (userId: string, token: string, params?: string) => {
  return {
    queryKey: ['getAccounts', userId, params],
    queryFn: async () => {
      const url = new URL(`${INTEGRATION_API_URL}/api/contentful/user/${userId}/accounts`);
      if (params) url.search = params;
      const resp = await fetch(url.toString(), {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!resp.ok) {
        throw new Error(`Failed to fetch accounts (${resp.status})`);
      }
      const data = await resp.json();
      return data as FlagshipAccount[];
    },
    enabled: Boolean(userId && token),
    staleTime: 5 * 60_000,
  };
};
