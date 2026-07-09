import { EditorAppSDK, FieldAppSDK } from '@contentful/app-sdk';
import type { KeyValueMap } from 'contentful-management';
import { type Rule } from './types/Rule';

// Converts a field into <FieldAPI> data type, which is the expected data type for many API methods
const getFieldAPI = (fieldId: string, sdk: EditorAppSDK, locale: string) => sdk.entry.fields[fieldId].getForLocale(locale);

// Creates a <FieldAppSDK> type that can be passed to components from the default-field-editors package
export const getFieldAppSdk = (fieldId: string, sdk: EditorAppSDK, locale?: string) => {
  const fieldAPI = getFieldAPI(fieldId, sdk, locale || sdk.locales.default);
  return {
    ...sdk,
    field: fieldAPI,
    ids: { ...sdk.ids, field: fieldId },
  } as FieldAppSDK;
};

// Get localization setting for a field
export const getLocaleName = (sdk: EditorAppSDK, locale: string) => sdk.locales.names[locale];

// Check if a field is meant to be displayed conditionally
const isFieldHidden = (fieldId: string, contentType: string, rules: Rule[], entryId: string): boolean => {
  return !!rules.find(
    (rule) =>
      ((rule.isForSameEntity && rule.entryId === entryId) || (!rule.isForSameEntity && rule.entryId !== entryId)) &&
      rule.targetEntity === contentType &&
      rule.targetEntityField.includes(fieldId)
  );
};

interface EntryFieldValueAccessor {
  value?: unknown;
  getValue?: () => unknown;
}

interface LinkLikeValue {
  sys?: {
    id?: string;
    urn?: string;
  };
}

type EntryFields = Record<string, EntryFieldValueAccessor>;

const getReferenceCount = (value: unknown): number => (Array.isArray(value) ? value.length : value ? 1 : 0);

const getLinkId = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const linkValue = value as LinkLikeValue;
  return linkValue.sys?.id || linkValue.sys?.urn;
};

const getRuleLinkedEntryIds = (rule: Rule): string[] => rule.linkedEntryIds || (rule.linkedEntryId ? [rule.linkedEntryId] : []);

const toNumber = (value: unknown): number | null => {
  const parsedValue = typeof value === 'number' ? value : Number(value);
  return Number.isNaN(parsedValue) ? null : parsedValue;
};

const includesConditionValue = (fieldValue: unknown, conditionValue: string): boolean => {
  if (typeof fieldValue === 'string') {
    return fieldValue.includes(conditionValue);
  }

  if (Array.isArray(fieldValue)) {
    return fieldValue.includes(conditionValue);
  }

  return false;
};

const isEmptyFieldValue = (fieldValue: unknown): boolean => {
  if (Array.isArray(fieldValue)) {
    return fieldValue.length === 0;
  }

  return !fieldValue;
};

