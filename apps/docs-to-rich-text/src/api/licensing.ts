import { CMAClient } from '@contentful/app-sdk';
import axios from 'axios';

export async function IsSpaceLicensed(spaceId: string): Promise<boolean> {
  return await axios
    .get('https://api.ellavationlabs.com/api/rtf/license', {
      params: {
        spaceId,
      },
    })
    .then((response) => {
      return response.data;
    })
    .catch(() => false);
}

export async function IsWithinLicenseLimits(cma: CMAClient, appDefinitionId: string, spaceId: string): Promise<boolean> {
  return (await IsSpaceLicensed(spaceId)) || (await getFieldWidgetUsageCount(cma, appDefinitionId)) <= 5;
}

export async function getFieldWidgetUsageCount(cma: CMAClient, appDefinitionId: string): Promise<number> {
  const def = await cma.appDefinition.get({ appDefinitionId: appDefinitionId });
  const widgetId = def.sys.id;
  const interfaces = await cma.editorInterface.getMany({});

  let total = 0;
  const contentTypesUsedOn: string[] = [];
  for (let i = 0; i < interfaces.items.length; i++) {
    const field = interfaces.items[i];
    const widgets = field.controls!.filter((x) => x.widgetId === widgetId);
    total += widgets.length;
    if (widgets.length > 0) {
      contentTypesUsedOn.push(field.sys.contentType.sys.id);
    }
  }
  return total;
}
