import { ContentFields, ContentTypeProps, EditorInterfaceProps } from 'contentful-management';

export type CompatibleFields = Record<string, ContentFields[]>;
export type SelectedFields = Record<string, string[]>;

export function getCompatibleFields(contentTypes: ContentTypeProps[]): CompatibleFields {
  return contentTypes.reduce((acc, ct) => {
    return {
      ...acc,
      [ct.sys.id]: (ct.fields || []).filter((field) => field.type === 'Object'),
    };
  }, {});
}

export function editorInterfacesToSelectedFields(eis: EditorInterfaceProps[], appId?: string): SelectedFields {
  return eis.reduce((acc, ei) => {
    const ctId = ei?.sys?.contentType?.sys?.id;
    const fieldIds = (ei?.controls ?? [])
      .filter((control) => control.widgetNamespace === 'app' && control.widgetId === appId)
      .map((control) => control.fieldId)
      .filter((fieldId) => typeof fieldId === 'string' && fieldId.length > 0);

    if (ctId && fieldIds.length > 0) {
      return { ...acc, [ctId]: fieldIds };
    } else {
      return acc;
    }
  }, {});
}

export function selectedFieldsToTargetState(contentTypes: ContentTypeProps[], selectedFields: SelectedFields) {
  return {
    EditorInterface: contentTypes.reduce((acc, ct) => {
      const { id } = ct.sys;
      const fields = selectedFields[id] || [];
      const targetState = fields.length > 0 ? { controls: fields.map((fieldId) => ({ fieldId })) } : {};

      return { ...acc, [id]: targetState };
    }, {}),
  };
}
