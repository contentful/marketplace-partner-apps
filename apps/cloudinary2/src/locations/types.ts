import { MediaLibraryResult } from '../types';

export interface MediaLibraryOptions {
  cloud_name: string;
  api_key: string;
  max_files: number;
  multiple: boolean;
  inline_container: string | HTMLElement;
  remove_header: boolean;
  default_transformations: unknown[];
  integration: {
    platform: string;
    type: string;
    version: string;
    environment: string;
  };
}
export interface MediaLibraryInstance {
  show: (options?: ShowOptions) => void;
}
export interface AssetId {
  resource_type: string;
  type: string;
  public_id: string;
}
export interface ShowOptions {
  folder?: {
    path: string;
  };
  asset?: AssetId;
  remove_upload_operation?: boolean;
}
export interface MediaEditorWidgetAsset {
  publicId: string;
  resourceType: string;
  type: string;
}
export interface MediaEditorWidgetUpdateOptions {
  cloudName: string;
  publicIds: Array<MediaEditorWidgetAsset | string>;
  [key: string]: unknown;
}
export interface MediaEditorWidgetExportData {
  transformation: string;
  assets: [
    {
      url: string;
    },
  ];
}

export type MediaEditorWidgetExportCallback = (data: MediaEditorWidgetExportData) => void;

export interface MediaEditorWidget {
  update: (options?: MediaEditorWidgetUpdateOptions) => void;
  show: (options?: Record<string, unknown>) => void;
  hide: () => Promise<void>;
  onSign: (callback: Function) => void;
  replace: (config: Record<string, any>) => void;
  on(action: 'export', callback: MediaEditorWidgetExportCallback): void;
  on(event: string, callback: (data: Record<string, unknown>) => void): void;
  triggerExport: () => void;
  getConfig: () => Record<string, any> | undefined;
  getErrors: () => any[];
  getEvents: () => Record<string, Function>;
  getIframe: () => Promise<HTMLIFrameElement>;
  getVersion: () => string;
}

declare global {
  interface Window {
    cloudinary: {
      /** Incomplete types */
      openMediaLibrary: VoidFunction;

      /** Incomplete types */
      mediaEditor: (options?: Record<string, unknown>) => MediaEditorWidget;

      /** Incomplete types */
      createMediaLibrary: (
        options: MediaLibraryOptions,
        callbacks: {
          insertHandler: (data: MediaLibraryResult) => void;
        },
      ) => MediaLibraryInstance;
    };
  }
}
