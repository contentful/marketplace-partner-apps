import { Document } from '@contentful/rich-text-types';

export interface ConvertRequest {
  spaceId: string;
  html: string;
  useWrapper: boolean;
}

export interface ConvertResponse {
  richText: Document;
  images: EmbeddedAsset[];
}

export interface EmbeddedAsset {
  assetId: string;
  assetUrl: string;
  assetBase64: string | null;
  assetAlt: string;
  contentWrapperId: string | null;
}

export interface ImportState {
  source?: DocumentSource | null;
  html?: string | null;
  markdown?: string | null;
  richText?: Document | null;
  images?: EmbeddedAsset[] | null;
  imageUploadResult?: ImageProcessResult | null;
}

export interface ImageProcessResult {
  success: boolean;
  failedImages: EmbeddedAsset[];
}

export enum DocumentSource {
  Paste = 1,
  GoogleDrivePicker = 2,
  GoogleDocPaste = 3,
}

export interface GoogleDrivePickerResult {
  html: string;
  markdown: string;
}

export interface RtfField {
  contentTypeId: string;
  contentTypeName: string;
  fieldId: string;
  fieldName: string;
  isEnabled: boolean;
}
