import { useState, useEffect } from 'react';
import { PageAppSDK } from '@contentful/app-sdk';
import { useSDK } from '@contentful/react-apps-toolkit';
import { generateImage } from '../services/huggingfaceImage';
import { refinePrompt } from '../services/huggingfaceText';
import { AppInstallationParameters } from '../utils/types';
import { GenerateImageModal } from '../components/GenerateImageModal/GenerateImageModal';
import { RefinePromptModal } from '../components/RefinePromptModal/RefinePromptModal';
import { InitialPrompt } from '../components/InitialPrompt/InitialPrompt';

const Page = () => {
  const sdk = useSDK<PageAppSDK>();
  const [initialPrompt, setInitialPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // const [isUploading, setIsUploading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showModal, setShowModal] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isTimerActive) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerActive]);

  const handleRefinePrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialPrompt.trim()) return;

    setIsRefining(true);
    setError(null);
    try {
      const parameters = sdk.parameters.installation as AppInstallationParameters;
      if (!parameters) {
        throw new Error('App is not properly configured');
      }

      const optimizedPrompt = await refinePrompt(initialPrompt, parameters);
      setRefinedPrompt(optimizedPrompt);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to refine prompt');
    } finally {
      setIsRefining(false);
    }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptToUse = refinedPrompt || initialPrompt;
    if (!promptToUse.trim()) return;

    setIsGenerating(true);
    setError(null);
    setTimer(0);
    setIsTimerActive(true);
    try {
      const parameters = sdk.parameters.installation as AppInstallationParameters;
      if (!parameters) {
        throw new Error('App is not properly configured');
      }

      const imageBlob = await generateImage(initialPrompt, parameters, refinedPrompt);
      const imageUrl = URL.createObjectURL(imageBlob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setIsTimerActive(false);
    }
  };

  // const handleUploadAsset = async () => {
  //   if (!generatedImage) return;

  //   setIsUploading(true);
  //   setError(null);

  //   try {
  //     const response = await fetch(generatedImage);
  //     const blob = await response.blob();
  //     const file = new File([blob], 'ai-generated-image.png', { type: 'image/png' });
  //     const buffer = await file.arrayBuffer();
  //     const upload = await sdk.cma.upload.create({ spaceId: sdk.ids.space }, { file: buffer });

  //     let asset = await sdk.cma.asset.create(
  //       { spaceId: sdk.ids.space },
  //       {
  //         fields: {
  //           title: {
  //             'en-US': 'AI Generated Image',
  //           },
  //           description: {
  //             'en-US': `Generated from prompt: ${initialPrompt}`,
  //           },
  //           file: {
  //             'en-US': {
  //               contentType: 'image/png',
  //               fileName: 'ai-generated-image.png',
  //               uploadFrom: {
  //                 sys: { type: 'Link', linkType: 'Upload', id: upload.sys.id },
  //               },
  //             },
  //           },
  //         },
  //       }
  //     );

  //     asset = await sdk.cma.asset.processForLocale({ spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version }, asset, 'en-US');
  //     asset = await sdk.cma.asset.publish({ spaceId: sdk.ids.space, assetId: asset.sys.id, version: asset.sys.version }, asset);

  //     sdk.notifier.success('Asset successfully uploaded and published');
  //   } catch (error) {
  //     console.error('Error uploading asset:', error);
  //     setError(error instanceof Error ? error.message : 'Failed to upload asset');
  //     sdk.notifier.error('Failed to upload asset');
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  return (
    <>
      <InitialPrompt
        initialPrompt={initialPrompt}
        setInitialPrompt={setInitialPrompt}
        isDisabled={isRefining || isGenerating}
        onClickRefinePrompt={(event) => {
          setShowModal('refine-prompt');
          handleRefinePrompt(event);
        }}
        onClickGenerateImage={(event) => {
          setShowModal('generate-image');
          handleGenerateImage(event);
        }}
      />
      <RefinePromptModal
        showRefinePromptModal={showModal === 'refine-prompt'}
        refinedPrompt={refinedPrompt}
        isRefining={isRefining}
        setRefinedPrompt={setRefinedPrompt}
        error={error}
        onSubmitRefinedPrompt={(event) => {
          setShowModal('generate-image');
          handleGenerateImage(event);
        }}
        closeRefinePromptModal={() => {
          setShowModal(null);
          setRefinedPrompt('');
          setError(null);
        }}
      />

      <GenerateImageModal
        showGeneratingImageModal={showModal === 'generate-image'}
        prompt={refinedPrompt || initialPrompt}
        generatedImage={generatedImage}
        error={error}
        timer={timer}
        isGenerating={isGenerating}
        onClickNextAfterImageGeneration={(event) => {
          setShowModal(null);
          // handleUploadAsset();
        }}
        onRetryImageGeneration={(event) => {
          setGeneratedImage(null);
          setError(null);
          handleGenerateImage(event);
        }}
        closeGeneratingImageModal={() => {
          setShowModal(null);
          setGeneratedImage(null);
          setError(null);
          setRefinedPrompt('');
        }}
      />
    </>
  );
};

export default Page;
