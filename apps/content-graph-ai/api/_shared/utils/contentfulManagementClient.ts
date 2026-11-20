export async function createContentfulManagementClient(accessToken: string) {
  const contentfulManagementPkg = await import("contentful-management");
  const pkg = contentfulManagementPkg as unknown as {
    createClient?: (opts: { accessToken: string }) => unknown;
    default?: { createClient?: (opts: { accessToken: string }) => unknown };
  };
  const createClient = pkg.createClient || pkg.default?.createClient;

  if (!createClient) {
    throw new Error("Failed to load Contentful management client");
  }

  return createClient({ accessToken });
}
