import { ConfigAppSDK } from '@contentful/app-sdk';
import { ContentTypeProps } from 'contentful-management';

export const JsonFieldType = 'Object';

export interface JsonField {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isEnabled: boolean;
  originalEnabled: boolean;
}

export async function getJsonFields(cma: ConfigAppSDK['cma'], appDefinitionId: string): Promise<JsonField[]> {
  const contentTypes = await cma.contentType.getMany({});
  const jsonFields: JsonField[] = [];

  for (const contentType of contentTypes.items) {
    const editorInterface = await cma.editorInterface.get({ contentTypeId: contentType.sys.id });
    for (const jsonField of contentType.fields.filter((f) => f.type === JsonFieldType)) {
      const control = editorInterface.controls?.find((w) => w.fieldId === jsonField.id);
      const isUsingApp = !!control && control.widgetId === appDefinitionId;
      jsonFields.push({
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        fieldId: jsonField.id,
        fieldName: jsonField.name,
        isEnabled: isUsingApp,
        originalEnabled: isUsingApp,
      });
    }
  }

  return jsonFields.sort((a, b) => {
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    return typeCompare !== 0 ? typeCompare : a.fieldName.localeCompare(b.fieldName);
  });
}
