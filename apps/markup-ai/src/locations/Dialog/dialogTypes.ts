import type { Document } from "@contentful/rich-text-types";

export interface FieldCheckDialogParams {
  fieldCheck: boolean;
  /** Field content - string for Text/Symbol, Document for RichText */
  fieldContent: string | Document;
  /** The field type from Contentful SDK (Symbol, Text, RichText, etc.) */
  fieldFormat: string;
  fieldId: string;
  contentTypeId: string;
  /**
   * Value of the entry's displayField (the content-type's title field).
   * Forwarded into the agentic scan request as `document_name`, and used
   * to derive `document_ref`. Optional — entries without a configured
   * displayField or with an empty title fall through to a ref-less scan.
   */
  entryTitle?: string;
}
