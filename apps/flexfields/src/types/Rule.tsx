export type Rule = {
  contentType: string;
  contentTypeField: string;
  condition: string;
  conditionValue: string;
  conditionValueMin?: string;
  conditionValueMax?: string;
  linkedEntryId?: string; // Kept for backward compatibility
  linkedEntryIds?: string[]; // New: support multiple entries
  isForSameEntity: boolean;
  targetEntity: string;
  targetEntityField: string[];
  entryId?: string;
};
