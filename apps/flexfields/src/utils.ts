import { EditorAppSDK, FieldAppSDK } from "@contentful/app-sdk";
import { KeyValueMap } from "contentful-management";
import { documentToPlainTextString } from "@contentful/rich-text-plain-text-renderer";
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
    // Text field conditions
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
    
    // Number field conditions
    case "less than":
      isValid = Number(contentTypeFieldValue) < Number(conditionValue);
      break;
    case "greater than":
      isValid = Number(contentTypeFieldValue) > Number(conditionValue);
      break;
    case "equal":
      isValid = Number(contentTypeFieldValue) === Number(conditionValue);
      break;
    case "not equal":
      isValid = Number(contentTypeFieldValue) !== Number(conditionValue);
      break;
    case "between":
      isValid =
        Number(contentTypeFieldValue) >= Number(rule.conditionValueMin) &&
        Number(contentTypeFieldValue) <= Number(rule.conditionValueMax);
      break;
    
    // Boolean field conditions
    case "is true":
      isValid = contentTypeFieldValue === true;
      break;
    case "is false":
      // Treat undefined as false
      isValid = contentTypeFieldValue === false || contentTypeFieldValue === undefined;
      break;
    
    // Reference field conditions (Link and Array of Links)
    case "reference count less than": {
      const refCount = Array.isArray(contentTypeFieldValue)
        ? contentTypeFieldValue.length
        : contentTypeFieldValue
        ? 1
        : 0;
      isValid = refCount < Number(conditionValue);
      break;
    }
    case "reference count greater than": {
      const refCount = Array.isArray(contentTypeFieldValue)
        ? contentTypeFieldValue.length
        : contentTypeFieldValue
        ? 1
        : 0;
      isValid = refCount > Number(conditionValue);
      break;
    }
    case "reference count equal": {
      const refCount = Array.isArray(contentTypeFieldValue)
        ? contentTypeFieldValue.length
        : contentTypeFieldValue
        ? 1
        : 0;
      isValid = refCount === Number(conditionValue);
      break;
    }
    case "reference count not equal": {
      const refCount = Array.isArray(contentTypeFieldValue)
        ? contentTypeFieldValue.length
        : contentTypeFieldValue
        ? 1
        : 0;
      isValid = refCount !== Number(conditionValue);
      break;
    }
    case "reference count between": {
      const refCount = Array.isArray(contentTypeFieldValue)
        ? contentTypeFieldValue.length
        : contentTypeFieldValue
        ? 1
        : 0;
      isValid =
        refCount >= Number(rule.conditionValueMin) &&
        refCount <= Number(rule.conditionValueMax);
      break;
    }
    case "includes entry":
    case "includes asset": {
      // Support both single (backward compatibility) and multiple entry/asset IDs
      const entryIds = rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);
      
      if (entryIds.length === 0) {
        isValid = false;
        break;
      }
      
      if (Array.isArray(contentTypeFieldValue)) {
        // Check if ANY of the selected entries/assets is in the reference field (OR logic)
        isValid = contentTypeFieldValue.some(
          (ref: any) => entryIds.includes(ref?.sys?.id)
        );
      } else if (contentTypeFieldValue?.sys?.id) {
        isValid = entryIds.includes(contentTypeFieldValue.sys.id);
      } else {
        isValid = false;
      }
      break;
    }
    
    // RichText field conditions
    case "includes": {
      const plainText = documentToPlainTextString(contentTypeFieldValue).toLowerCase().trim();
      isValid = plainText.includes(conditionValue.toLowerCase());
      break;
    }
    
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

  return sdk.contentType.fields
    // Hide if field is hidden for editing or show if `Show hidden fields` is enabled
    .filter((field) => !field.disabled || sdk.editor.getShowHiddenFields())
    .filter(
      (field) =>
        !isFieldHidden(
          field.id,
          sdk.contentType.sys.id,
          uniqueRulesList,
          entryId
        )
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
