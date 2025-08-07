import AssetCard from '@/components/AssetCard';
import { FieldAppSDK } from '@contentful/app-sdk';
import { Card } from '@contentful/f36-components';
import { useSDK } from '@contentful/react-apps-toolkit';
import { useLayoutEffect, useState } from 'react';
import OLMiniIco from '../logos/OL-mini.ico';

const Field = () => {
  const sdk = useSDK<FieldAppSDK>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asset, setAsset] = useState<OrangeDamAssetInfo | null>(sdk.field.getValue() || null);

  useLayoutEffect(() => {
    sdk.window.startAutoResizer();
    return () => sdk.window.stopAutoResizer();
  }, []);

  const onImport = async () => {
    try {
      const importAsset = await sdk.dialogs.openCurrentApp({
        position: "center",
        minHeight: "90vh",
        width: 'fullWidth',
        shouldCloseOnEscapePress: true,
        shouldCloseOnOverlayClick: true,
      });

      if (!!importAsset) {
        setError(null);
        setIsLoading(true);

        // Begin asset import
        await sdk.field.setValue(importAsset);
        setAsset(importAsset);

        setIsLoading(false)
      }
    }
    catch (error: any) {
      if (typeof error === 'object' && typeof error["code"] === "string") {
        if (error["code"] === "AssetProcessingTimeout") {
          setError("The asset processing has timed out. The file might be too large, or there could be a network issue.");
          return
        }
      }
      setError("Unknown error occured. Your file might not be imported correctly.");
      console.error(error);
    }
  }

  const onItemRemove = async () => {
    setIsLoading(true)

    await sdk.field.removeValue();
    setAsset(null);

    setIsLoading(false);
  }

  return <div className='flex flex-col items-start justify-left h-full w-full gap-4' data-testid="field-component">
    {
      asset && (
        <Card className='max-w-max p-0! block overflow-hidden' data-testid="asset-card">
          <AssetCard isLoading={isLoading} asset={asset} onItemRemove={onItemRemove} />
        </Card>
      )
    }
    <button className="text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2 mb-2"
      disabled={isLoading}
      onClick={onImport}
      type="button"
      data-testid="import-asset-button">
      {
        isLoading
          ? <>
            <svg aria-hidden="true" className="w-6 h-6 me-2 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" /><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" /></svg>
            Importing Asset...
          </>
          : <>
            <img className="w-6 h-6 me-2"
              src={OLMiniIco}
              alt="OrangeDAM" />
            Browse OrangeDAM
          </>
      }
    </button>
    {
      !!error && !isLoading &&
      <div className="flex items-center py-1 mb-1 text-sm text-red-800 rounded-lg dark:text-red-400" role="alert" data-testid="error-message">
        <svg className="shrink-0 inline w-4 h-4 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
        </svg>
        <div>
          {error}
        </div>
      </div>
    }
  </div>
};

export default Field;
