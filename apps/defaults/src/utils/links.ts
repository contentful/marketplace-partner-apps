export function getFunctionLogsUrl(sdk: any) {
  return `https://app.contentful.com/account/organizations/${
    sdk.ids.organization
  }/apps/definitions/${
    sdk.ids.app
  }/functions/appeventHandler/logs?environmentId=${
    sdk.ids.environmentAlias ?? sdk.ids.environment
  }&spaceId=${sdk.ids.space}`;
}

export function getContentTypeUrl(sdk: any, ctId: string) {
  return `https://app.contentful.com/spaces/${sdk.ids.space}/environments/${
    sdk.ids.environmentAlias ?? sdk.ids.environment
  }/content_types/${ctId}`;
}
