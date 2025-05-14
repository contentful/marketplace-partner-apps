import { PageAppSDK } from '@contentful/app-sdk';

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

  return await sdk.cma.asset.create(
    { spaceId: sdk.ids.space },
    {
      fields: {
        title: {
          'en-US': imageName,
        },
        description: {
          'en-US': `Generated from prompt: ${initialPrompt}`,
        },
        file: {
          'en-US': {
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
    const processedAsset = await sdk.cma.asset.processForLocale({ spaceId: sdk.ids.space }, newAsset, 'en-US');
    await sdk.cma.asset.publish({ spaceId: sdk.ids.space, assetId: processedAsset.sys.id }, processedAsset);

    sdk.notifier.success('Image saved to media library');
  } catch (error) {
    sdk.notifier.error(error instanceof Error ? error.message : 'Failed to upload asset');
  }
};
