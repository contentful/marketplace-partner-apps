export type Rule = {
  contentType: string;
  contentTypeField: string;
  condition: string;
  conditionValue: string;
  isForSameEntity: boolean;
  targetEntity: string;
  targetEntityField: string[];
  entryId?: string;
};
