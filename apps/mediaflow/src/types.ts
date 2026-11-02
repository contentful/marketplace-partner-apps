/**
 * A custom field as configured in Mediaflow, with its value for one file
 */
export interface CustomField {
  fieldId: number | string;
  title: string;
  value: string | string[] | null;
}

/**
 * The crop area the file selector returns for cropped images
 */
export interface CropCoordinates {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * The value of a Mediaflow field: the file selector result plus what the app adds to it
 */
export interface MediaflowFileData {
  id: number | string;
  basetype?: string;
  name?: string;
  filename?: string;
  filetype?: string;
  filesize?: number;
  url?: string;
  folderId?: number | string | null;
  description?: string;
  altText?: string;
  alttext?: string;
  photographer?: string;
  instructions?: string;
  additionalInfo?: string;
  keywords?: string[];
  customFields?: CustomField[];
  width?: number | string;
  height?: number | string;
  thumbPreview?: string;
  smallPreview?: string;
  mediumPreview?: string;
  embedMethod?: string;
  embedCode?: string;
  canvasWidth?: number;
  canvasHeight?: number;
  cropCoordinates?: CropCoordinates;
  cropWidth?: number;
  cropHeight?: number;
  isCropped?: boolean;
  resourceId?: string;
  isMediaflowAsset?: boolean;
}

/**
 * The app's installation parameters, set on the configuration screen
 */
export interface InstallationParameters {
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  showMediaflowLinks?: boolean;
}

/**
 * The result of checking whether the stored metadata matches Mediaflow. type is a Forma 36 Badge variant
 */
export interface MetadataCheck {
  type: "positive" | "warning" | "negative";
  value: string;
  /** OPTIONAL, the status text shown on the card instead of the default for type */
  label?: string;
}
