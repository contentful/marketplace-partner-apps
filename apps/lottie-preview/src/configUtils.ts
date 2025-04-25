import { ConfigAppSDK } from '@contentful/app-sdk';

const JsonFieldType = 'Object';
const AppWidgetNamespace = 'app';
const DefaultWidgetId = 'objectEditor';

interface Control {
  fieldId: string;
  widgetId?: string;
  widgetNamespace?: string;
}

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

export function groupFieldsByContentType(fields: JsonField[]): Record<string, JsonField[]> {
  return fields.reduce((acc, field) => {
    if (!acc[field.contentTypeId]) acc[field.contentTypeId] = [];
    acc[field.contentTypeId].push(field);
    return acc;
  }, {} as Record<string, JsonField[]>);
}

export function buildEditorInterfaceControls(allFields: JsonField[], existingControls: Control[] = [], appId: string): Control[] {
  const managedFieldIds = new Set(allFields.map((f) => f.fieldId));

  const baseControls = existingControls.filter((c) => !managedFieldIds.has(c.fieldId));

  const updatedControls: Control[] = [
    ...baseControls,
    ...allFields.map((field) => ({
      fieldId: field.fieldId,
      widgetId: field.isEnabled ? appId : DefaultWidgetId,
      widgetNamespace: field.isEnabled ? AppWidgetNamespace : 'builtin',
    })),
  ];

  return updatedControls.filter((c) => c.fieldId && c.widgetId && c.widgetNamespace);
}
