import { EditorAppSDK, FieldAppSDK } from "@contentful/app-sdk";
import { KeyValueMap } from "contentful-management";
import { type Rule } from "./types/Rule";

// Converts a field into <FieldAPI> data type, which is the expected data type for many API methods
const getFieldAPI = (fieldId: string, sdk: EditorAppSDK, locale: string) =>
  sdk.entry.fields[fieldId].getForLocale(locale);

// Creates a <FieldAppSDK> type that can be passed to components from the default-field-editors package
export const getFieldAppSdk = (
  fieldId: string,
  sdk: EditorAppSDK,
  locale?: string
) => {
  const fieldAPI = getFieldAPI(fieldId, sdk, locale || sdk.locales.default);
  return Object.assign({ field: fieldAPI }, sdk) as FieldAppSDK;
};

// Get localization setting for a field
export const getLocaleName = (sdk: EditorAppSDK, locale: string) =>
  sdk.locales.names[locale];

// Check if a field is meant to be displayed conditionally
const isFieldHidden = (
  fieldId: string,
  contentType: string,
  rules: Rule[],
  entryId: string
): boolean => {
  return !!rules.find(
    (rule) =>
      ((rule.isForSameEntity && rule.entryId === entryId) ||
        (!rule.isForSameEntity && rule.entryId !== entryId)) &&
      rule.targetEntity === contentType &&
      rule.targetEntityField.includes(fieldId)
  );
};

export const isRuleValid = (
  rule: Rule,
  entryFields: any,
  entryContentType: string
) => {
  if (rule.contentType !== entryContentType) {
    return false;
  }

  const contentTypeField = rule.contentTypeField;

  if (!entryFields.hasOwnProperty(contentTypeField)) {
    return false;
  }

  const condition = rule.condition;
  const conditionValue = rule.conditionValue;
  let isValid = false;

  //get content type field value
  const contentTypeFieldValue =
    entryFields[contentTypeField].value ||
    entryFields[contentTypeField].getValue?.();

  switch (condition) {
    case "is equal":
      isValid = contentTypeFieldValue === conditionValue;
      break;
    case "is not equal":
      isValid = contentTypeFieldValue !== conditionValue;
      break;
    case "contains":
      isValid = contentTypeFieldValue?.includes(conditionValue);
      break;
    case "is empty":
      isValid = Boolean(!contentTypeFieldValue);
      break;
    case "is not empty":
      isValid = Boolean(contentTypeFieldValue);
      break;
    default:
      break;
  }

  return isValid;
};

export const calculateEditorFields = (
  entryId: string,
  entryFields: KeyValueMap,
  sdk: EditorAppSDK,
  isFirstLoad: boolean
) => {
  // get rules from session storage & filter rules for current entryId
  const existingFilteredRules = JSON.parse(
    sessionStorage.getItem("filteredRules") || "[]"
  ).filter((rule: Rule) => rule.entryId !== entryId);

  const rules = sdk.parameters.installation.rules || ([] as Rule[]);
  const filteredRules: Rule[] = rules
    ?.filter((rule: Rule) =>
      isRuleValid(rule, entryFields, sdk.contentType.sys.id)
    )
    .map((rule: Rule) => ({ ...rule, entryId }));

  const rulesList = [...existingFilteredRules, ...filteredRules];
  const uniqueRulesList: Rule[] = [];

  for (const rule of rulesList) {
    const duplicate = uniqueRulesList.find(
      (item: Rule) =>
        item.contentType === rule.contentType &&
        item.contentTypeField === rule.contentTypeField &&
        item.targetEntity === rule.targetEntity &&
        item.targetEntityField === rule.targetEntityField &&
        item.condition === rule.condition &&
        item.conditionValue === rule.conditionValue
    );
    if (!duplicate) {
      uniqueRulesList.push(rule);
    }
  }

  if (!isFirstLoad || uniqueRulesList?.length) {
    sessionStorage.setItem("filteredRules", JSON.stringify(uniqueRulesList));
  }

  return sdk.contentType.fields.filter(
    (field) =>
      !isFieldHidden(field.id, sdk.contentType.sys.id, uniqueRulesList, entryId)
  );
};

//Get content type name from content type id
export const getContentTypeName = (
  contentTypeId: string,
  allContentTypes: any[]
) => {
  return allContentTypes.find(
    (contentType) => contentType.sys.id === contentTypeId
  )?.name;
};

export const getFieldName = (
  fieldId: string[],
  targetEntityId: string,
  allContentTypes: any[]
) => {
  //get fields for content type
  const contentTypeFields = allContentTypes.find(
    (contentType) => contentType.sys.id === targetEntityId
  )?.fields;
  const fieldNames: string[] = [];

  //find field name from field id in content type
  fieldId?.forEach((id) => {
    const field = contentTypeFields?.find((field: any) => field.id === id);

    if (field) {
      fieldNames.push(field.name);
    }
  });

  return fieldNames;
};
