import { CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { RtfField } from '../types';
import AsyncLock from 'async-lock';
const lock = new AsyncLock();

const RichTextFieldType = 'RichText';
const AppWidgetNamespace = 'app';
const BuiltinWidgetNamesspace = 'builtin';
const DefaultWidgetId = 'richTextEditor';

export async function getRichTextFields(cma: CMAClient, appDefinitionId: string): Promise<RtfField[]> {
  // Get all content types
  const contentTypes = await cma.contentType.getMany({});

  // Get our widgetId
  const def = await cma.appDefinition.get({ appDefinitionId: appDefinitionId });
  const appWidgetId = def.sys.id;

  const richTextFields: RtfField[] = [];
  for (const contentType of contentTypes.items) {
    const editorInterface = await cma.editorInterface.get({ contentTypeId: contentType.sys.id });

    for (const rtfField of contentType.fields.filter((f) => f.type === RichTextFieldType)) {
      const control = editorInterface.controls!.find((w) => w.fieldId === rtfField.id);
      richTextFields.push({
        contentTypeId: contentType.sys.id,
        contentTypeName: contentType.name,
        fieldId: rtfField.id,
        fieldName: rtfField.name,
        isEnabled: control!.widgetId === appWidgetId,
      });
    }
  }

  richTextFields.sort((a, b) => {
    // Sort by contentTypeName first
    const typeCompare = a.contentTypeName.localeCompare(b.contentTypeName);
    if (typeCompare !== 0) {
      return typeCompare;
    }

    // Then by fieldName
    return a.fieldName.localeCompare(b.fieldName);
  });

  return richTextFields;
}

export async function setAppRichTextEditor(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
  lock.acquire(contentTypeId, async function () {
    const def = await sdk.cma.appDefinition.get({ appDefinitionId: sdk.ids.app });
    const appWidgetId = def.sys.id;

    const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId: contentTypeId });
    const control = editorInterface.controls!.find((w) => w.fieldId === fieldId)!;
    control.widgetId = appWidgetId;
    control.widgetNamespace = AppWidgetNamespace;

    await sdk.cma.editorInterface.update(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: contentTypeId,
      },
      editorInterface,
    );
  });
}

export async function setDefaultRichTextEditor(sdk: ConfigAppSDK, contentTypeId: string, fieldId: string) {
  lock.acquire(contentTypeId, async function () {
    const editorInterface = await sdk.cma.editorInterface.get({ contentTypeId: contentTypeId });
    const control = editorInterface.controls!.find((w) => w.fieldId === fieldId)!;
    control.widgetId = DefaultWidgetId;
    control.widgetNamespace = BuiltinWidgetNamesspace;

    await sdk.cma.editorInterface.update(
      {
        spaceId: sdk.ids.space,
        environmentId: sdk.ids.environment,
        contentTypeId: contentTypeId,
      },
      editorInterface,
    );
  });
}
