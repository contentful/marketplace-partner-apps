export async function getContentTypes(client: any, spaceId: string, envId: string) {
  const { pages, items } = await client.contentType.getMany({
    spaceId: spaceId,
    environmentId: envId,
  });

  return items;
}