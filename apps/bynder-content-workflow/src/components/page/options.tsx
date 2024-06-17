import { Checkbox, Select } from "@contentful/f36-components";
import { DisplayField } from "@/consts/displayFields";
import {
  CF_GC_ENTRY_NAME_FIELD,
  CF_HIDDEN_FIELD,
  IGNORE,
  fieldMapOptions,
  plainTextOptions,
  richTextOptions,
} from "@/consts/fieldMap";
import { statusOptions } from "@/consts/status";
import { ContentFields } from "contentful-management";
import { GCFieldType, CFStatusType, Field, CFFieldType } from "@/type/types";
import { getContentfulFieldType } from "@/utils/fieldMapping";

export function FieldOption({ field }: { field: Field }) {
  const type = field.field_type;
  const isRepeatable = field.metadata.repeatable?.isRepeatable || false;
  const isPlain = field.metadata.is_plain;

  let matchingFields = fieldMapOptions.filter((field) =>
    field.gatherContent.includes(type)
  );

  if (field.field_type === GCFieldType.Text) {
    if (isRepeatable) {
      matchingFields = matchingFields.filter((f) => {
        if (isPlain && f.contentful === CFFieldType.RepeatablePlain) return true;
        if (!isPlain && f.contentful === CFFieldType.RepeatableRich)
          return true;
        return false;
      })
    } else {
      matchingFields = matchingFields.filter((f) => {
        if (field.field_type !== GCFieldType.Text) return true;
        if (isPlain && !plainTextOptions.includes(f.contentful)) return false;
        if (!isPlain && !richTextOptions.includes(f.contentful)) return false;
        return true;
      });
    }
  }

  if (field.field_type === GCFieldType.Component) {
    matchingFields = matchingFields.filter((f) => {
      if (isRepeatable && f.contentful === CFFieldType.SingleComponent)
        return false;
      if (!isRepeatable && f.contentful === CFFieldType.Components)
        return false;
      return true;
    });
  }

  return (
    <>
      {matchingFields.map((field) => (
        <Select.Option value={field.contentful} key={field.name}>
          {field.name}
        </Select.Option>
      ))}
    </>
  );
}

export function StatusOption() {
  const capitalize = (str: string) =>
    `${str.charAt(0).toUpperCase()}${str.substring(1)}`;

  return (
    <>
      {statusOptions.map((status: CFStatusType) => (
        <Select.Option value={status} key={status}>
          {capitalize(status)}
        </Select.Option>
      ))}
      <Select.Option value="ignore">Ignore</Select.Option>
    </>
  );
}

export function CFTypeFieldOptions({
  gcField,
  fields,
  usedFields,
}: {
  gcField: Field;
  fields: ContentFields[];
  usedFields: string[];
}) {
  const type = gcField.field_type;
  const matchingFields = fieldMapOptions.filter((field) =>
    field.gatherContent.includes(type)
  );
  const isRepeatable = gcField.metadata.repeatable?.isRepeatable || false;
  const isPlain = gcField.metadata.is_plain;

  let compatibleFields = fields.filter((field) =>
    matchingFields.find(
      (f) =>
        f.contentful === getContentfulFieldType(field, gcField) &&
        field.id !== CF_HIDDEN_FIELD && field.id !== CF_GC_ENTRY_NAME_FIELD
    )
  );

  if (gcField.field_type === GCFieldType.Text) {
    if (isRepeatable) {
      compatibleFields = fields.filter((field) => {
        if (field.type === CFFieldType.Object) return true;
        return false;
      });
    } else {
      compatibleFields = compatibleFields.filter((field) => {
        if (
          isPlain &&
          !plainTextOptions.includes(getContentfulFieldType(field, gcField))
        )
          return false;
        if (
          !isPlain &&
          !richTextOptions.includes(getContentfulFieldType(field, gcField))
        )
          return false;
        return true;
      });
    }
  }

  if (gcField.field_type === GCFieldType.Component) {
    compatibleFields = compatibleFields.filter((field) => {
      if (isRepeatable && field.type === "Link") return false;
      if (!isRepeatable && field.type === CFFieldType.Array) return false;
      return true;
    });
  }

  return (
    <>
      <Select.Option value={IGNORE}>Ignore</Select.Option>
      {compatibleFields.map((field) => {
        const isDisabled = usedFields.includes(field.id);
        return (
          <Select.Option
            style={{ backgroundColor: isDisabled ? "#dfdfdf" : "transparent" }}
            isDisabled={isDisabled}
            value={field.id}
            key={field.id}
          >
            {field.name}
          </Select.Option>
        );
      })}
    </>
  );
}

export function EntryTitleCheckbox({
  displayField,
  gcFieldId,
  cfFieldId,
  onChange,
}: {
  displayField: DisplayField;
  gcFieldId: string;
  cfFieldId: string;
  onChange: (uuid: string) => void;
}) {
  const hasDisplayField = displayField.cfDisplayField !== null;
  const isDisplayedField = displayField.cfDisplayField === cfFieldId;
  const shouldRender = hasDisplayField
    ? isDisplayedField
    : displayField.pool.includes(gcFieldId);
  if (!shouldRender) {
    return null;
  }
  return (
    <Checkbox
      name="entry-title"
      id={`entry-title-${gcFieldId}`}
      isChecked={
        hasDisplayField ? isDisplayedField : displayField.selected === gcFieldId
      }
      isDisabled={hasDisplayField}
      onChange={() => onChange(gcFieldId)}
      style={{ marginTop: "1rem" }}
    >
      Use field as Entry title
    </Checkbox>
  );
}
