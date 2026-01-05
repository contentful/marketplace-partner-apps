import { INTEGRATION_API_URL } from '@/constants';
import { User } from '@/types';

export const getMeQueryOptions = (token: string) => ({
  queryKey: ['me', token],
  queryFn: async () => {
    const response = await fetch(`${INTEGRATION_API_URL}/api/contentful/user/me`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    return (await response.json()) as User;
  },
  enabled: !!token,
  staleTime: 1000 * 60 * 5,
});
