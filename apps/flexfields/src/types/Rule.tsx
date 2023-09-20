export type Rule = {
  contentType: string;
  contentTypeField: string;
  condition: string;
  conditionValue: string;
  targetEntity: string;
  targetEntityField: string[];
  entryId?: string;
};
