import { JsonField } from '@src/configUtils';
import { useRef, useState } from 'react';

type JsonFieldUpdate = Partial<Pick<JsonField, 'isEnabled'>>;

export function useJsonFieldsState() {
  const [jsonFields, setJsonFields] = useState<JsonField[]>([]);
  const jsonFieldsRef = useRef<JsonField[]>([]);

  const initialize = (fields: JsonField[]) => {
    setJsonFields(fields);
    jsonFieldsRef.current = fields;
  };

  const updateField = (contentTypeId: string, fieldId: string, updates: JsonFieldUpdate) => {
    setJsonFields((prev) => {
      const updated = prev.map((field) => (field.contentTypeId === contentTypeId && field.fieldId === fieldId ? { ...field, ...updates } : field));
      jsonFieldsRef.current = updated;
      return updated;
    });
  };

  const resetOriginalState = () => {
    setJsonFields((prev) => {
      const synced = prev.map((f) => ({ ...f, originalEnabled: f.isEnabled }));
      jsonFieldsRef.current = synced;
      return synced;
    });
  };

  return {
    jsonFields,
    jsonFieldsRef,
    initialize,
    updateField,
    resetOriginalState,
    setJsonFields,
  };
}
