import type { FunctionEventContext } from "@contentful/node-apps-toolkit";

export interface BynderResponse {
  status: number;
  error?: Object;
  data?: Asset | BynderAssetUsageResponse | Object;
}
export interface BynderAuthConfig {
  bynderURL: string;
  clientId: string;
  clientSecret: string;
}

export interface TokenCacheEntry {
  accessToken: string;
  expiresAt: number; // epoch ms
}

export interface BynderTokenResponse {
  access_token: string;
  expires_in?: number;
  token_type?: string;
}

export interface Asset {
  id: string;
  name: string;
  fileSize: number;
  description?: string;
  type: string;
  idHash?: string;
  tags?: string[];
  src: string;
  width?: number;
  height?: number;
  archive?: boolean;
  brandId?: string;
  limited?: boolean;
  isPublic?: boolean;
  original?: string;
  copyright?: string;
  extension?: string[];
  orientation?: string;
  watermarked?: boolean;
  thumbnails?: any;
  videoPreviewURLs?: string[];
  textMetaproperties?: Array<{ name: string; value: string; [key: string]: any } | string>;
  userCreated?: string;
  activeOriginalFocusPoint?: any;
  dateCreated: string;
  dateModified: string;
  datePublished?: string;
  transformBaseUrl?: string;
  propertyOptions?: string[];
  property_Campaign?: string[];
  property_File_extension?: string[];
  property_Department?: string[];
  property_Industry?: string[];
  property_Language?: string[];
  property_Usage_Rights?: string[];
  property_Asset_Type?: string[];
  property_Asset_SubType?: string[];
  relatedAssets?: any[];
  mediaItems?: any[];
}

export interface BynderFunctionEventContext extends FunctionEventContext {
  bynderAccessToken?: string;
}

// App Event related types
export interface AppEventPayload {
  sys: {
    type: string;
    id: string;
    space: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
    environment: {
      sys: {
        id: string;
        type: string;
        linkType: string;
      };
    };
    contentType?: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
    createdBy?: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
    updatedBy?: {
      sys: {
        type: string;
        linkType: string;
        id: string;
      };
    };
    revision?: number;
    createdAt?: string;
    updatedAt?: string;
  };
  fields?: Record<string, any>;
}

export interface AppEventContext {
  eventType: string;
  entityType: string;
  entityId: string;
  spaceId: string;
  environmentId: string;
  userId?: string;
  timestamp: string;
}

export interface BynderAssetUsageEvent {
  assetId: string;
  entryId: string;
  contentTypeId: string;
  fieldId: string;
  action: "added" | "removed" | "updated";
  timestamp: string;
  spaceId: string;
  environmentId: string;
}

// Bynder Asset Usage API types
export interface BynderIntegration {
  id: string;
  description: string;
}

export interface BynderAssetUsage {
  asset_id: string;
  id: string;
  integration: BynderIntegration;
  timestamp: string;
  uri: string | null;
  additional: string | null;
}

export type BynderAssetUsageResponse = BynderAssetUsage[];
