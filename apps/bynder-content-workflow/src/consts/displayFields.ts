import { Dispatch, SetStateAction } from "react";
import { CFFieldType, FieldMapping } from "@/type/types";

type DisplayField = {
  selected: string | undefined;
  pool: string[];
  cfDisplayField: string | null;
};

type SetterFn = Dispatch<SetStateAction<DisplayField>>;

const allowedTypes = [CFFieldType.Symbol, CFFieldType.Text];

const displayFields = {
  init: (fields: FieldMapping[]): DisplayField => {
    const pool = fields
      .map((field) =>
        displayFields.fieldIsAllowed(field.type as CFFieldType)
          ? field.gcId
          : []
      )
      .flat();

    return {
      selected: pool[0],
      pool,
      cfDisplayField: null,
    };
  },
  fieldIsAllowed: (value: CFFieldType) => allowedTypes.includes(value),
  setCFDisplayField: (value: string | null, setter: SetterFn) =>
    setter((prev) => ({
      ...prev,
      cfDisplayField: value,
    })),
  setSelect: (value: string, setter: SetterFn) =>
    setter((prev: DisplayField) => ({
      ...prev,
      pool: [...prev.pool, value],
    })),
  setCheckbox: (value: string, setter: SetterFn) =>
    setter((prev) => ({
      ...prev,
      selected: prev.selected !== value ? value : undefined,
    })),
  delete: (value: string, setter: SetterFn) => {
    setter((prev) => ({
      ...prev,
      pool: (() => {
        const index = prev.pool.indexOf(value);
        if (index > -1) prev.pool.splice(index, 1);
        return prev.pool;
      })(),
    }));
  },
};

export { displayFields, type DisplayField };
