import type { Document } from "@contentful/rich-text-types";

export interface FieldCheckDialogParams {
  fieldCheck: boolean;
  /** Field content - string for Text/Symbol, Document for RichText */
  fieldContent: string | Document;
  /** The field type from Contentful SDK (Symbol, Text, RichText, etc.) */
  fieldFormat: string;
  fieldId: string;
  contentTypeId: string;
}
