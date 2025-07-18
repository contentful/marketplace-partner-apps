import { useDefaultCBSConfig } from '@/utils/hooks';
import { DialogAppSDK } from '@contentful/app-sdk';
import { /* useCMA, */ useSDK } from '@contentful/react-apps-toolkit';
import { useEffect } from 'react';

const ContentBrowserDialog = () => {
  const sdk = useSDK<DialogAppSDK>();
  const defaultConfig = useDefaultCBSConfig();

  console.log(sdk.parameters, defaultConfig);

  useEffect(() => {
    window.OrangeDAMContentBrowser.open({
      ...defaultConfig,
      onAssetSelected: (assets) => {
        sdk.close(assets[0]);
      },
      extraFields: [
        ...(defaultConfig.extraFields ?? []),
        "Document.Identifier",
        "CoreField.OriginalFilename",
        "CoreField.Title",
        "CoreField.alternative-description",
        "CoreField.Description",
        "CoreField.TitleWithFallback",
        "CoreField.DocType",
        "CoreField.LargeSizePreview",
        "CoreField.OriginalPreview",
        "Document.FileExtension",
        "ScrubUrl",
      ],
      containerId: "orange-dam-content-browser",
      pluginName: "Orange Logic Content Browser",
      showCollections: true
    });
  }, []);

  return <div id="orange-dam-content-browser" className="w-full h-svh"></div>;
};

export default ContentBrowserDialog;
