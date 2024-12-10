export interface ConvertResponse {
  richText: Document;
  images: EmbeddedAsset[];
}

export interface EmbeddedAsset {
  assetId: string;
  assetUrl: string;
  assetAlt: string | null;
  contentWrapperId: string | null;
}

export interface ConvertRequest {
  spaceId: string;
  html: string;
  useWrapper: boolean;
}
