interface MappedExtraField {
  title: string;
  thumbnailUrl?: string;
  docType: string;
  id: string;
  extension?: string;
  scrubUrl?: string;
};

interface OrangeDamAssetInfo {
    imageUrl: string,
    metadata?: { [key: string]: string },
    extraFields: { [key: string]: string }
}

interface OrangeDAMContentBrowserConfig {
  onAssetSelected?: (images: OrangeDamAssetInfo[]) => void;
  onError?: (errorMessage?: string, error?: Error) => void;
  onClose?: () => void;
  multiSelect?: boolean;
  availableDocTypes?: string[];
  containerId?: string;
  extraFields?: string[];
  baseUrl?: string;
  onlyIIIFPrefix?: boolean;
  displayInfo?: any;
  importProxy?: string;
  showCollections?: boolean;
  allowTracking?: boolean;
  pluginName?: string;
  ctaText?: string;
}

interface Window {
  sfdc: {
    BlockSDK: new (config: {
      tabs: string[]
    }) => BlockSDK;
  },
  blockSDK: BlockSDK,
  imageBlockSetting: ImageBlockData,
  OrangeDAMContentBrowser: {
    help: () => void
    open: (config: OrangeDAMContentBrowserConfig) => void
  }
}