export const isRuleValid = (rule: Rule, entryFields: EntryFields, entryContentType: string) => {
  if (rule.contentType !== entryContentType) {
    return false;
  }

  const contentTypeField = rule.contentTypeField;

  if (!Object.prototype.hasOwnProperty.call(entryFields, contentTypeField)) {
    return false;
  }

  const condition = rule.condition;
  const conditionValue = rule.conditionValue;
  let isValid = false;

  //get content type field value
  const fieldValueSource = entryFields[contentTypeField];
  const contentTypeFieldValue = fieldValueSource.value ?? fieldValueSource.getValue?.();
  const numericFieldValue = toNumber(contentTypeFieldValue);
  const numericConditionValue = toNumber(conditionValue);
  const numericConditionValueMin = toNumber(rule.conditionValueMin);
  const numericConditionValueMax = toNumber(rule.conditionValueMax);
  const referenceCount = getReferenceCount(contentTypeFieldValue);
  const linkedEntryIds = getRuleLinkedEntryIds(rule);

  switch (condition) {
    case 'is equal':
      isValid = contentTypeFieldValue === conditionValue;
      break;
    case 'is not equal':
      isValid = contentTypeFieldValue !== conditionValue;
      break;
    // Text fields expose both labels, but they use the same substring semantics.
    case 'contains':
    case 'includes':
      isValid = includesConditionValue(contentTypeFieldValue, conditionValue);
      break;
    case 'less than':
      isValid = numericFieldValue !== null && numericConditionValue !== null && numericFieldValue < numericConditionValue;
      break;
    case 'greater than':
      isValid = numericFieldValue !== null && numericConditionValue !== null && numericFieldValue > numericConditionValue;
      break;
    case 'between':
      isValid =
        numericFieldValue !== null &&
        numericConditionValueMin !== null &&
        numericConditionValueMax !== null &&
        numericFieldValue >= numericConditionValueMin &&
        numericFieldValue <= numericConditionValueMax;
      break;
    case 'equal':
      isValid = numericFieldValue !== null && numericConditionValue !== null && numericFieldValue === numericConditionValue;
      break;
    case 'not equal':
      isValid = numericFieldValue !== null && numericConditionValue !== null && numericFieldValue !== numericConditionValue;
      break;
    case 'reference count less than':
      isValid = numericConditionValue !== null && referenceCount < numericConditionValue;
      break;
    case 'reference count greater than':
      isValid = numericConditionValue !== null && referenceCount > numericConditionValue;
      break;
    case 'reference count between':
      isValid =
        numericConditionValueMin !== null &&
        numericConditionValueMax !== null &&
        referenceCount >= numericConditionValueMin &&
        referenceCount <= numericConditionValueMax;
      break;
    case 'reference count equal':
      isValid = numericConditionValue !== null && referenceCount === numericConditionValue;
      break;
    case 'reference count not equal':
      isValid = numericConditionValue !== null && referenceCount !== numericConditionValue;
      break;
    case 'includes entry':
    case 'includes asset': {
      const fieldValues = Array.isArray(contentTypeFieldValue) ? contentTypeFieldValue : [contentTypeFieldValue];
      isValid = fieldValues.some((fieldValue) => {
        const linkId = getLinkId(fieldValue);
        return linkId ? linkedEntryIds.includes(linkId) : false;
      });
      break;
    }
    case 'is true':
      isValid = contentTypeFieldValue === true;
      break;
    case 'is false':
      isValid = contentTypeFieldValue === false;
      break;
    case 'is empty':
      isValid = isEmptyFieldValue(contentTypeFieldValue);
      break;
    case 'is not empty':
      isValid = !isEmptyFieldValue(contentTypeFieldValue);
      break;
    default:
      break;
  }

  return isValid;
};

export const calculateEditorFields = (entryId: string, entryFields: KeyValueMap, sdk: EditorAppSDK, isFirstLoad: boolean) => {
  // get rules from session storage & filter rules for current entryId
  const existingFilteredRules = JSON.parse(sessionStorage.getItem('filteredRules') || '[]').filter((rule: Rule) => rule.entryId !== entryId);

  const rules = sdk.parameters.installation.rules || ([] as Rule[]);
  const filteredRules: Rule[] = rules
    ?.filter((rule: Rule) => isRuleValid(rule, entryFields, sdk.contentType.sys.id))
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
    sessionStorage.setItem('filteredRules', JSON.stringify(uniqueRulesList));
  }

  return (
    sdk.contentType.fields
      // Hide if field is hidden for editing or show if `Show hidden fields` is enabled
      .filter((field) => !field.disabled || sdk.editor.getShowHiddenFields())
      .filter((field) => !isFieldHidden(field.id, sdk.contentType.sys.id, uniqueRulesList, entryId))
  );
};

//Get content type name from content type id
export const getContentTypeName = (contentTypeId: string, allContentTypes: any[]) => {
  return allContentTypes.find((contentType) => contentType.sys.id === contentTypeId)?.name;
};

