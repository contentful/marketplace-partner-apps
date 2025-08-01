import { AITagItem } from './AITag';
import { EmbeddedMetadataValues } from './Metadata';
import { ExtensionStatus } from './ExtensionStatus';
import { FileVersionInfo } from './FileVersion';
import { CreatedBy } from './User';

export interface ImageKitAsset {
  AITags: AITagItem[] | null;
  createdAt: string;
  customCoordinates: string | null;
  customMetadata: any;
  embeddedMetadata: EmbeddedMetadataValues;
  fileId: string;
  filePath: string;
  fileType: string;
  hasAlpha: boolean;
  height: number;
  isPrivateFile: boolean;
  isPublished: boolean;
  mime?: string;
  name: string;
  size: number;
  tags: string[] | null;
  thumbnail: string;
  type: string;
  updatedAt: string;
  url: string;
  imagekitId?: string;
  width: number;
  extensionStatus?: ExtensionStatus;
  versionInfo: FileVersionInfo;
  createdBy?: CreatedBy;
  permission?: any;
  previewUrl?: string;
}
