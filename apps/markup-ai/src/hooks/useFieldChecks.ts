import { useState, useCallback } from "react";
import { FieldCheck, FieldCheckMap } from "../types/rewriter";
import { createInitialFieldCheck, updateFieldCheck } from "../services/rewriterService";

export const useFieldChecks = () => {
  const [fieldChecks, setFieldChecks] = useState<FieldCheckMap>({});

  const updateCheck = useCallback((fieldId: string, updates: Partial<FieldCheck>) => {
    setFieldChecks((prev) => updateFieldCheck(prev, fieldId, updates));
  }, []);

  const createCheck = useCallback((fieldId: string, value: string) => {
    setFieldChecks((prev) =>
      updateFieldCheck(prev, fieldId, createInitialFieldCheck(fieldId, value)),
    );
  }, []);

  const removeCheck = useCallback((fieldId: string) => {
    setFieldChecks((prev) => {
      const newChecks = { ...prev };
      Reflect.deleteProperty(newChecks, fieldId);
      return newChecks;
    });
  }, []);

  const clearChecks = useCallback(() => {
    setFieldChecks({});
  }, []);

  return {
    fieldChecks,
    updateCheck,
    createCheck,
    removeCheck,
    clearChecks,
  };
};
