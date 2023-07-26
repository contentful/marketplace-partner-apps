export interface AppInstallationParameters {
  cloudName: string;
  apiKey: string;
  maxFiles: number;
  startFolder: string;
  quality: string;
  format: string;
}

/**
 * Auto-generated, might not be accurate
 */
export type CloudinaryAsset = {
  url: string;
  tags: string[];
  type: string;
  bytes: number;
  width: number;
  format: string;
  height: number;
  version: number;
  duration: number | null;
  metadata: string[];
  public_id: string;
  created_at: string;
  secure_url: string;
  resource_type: string;
  original_url?: string;
  original_secure_url?: string;
  raw_transformation?: string;
};

/**
 * Auto-generated, might not be accurate
 */
export interface MLResult {
  assets: MLResultAsset[];
  mlId: string;
}

export interface MLResultAsset {
  public_id: string;
  resource_type: string;
  type: string;
  format: string;
  version: number;
  url: string;
  secure_url: string;
  width: number;
  height: number;
  bytes: number;
  duration: null;
  tags: unknown[];
  metadata: unknown[];
  created_at: string;
  derived: MLResultDerived[];
  access_mode: string;
  access_control: unknown[];
  created_by: MLResultActor;
  uploaded_by: MLResultActor;
}

export interface MLResultActor {
  type: string;
  id: string;
}

export interface MLResultDerived {
  url: string;
  secure_url: string;
  raw_transformation: string;
}
