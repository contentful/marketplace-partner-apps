export type ConnectionState = {
  contentfulAppId: string;
  environment: { id: string; label: string };
  space: { id: string; label: string };
  locales: { id: string; label: string; isDefault: boolean }[];
};

export const getWixInstallUrl = (connectionState: ConnectionState) => {
  const installUrl = new URL('https://www.wix.com/installer/install');
  installUrl.searchParams.set('metaSiteId', '{metaSiteId}');
  installUrl.searchParams.set('appId', '9f6d5767-4aea-4de0-93bc-ae381c513365');
  installUrl.searchParams.set('redirectUrl', 'https://www.contentful-on-wix.com/_functions/redirectToContentful');
  installUrl.searchParams.set(
    'state',
    JSON.stringify({
      connectionState,
      mode: 'contentful-market-app',
      alreadyInstalled: true,
    })
  );

  const url = new URL('https://manage.wix.com/account/site-selector');
  url.searchParams.set('actionUrl', installUrl.toString());
  url.searchParams.set('title', 'Select Business To Link to Contentful');
  url.searchParams.set('metaSiteId', '{metaSiteId}');

  return url.toString();
};
