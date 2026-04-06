import { ContentfulClientApi, createClient } from 'contentful';

export function createCDAClient(spaceId: string, envId: string, accessToken: string): ContentfulClientApi<any> {
  return createClient({
    space: spaceId,
    accessToken: accessToken,
    environment: envId
  });
}