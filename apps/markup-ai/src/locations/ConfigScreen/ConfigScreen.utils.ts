import type { AppState } from "@contentful/app-sdk";

export interface FieldInfo {
  id: string;
  name: string;
  type: string;
  modelName: string;
  isChecked: boolean;
}

const TEXT_FIELD_TYPES = new Set(["Text", "Symbol", "RichText"]);

export const buildActiveFieldsMap = (
  editorInterface: AppState["EditorInterface"] | undefined,
): Record<string, boolean> => {
  const activeFields: Record<string, boolean> = {};
  if (!editorInterface) return activeFields;
  Object.entries(editorInterface).forEach(([contentTypeId, value]) => {
    value.controls?.forEach((control) => {
      activeFields[`${contentTypeId}:${control.fieldId}`] = true;
    });
  });
  return activeFields;
};

export const collectTextFieldsForContentType = (
  item: { sys: { id: string }; name: string; fields: { id: string; name: string; type: string }[] },
  activeFields: Record<string, boolean>,
): FieldInfo[] =>
  item.fields
    .filter((field) => TEXT_FIELD_TYPES.has(field.type))
    .map((field) => ({
      id: field.id,
      name: field.name,
      type: field.type,
      modelName: item.name,
      isChecked: `${item.sys.id}:${field.id}` in activeFields,
    }));