export const getFieldName = (fieldId: string[], targetEntityId: string, allContentTypes: any[]) => {
  //get fields for content type
  const contentTypeFields = allContentTypes.find((contentType) => contentType.sys.id === targetEntityId)?.fields;
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

export const getSelectedTargetFields = ({ targetEntityFields, targetEntityField }: { targetEntityFields: any[]; targetEntityField: string[] }) => {
  return targetEntityFields.filter((field) => targetEntityField.includes(field.id)).map((field) => field.name);
};

// ----- Import / Export helpers -----

export interface InvalidImportedRule {
  rule: Rule;
  reasons: string[];
}

export interface ImportValidationResult {
  validRules: Rule[];
  invalidRules: InvalidImportedRule[];
}

// Strip runtime-only properties so the exported file only contains the persisted rule shape.
const toExportableRule = (rule: Rule): Rule => {
  const { entryId, ...rest } = rule;
  return rest as Rule;
};

// Build the JSON payload that is written to the exported configuration file.
export const buildExportPayload = (rules: Rule[]) => ({
  rules: (rules || []).map(toExportableRule),
});

// Parse the raw text of an imported configuration file into an array of rules.
// Accepts either a bare array of rules or an object of the shape { rules: [...] }.
export const parseImportedConfig = (raw: string): Rule[] => {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (error) {
    throw new Error('The selected file is not valid JSON.');
  }

  const rules = Array.isArray(data) ? data : (data as { rules?: unknown })?.rules;

  if (!Array.isArray(rules)) {
    throw new Error('Invalid configuration file: expected an array of rules or an object with a "rules" array.');
  }

  return rules as Rule[];
};

// Validate that every imported rule references content types and fields that exist
// in the current environment. Rules that fail validation are reported with reasons.
export const validateImportedRules = (rules: Rule[], allContentTypes: any[]): ImportValidationResult => {
  const validRules: Rule[] = [];
  const invalidRules: InvalidImportedRule[] = [];

  const findContentType = (id: string) => allContentTypes.find((contentType) => contentType.sys.id === id);
  const fieldExists = (contentType: any, fieldId: string) => !!contentType?.fields?.some((field: any) => field.id === fieldId);

  rules.forEach((rule) => {
    if (
      !rule ||
      typeof rule !== 'object' ||
      !rule.contentType ||
      !rule.contentTypeField ||
      !rule.condition ||
      !rule.targetEntity ||
      !Array.isArray(rule.targetEntityField) ||
      rule.targetEntityField.length === 0
    ) {
      invalidRules.push({ rule, reasons: ['Rule is missing required properties'] });
      return;
    }

    const reasons: string[] = [];

    const sourceContentType = findContentType(rule.contentType);
    if (!sourceContentType) {
      reasons.push(`Content type "${rule.contentType}" does not exist`);
    } else if (!fieldExists(sourceContentType, rule.contentTypeField)) {
      reasons.push(`Field "${rule.contentTypeField}" does not exist on content type "${rule.contentType}"`);
    }

    const targetContentType = findContentType(rule.targetEntity);
    if (!targetContentType) {
      reasons.push(`Target content type "${rule.targetEntity}" does not exist`);
    } else {
      const missingFields = rule.targetEntityField.filter((fieldId) => !fieldExists(targetContentType, fieldId));
      if (missingFields.length) {
        reasons.push(`Field(s) ${missingFields.map((fieldId) => `"${fieldId}"`).join(', ')} do not exist on content type "${rule.targetEntity}"`);
      }
    }

    if (reasons.length) {
      invalidRules.push({ rule, reasons });
    } else {
      validRules.push(rule);
    }
  });

  return { validRules, invalidRules };
};

// Determine whether two rules describe the same condition/target, ignoring ordering of target fields.
const isSameRule = (a: Rule, b: Rule): boolean => {
  const sortedFields = (rule: Rule) => [...(rule.targetEntityField || [])].sort().join('|');
  return (
    a.contentType === b.contentType &&
    a.contentTypeField === b.contentTypeField &&
    a.condition === b.condition &&
    a.conditionValue === b.conditionValue &&
    a.targetEntity === b.targetEntity &&
    a.isForSameEntity === b.isForSameEntity &&
    sortedFields(a) === sortedFields(b)
  );
};

// Merge incoming rules into existing ones, skipping duplicates.
export const mergeRules = (existing: Rule[], incoming: Rule[]): Rule[] => {
  const merged = [...(existing || [])];

  (incoming || []).forEach((rule) => {
    if (!merged.some((existingRule) => isSameRule(existingRule, rule))) {
      merged.push(rule);
    }
  });

  return merged;
};
