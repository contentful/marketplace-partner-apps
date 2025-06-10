import { JsonField } from '@src/configUtils';
import { useRef, useState } from 'react';

type JsonFieldUpdate = Partial<Pick<JsonField, 'isEnabled'>>;

export function useJsonFieldsState() {
  const [jsonFields, setJsonFields] = useState<JsonField[]>([]);
  const [version, setVersion] = useState(0);
  const jsonFieldsRef = useRef<JsonField[]>([]);

  const initialize = (fields: JsonField[]) => {
    // Force a new array reference to trigger React re-renders
    const newFields = [...fields];
    setJsonFields(newFields);
    jsonFieldsRef.current = newFields;
    setVersion((prev) => prev + 1);
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
    version,
  };
}
