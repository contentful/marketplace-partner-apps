import { PlainClientAPI } from 'contentful-management';
import { ConfigAppSDK } from '@contentful/app-sdk';

export async function getInitialFieldContentTypes(cma: PlainClientAPI, sdk: ConfigAppSDK) {
  const editorInterfaces = await cma.editorInterface.getMany({
    spaceId: sdk.ids.space,
    environmentId: sdk.ids.environment,
  });

  return editorInterfaces.items
    .filter((ei) => {
      const fieldWidget = ei.controls?.find(
        (item) => item.widgetId === sdk.ids.app && item.widgetNamespace === 'app'
      );
      return !!fieldWidget;
    })
    .map((ei) => ei.sys.contentType.sys.id);
};