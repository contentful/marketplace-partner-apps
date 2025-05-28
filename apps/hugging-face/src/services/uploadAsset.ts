import { PageAppSDK } from '@contentful/app-sdk';

const getDefaultLocale = async (sdk: PageAppSDK) => {
  const locales = await sdk.cma.locale.getMany({ spaceId: sdk.ids.space });
  const defaultLocale = locales.items.find((locale) => locale.default);
  if (!defaultLocale && locales.items.length === 0) {
    throw new Error('No locales found in the space');
  }
  return defaultLocale?.code || locales.items[0].code;
};

const createAsset = async ({
  sdk,
  initialPrompt,
  assetName,
  generatedImage,
}: {
  sdk: PageAppSDK;
  initialPrompt: string;
  assetName: string;
  generatedImage: string;
}) => {
  const imageName = assetName || 'ai-generated-image';
  const fileName = `${imageName}.png`;
  const response = await fetch(generatedImage);
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: 'image/png' });
  const buffer = await file.arrayBuffer();
  const upload = await sdk.cma.upload.create({ spaceId: sdk.ids.space }, { file: buffer });
  const defaultLocale = await getDefaultLocale(sdk);

  return await sdk.cma.asset.create(
    { spaceId: sdk.ids.space },
    {
      fields: {
        title: {
          [defaultLocale]: imageName,
        },
        description: {
          [defaultLocale]: `Generated from prompt: ${initialPrompt}`,
        },
        file: {
          [defaultLocale]: {
            contentType: 'image/png',
            fileName: fileName,
            uploadFrom: {
              sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
            },
          },
        },
      },
    }
  );
};

export const uploadAsset = async ({
  sdk,
  initialPrompt,
  assetName,
  generatedImage,
}: {
  sdk: PageAppSDK;
  initialPrompt: string;
  assetName: string;
  generatedImage: string | null;
}) => {
  if (!generatedImage) return;
  try {
    const newAsset = await createAsset({ sdk, initialPrompt, assetName, generatedImage });
    const defaultLocale = await getDefaultLocale(sdk);
    const processedAsset = await sdk.cma.asset.processForLocale({ spaceId: sdk.ids.space }, newAsset, defaultLocale);
    await sdk.cma.asset.publish({ spaceId: sdk.ids.space, assetId: processedAsset.sys.id }, processedAsset);

    sdk.notifier.success('Image saved to media library');
  } catch (error) {
    sdk.notifier.error(error instanceof Error ? error.message : 'Failed to upload asset');
  }
};
