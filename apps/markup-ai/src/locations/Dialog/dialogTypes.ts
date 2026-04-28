import { ScoreOutput } from "../../api-client";
import type { ContentTypeSettings } from "../../types/appConfig";
import type { Document } from "@contentful/rich-text-types";

export interface RewriteDialogParams {
  startRewrite: boolean;
  fieldId: string;
  original: string;
  originalScore?: number | null;
}

export interface MoreDetailsDialogParams {
  scores: ScoreOutput;
}

export interface FieldCheckDialogParams {
  fieldCheck: boolean;
  /** Field content - string for Text/Symbol, Document for RichText */
  fieldContent: string | Document;
  /** The field type from Contentful SDK (Symbol, Text, RichText, etc.) */
  fieldFormat: string;
  fieldId: string;
  contentTypeId: string;
  /** Content type default settings from app installation parameters */
  contentTypeDefaults?: ContentTypeSettings;
}
